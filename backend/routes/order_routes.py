from flask import request, jsonify
from datetime import date
import random
from . import order_bp
from models import db
from models.order import Order, OrderItem
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from models.prescription import Prescription
from utils.auth_middleware import token_required, admin_required


@order_bp.route('', methods=['POST'])
@token_required
def create_order(current_user):
    """
    Users place separate orders for Pharmacy A or Pharmacy B.
    Validations:
    - Checks stock and non-missing pricing/expiry before placing.
    - Prevents ordering more than available stock (aggregating duplicate line items).
    - Rejects expired stock batches from being ordered.
    - Enforces verified prescription requirement before ordering Rx medicines.
    """
    data = request.get_json() or {}
    pharmacy_name = data.get('pharmacy')  # 'Pharmacy A' or 'Pharmacy B'
    items = data.get('items', [])
    delivery_address = data.get('delivery_address') or current_user.address
    prescription_id = data.get('prescription_id')

    if not pharmacy_name or not items:
        return jsonify({'error': 'Pharmacy and order items are required.'}), 400

    if not delivery_address or not str(delivery_address).strip():
        return jsonify({'error': 'Delivery address is required.'}), 400

    pharma = Pharmacy.query.filter_by(name=pharmacy_name).first()
    if not pharma:
        return jsonify({'error': f'Selected pharmacy {pharmacy_name} not found.'}), 404

    total_amount = 0.0
    validated_items = []
    qty_by_inv = {}

    for it in items:
        inv_id = it.get('inventory_id')
        try:
            qty = int(it.get('quantity', 1))
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid item quantity.'}), 400

        if qty <= 0:
            return jsonify({'error': 'Quantity must be at least 1.'}), 400

        inv = Inventory.query.get(inv_id) if inv_id else None
        if not inv:
            med_id = it.get('medicine_id')
            inv = Inventory.query.filter(
                Inventory.medicine_id == med_id,
                Inventory.pharmacy_id == pharma.id,
                Inventory.expiry_date.isnot(None),
                Inventory.expiry_date >= date.today(),
                Inventory.quantity.isnot(None),
                Inventory.quantity >= qty,
                Inventory.price.isnot(None)
            ).first()

        if not inv or inv.pharmacy_id != pharma.id:
            return jsonify({'error': f"Item '{it.get('name', 'Unknown')}' is not available in {pharmacy_name}."}), 400

        if inv.is_expired():
            return jsonify({'error': f"Batch '{inv.batch_number}' for {inv.medicine.name} has expired and cannot be dispensed."}), 400

        if inv.quantity is None or inv.price is None or inv.expiry_date is None:
            return jsonify({'error': f"'{inv.medicine.name}' does not have complete verified stock/price/expiry data and cannot be ordered."}), 400

        qty_by_inv[inv.id] = qty_by_inv.get(inv.id, 0) + qty
        if qty_by_inv[inv.id] > inv.quantity:
            return jsonify({'error': f"Requested quantity ({qty_by_inv[inv.id]}) exceeds available stock ({inv.quantity}) for {inv.medicine.name}."}), 400

        # Prescription verification check for Rx medicines
        if inv.medicine and inv.medicine.prescription_required:
            if prescription_id:
                verified_rxs = Prescription.query.filter_by(
                    id=prescription_id,
                    user_id=current_user.id,
                    status='Verified'
                ).all()
            else:
                verified_rxs = Prescription.query.filter_by(
                    user_id=current_user.id,
                    status='Verified'
                ).all()

            if not verified_rxs:
                return jsonify({
                    'error': f"Verified prescription required before ordering '{inv.medicine.name}'. Please upload a prescription and wait for admin verification."
                }), 400

            # Ensure verified prescription(s) actually cover this Rx medicine
            ordered_med_lower = (inv.medicine.name or '').strip().lower()
            ordered_generic_lower = (inv.medicine.generic_name or '').strip().lower()
            confirmed_med_names = []
            for rx in verified_rxs:
                for pm in rx.medicines:
                    pm_name = (pm.medicine_name or '').strip().lower()
                    if pm_name and len(pm_name) >= 2 and 'unable to detect' not in pm_name and pm.is_confirmed:
                        confirmed_med_names.append(pm_name)

            if not confirmed_med_names:
                return jsonify({
                    'error': f"Your verified prescription has no confirmed readable medicines for '{inv.medicine.name}'. Admin must confirm the medicine name during verification."
                }), 400

            matched = any(
                pm_name in ordered_med_lower
                or ordered_med_lower in pm_name
                or (ordered_generic_lower and (pm_name in ordered_generic_lower or ordered_generic_lower in pm_name))
                for pm_name in confirmed_med_names
            )
            if not matched:
                return jsonify({
                    'error': f"Verified prescription required specifically for '{inv.medicine.name}'. Your verified prescription(s) cover: {', '.join(sorted(set(confirmed_med_names)))}."
                }), 400

        subtotal = round(inv.price * qty, 2)
        total_amount += subtotal

        validated_items.append({
            'inventory': inv,
            'medicine_name': inv.medicine.name,
            'strength': inv.medicine.strength,
            'quantity': qty,
            'unit_price': inv.price,
            'subtotal': subtotal
        })

    # Generate unique Order ID
    suffix = 'A' if 'A' in pharmacy_name else 'B'
    order_id = f"ORD-{random.randint(1000, 9999)}{suffix}"
    while Order.query.get(order_id):
        order_id = f"ORD-{random.randint(1000, 9999)}{suffix}"

    order = Order(
        id=order_id,
        user_id=current_user.id,
        pharmacy_id=pharma.id,
        total_amount=round(total_amount, 2),
        delivery_address=str(delivery_address).strip(),
        payment_status='Pending',
        payment_method=str(data.get('payment_method') or 'PhonePe UPI (Demo)')[:50],
        order_status='Order Placed'
    )
    db.session.add(order)

    for v in validated_items:
        oi = OrderItem(
            order_id=order.id,
            inventory_id=v['inventory'].id,
            medicine_name=v['medicine_name'],
            strength=v['strength'],
            quantity=v['quantity'],
            unit_price=v['unit_price'],
            subtotal=v['subtotal']
        )
        db.session.add(oi)

    db.session.commit()

    return jsonify({
        'message': f'Order {order.id} placed successfully with {pharmacy_name}.',
        'order': order.to_dict()
    }), 201


