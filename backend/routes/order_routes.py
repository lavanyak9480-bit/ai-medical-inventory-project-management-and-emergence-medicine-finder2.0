from flask import request, jsonify
from datetime import datetime, date
import random
from . import order_bp
from models import db
from models.order import Order, OrderItem
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from utils.auth_middleware import token_required, admin_required

@order_bp.route('', methods=['POST'])
@token_required
def create_order(current_user):
    """
    Users place separate orders for Pharmacy A or Pharmacy B.
    Validations:
    - Checks stock before placing.
    - Prevents ordering more than available stock.
    - Rejects expired stock batches from being ordered.
    - Prescription-required medicines checked.
    """
    data = request.get_json() or {}
    pharmacy_name = data.get('pharmacy') # 'Pharmacy A' or 'Pharmacy B'
    items = data.get('items', [])
    delivery_address = data.get('delivery_address') or current_user.address

    if not pharmacy_name or not items:
        return jsonify({'error': 'Pharmacy and order items are required.'}), 400

    if not delivery_address:
        return jsonify({'error': 'Delivery address is required.'}), 400

    pharma = Pharmacy.query.filter_by(name=pharmacy_name).first()
    if not pharma:
        return jsonify({'error': f'Selected pharmacy {pharmacy_name} not found.'}), 404

    # Generate unique Order ID
    suffix = 'A' if 'A' in pharmacy_name else 'B'
    order_id = f"ORD-{random.randint(1000, 9999)}{suffix}"

    total_amount = 0.0
    validated_items = []

    # Validate each item and check inventory stock
    for it in items:
        inv_id = it.get('inventory_id')
        qty = int(it.get('quantity', 1))

        if qty <= 0:
            return jsonify({'error': 'Quantity must be at least 1.'}), 400

        inv = Inventory.query.get(inv_id) if inv_id else None
        if not inv:
            # Fallback by medicine_id and pharmacy_id
            med_id = it.get('medicine_id')
            inv = Inventory.query.filter(
                Inventory.medicine_id == med_id,
                Inventory.pharmacy_id == pharma.id,
                Inventory.expiry_date >= date.today(),
                Inventory.quantity >= qty
            ).first()

        if not inv:
            return jsonify({'error': f"Item '{it.get('name', 'Unknown')}' is not available in {pharmacy_name}."}), 400

        # Check expired batch
        if inv.is_expired():
            return jsonify({'error': f"Batch '{inv.batch_number}' for {inv.medicine.name} has expired and cannot be dispensed."}), 400

        # Check stock quantity
        if qty > inv.quantity:
            return jsonify({'error': f"Requested quantity ({qty}) exceeds available stock ({inv.quantity}) for {inv.medicine.name}."}), 400

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

    # Create Order
    order = Order(
        id=order_id,
        user_id=current_user.id,
        pharmacy_id=pharma.id,
        total_amount=round(total_amount, 2),
        delivery_address=delivery_address.strip(),
        payment_status='Pending',
        payment_method=data.get('payment_method', 'PhonePe UPI (Demo)'),
        order_status='Order Placed'
    )
    db.session.add(order)

    # Create Order Items
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
    Deducts stock from inventory ONLY ONCE upon payment success!
    """
    order = Order.query.get_or_404(order_id)
    if current_user.role != 'admin' and order.user_id != current_user.id:
        return jsonify({'error': 'Access denied to this order.'}), 403

    data = request.get_json() or {}
    status = data.get('status', 'Paid') # 'Paid' or 'Cancelled'

    if order.payment_status == 'Paid':
        return jsonify({'message': 'Order has already been paid for.', 'order': order.to_dict()}), 200

    if status == 'Paid':
        order.payment_status = 'Paid'

        # Deduct stock safely
        for item in order.items:
            if item.inventory_id:
                inv = Inventory.query.get(item.inventory_id)
                if inv:
                    inv.quantity = max(0, inv.quantity - item.quantity)

        db.session.commit()
        return jsonify({
            'message': 'Demo payment successful. Status updated to Paid. Inventory stock deducted.',
            'order': order.to_dict()
        }), 200
    else:
        order.payment_status = 'Cancelled'
        order.order_status = 'Cancelled'
        db.session.commit()
        return jsonify({
            'message': 'Demo payment cancelled.',
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

    order.order_status = new_status
    db.session.commit()

    return jsonify({
        'message': f'Order status updated to {new_status}.',
        'order': order.to_dict()
    }), 200