@order_bp.route('/my', methods=['GET'])
@token_required
def get_my_orders(current_user):
    """Get orders belonging to the currently authenticated user."""
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200


@order_bp.route('/all', methods=['GET'])
@token_required
@admin_required
def get_all_orders(current_user):
    """Admin: Get all orders across Pharmacy A and Pharmacy B."""
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200


@order_bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    """View order details with 5-stage live tracking."""
    order = Order.query.get_or_404(order_id)
    if current_user.role != 'admin' and order.user_id != current_user.id:
        return jsonify({'error': 'Access denied to this order.'}), 403

    return jsonify({'order': order.to_dict()}), 200


@order_bp.route('/<order_id>/pay', methods=['POST'])
@token_required
def process_demo_payment(current_user, order_id):
    """
    Demo Simulated Payment (PhonePe UPI).
    Updates payment_status to 'Paid' (or 'Cancelled').
    Re-validates stock & expiry before deducting stock ONLY ONCE upon payment success.
    """
    order = Order.query.get_or_404(order_id)
    if current_user.role != 'admin' and order.user_id != current_user.id:
        return jsonify({'error': 'Access denied to this order.'}), 403

    data = request.get_json() or {}
    status = data.get('status', 'Paid')

    if order.payment_status == 'Paid':
        return jsonify({'message': 'Order has already been paid for.', 'order': order.to_dict()}), 200

    if order.payment_status == 'Cancelled' or order.order_status == 'Cancelled':
        return jsonify({'error': 'Cannot pay for a cancelled order.'}), 400

    if status == 'Paid':
        # Re-validate aggregated stock & expiry for all items before deducting
        qty_needed_by_inv = {}
        for item in order.items:
            if item.inventory_id:
                qty_needed_by_inv[item.inventory_id] = qty_needed_by_inv.get(item.inventory_id, 0) + item.quantity

        inventories_to_deduct = []
        for inv_id, needed_qty in qty_needed_by_inv.items():
            inv = db.session.get(Inventory, inv_id)
            if not inv:
                return jsonify({'error': "One or more inventory batches in this order are no longer available."}), 400
            med_label = inv.medicine.name if inv.medicine else 'Medicine'
            if inv.is_expired():
                return jsonify({'error': f"Batch '{inv.batch_number}' for {med_label} has expired and cannot be dispensed."}), 400
            if inv.quantity is None or inv.quantity < needed_qty:
                return jsonify({'error': f"Insufficient stock for {med_label} (available: {inv.quantity or 0}, needed: {needed_qty})."}), 400
            inventories_to_deduct.append((inv, needed_qty))

        # Atomically claim payment transition so concurrent calls cannot double-deduct stock
        claimed = db.session.query(Order).filter(
            Order.id == order.id,
            Order.payment_status.in_(['Pending', 'Failed']),
            Order.order_status != 'Cancelled'
        ).update({'payment_status': 'Paid'}, synchronize_session='fetch')
        if claimed == 0:
            db.session.rollback()
            refreshed = db.session.get(Order, order_id)
            return jsonify({'message': 'Order has already been paid for.', 'order': refreshed.to_dict()}), 200

        for inv, qty in inventories_to_deduct:
            inv_updated = db.session.query(Inventory).filter(
                Inventory.id == inv.id,
                Inventory.quantity.isnot(None),
                Inventory.quantity >= qty
            ).update({Inventory.quantity: Inventory.quantity - qty}, synchronize_session='fetch')
            if inv_updated == 0:
                db.session.rollback()
                med_label = inv.medicine.name if inv.medicine else 'Medicine'
                return jsonify({'error': f"Insufficient stock for {med_label}."}), 400

        db.session.commit()
        db.session.refresh(order)
        return jsonify({
            'message': 'Demo payment successful. Status updated to Paid. Inventory stock deducted.',
            'order': order.to_dict()
        }), 200
    elif status == 'Failed':
        order.payment_status = 'Failed'
        db.session.commit()
        return jsonify({
            'message': 'Demo payment failed. Stock was not deducted. You may retry payment or cancel the order.',
            'order': order.to_dict()
        }), 200
    elif status == 'Cancelled':
        order.payment_status = 'Cancelled'
        order.order_status = 'Cancelled'
        db.session.commit()
        return jsonify({
            'message': 'Demo payment cancelled.',
            'order': order.to_dict()
        }), 200
    else:
        return jsonify({'error': "Invalid payment status. Allowed values: 'Paid', 'Failed', 'Cancelled'."}), 400


def _restore_order_stock(order):
    """Restores deducted stock when a Paid order is cancelled."""
    for item in order.items:
        if item.inventory_id:
            inv = db.session.get(Inventory, item.inventory_id)
            if inv and inv.quantity is not None:
                inv.quantity = inv.quantity + item.quantity


@order_bp.route('/<order_id>/cancel', methods=['POST'])
@token_required
def cancel_order(current_user, order_id):
    """
    Cancel an order (by its owner or Main Admin).
    Prevents cancelling orders already Dispatched or Delivered.
    Restores inventory stock if payment_status was Paid.
    """
    order = Order.query.get_or_404(order_id)
    if current_user.role != 'admin' and order.user_id != current_user.id:
        return jsonify({'error': 'Access denied to this order.'}), 403

    if order.order_status == 'Cancelled':
        return jsonify({'message': 'Order is already cancelled.', 'order': order.to_dict()}), 200

    if order.order_status in ('Dispatched', 'Delivered'):
        return jsonify({'error': f'Cannot cancel an order that is already {order.order_status}.'}), 400

    was_paid = (order.payment_status == 'Paid')
    if was_paid:
        _restore_order_stock(order)
        order.payment_status = 'Refunded (Demo)'
    else:
        order.payment_status = 'Cancelled'

    order.order_status = 'Cancelled'
    db.session.commit()

    return jsonify({
        'message': f'Order {order.id} cancelled successfully.' + (' Inventory stock restored.' if was_paid else ''),
        'order': order.to_dict()
    }), 200


@order_bp.route('/<order_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_order_status(current_user, order_id):
    """
    Admin: Advance order status stage.
    Stages: Order Placed -> Verification -> Preparing -> Dispatched -> Delivered (or Cancelled)
    """
    order = Order.query.get_or_404(order_id)
    data = request.get_json() or {}
    new_status = data.get('status')

    valid_statuses = ["Order Placed", "Verification", "Preparing", "Dispatched", "Delivered", "Cancelled"]
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Allowed values: {valid_statuses}'}), 400

    if order.order_status == 'Cancelled' and new_status != 'Cancelled':
        return jsonify({'error': 'Cannot reactivate a cancelled order.'}), 400

    if order.order_status == 'Delivered' and new_status != 'Delivered':
        return jsonify({'error': 'Cannot change status of an already delivered order.'}), 400

    if new_status == 'Cancelled' and order.order_status in ('Dispatched', 'Delivered'):
        return jsonify({'error': f'Cannot cancel an order that is already {order.order_status}.'}), 400

    if new_status in ('Dispatched', 'Delivered') and order.payment_status != 'Paid':
        return jsonify({'error': f'Cannot mark order as {new_status} before payment is completed.'}), 400

    if new_status == 'Cancelled' and order.order_status != 'Cancelled':
        if order.payment_status == 'Paid':
            _restore_order_stock(order)
            order.payment_status = 'Refunded (Demo)'
        else:
            order.payment_status = 'Cancelled'

    order.order_status = new_status
    db.session.commit()

    return jsonify({
        'message': f'Order status updated to {new_status}.',
        'order': order.to_dict()
    }), 200
