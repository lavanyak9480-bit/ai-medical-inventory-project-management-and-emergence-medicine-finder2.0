import json
from flask import request, jsonify
from datetime import date
from sqlalchemy.orm import joinedload
from . import inventory_bp
from models import db
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from models.medicine import Medicine
from utils.auth_middleware import token_required, admin_required
from utils.medicine_images import resolve_medicine_image


@inventory_bp.route('', methods=['GET'])
def list_inventory():
    """List inventory batches across pharmacies."""
    pharmacy_filter = request.args.get('pharmacy')
    search = (request.args.get('q') or request.args.get('search') or '').strip()
    query = Inventory.query.options(joinedload(Inventory.medicine), joinedload(Inventory.pharmacy)).join(Medicine)

    if pharmacy_filter:
        pharma = Pharmacy.query.filter_by(name=pharmacy_filter).first()
        if pharma:
            query = query.filter(Inventory.pharmacy_id == pharma.id)

    if search:
        for tok in [t for t in search.split() if t]:
            pattern = f'%{tok}%'
            query = query.filter(
                (Medicine.name.ilike(pattern)) |
                (Medicine.generic_name.ilike(pattern)) |
                (Medicine.category.ilike(pattern)) |
                (Medicine.strength.ilike(pattern)) |
                (Medicine.form.ilike(pattern)) |
                (Inventory.batch_number.ilike(pattern))
            )

    inventory_items = query.order_by(Inventory.created_at.desc(), Inventory.id.asc()).all()
    return jsonify({'inventory': [item.to_dict() for item in inventory_items]}), 200


@inventory_bp.route('/pharmacy-a', methods=['GET'])
def get_pharmacy_a_inventory():
    """View dedicated Pharmacy A inventory records."""
    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first_or_404()
    items = (
        Inventory.query
        .options(joinedload(Inventory.medicine), joinedload(Inventory.pharmacy))
        .filter_by(pharmacy_id=pharma_a.id)
        .order_by(Inventory.created_at.desc(), Inventory.id.asc())
        .all()
    )
    return jsonify({
        'pharmacy': pharma_a.to_dict(),
        'inventory': [item.to_dict() for item in items]
    }), 200


@inventory_bp.route('/pharmacy-b', methods=['GET'])
def get_pharmacy_b_inventory():
    """View dedicated Pharmacy B inventory records."""
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first_or_404()
    items = (
        Inventory.query
        .options(joinedload(Inventory.medicine), joinedload(Inventory.pharmacy))
        .filter_by(pharmacy_id=pharma_b.id)
        .order_by(Inventory.created_at.desc(), Inventory.id.asc())
        .all()
    )
    return jsonify({
        'pharmacy': pharma_b.to_dict(),
        'inventory': [item.to_dict() for item in items]
    }), 200


@inventory_bp.route('/<int:inv_id>', methods=['PUT'])
@token_required
@admin_required
def update_inventory(current_user, inv_id):
    """Admin: Update inventory batch stock, price, batch number, expiry date, and optionally medicine details."""
    inv = Inventory.query.get_or_404(inv_id)
    data = request.get_json() or {}

    if 'quantity' in data and data['quantity'] is not None and data['quantity'] != '':
        try:
            qty = int(data['quantity'])
            if qty < 0:
                return jsonify({'error': 'Stock quantity cannot be negative.'}), 400
            inv.quantity = qty
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid quantity.'}), 400

    if 'price' in data and data['price'] is not None and data['price'] != '':
        try:
            prc = float(data['price'])
            if prc <= 0:
                return jsonify({'error': 'Price must be greater than zero.'}), 400
            inv.price = prc
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid price.'}), 400

    if 'batch_number' in data:
        bn = (data['batch_number'] or '').strip()
        if bn:
            dup = Inventory.query.filter(
                Inventory.medicine_id == inv.medicine_id,
                Inventory.pharmacy_id == inv.pharmacy_id,
                Inventory.batch_number == bn,
                Inventory.id != inv.id
            ).first()
            if dup:
                return jsonify({'error': f"Batch '{bn}' already exists for this medicine in this pharmacy."}), 409
        inv.batch_number = bn if bn else None

    if 'expiry_date' in data:
        if data['expiry_date']:
            try:
                inv.expiry_date = date.fromisoformat(data['expiry_date'])
            except ValueError:
                return jsonify({'error': 'Invalid expiry date format. Expected YYYY-MM-DD.'}), 400
        else:
            inv.expiry_date = None

    if 'mfg_date' in data:
        if data['mfg_date']:
            try:
                inv.mfg_date = date.fromisoformat(data['mfg_date'])
            except ValueError:
                return jsonify({'error': 'Invalid mfg date format. Expected YYYY-MM-DD.'}), 400
        else:
            inv.mfg_date = None

    if inv.mfg_date and inv.expiry_date and inv.mfg_date >= inv.expiry_date:
        return jsonify({'error': 'Manufacture date must be earlier than expiry date.'}), 400

    # Allow updating linked medicine metadata if provided from edit modal
    med = inv.medicine
    if med:
        med_identity_changed = False
        if 'name' in data and str(data['name']).strip():
            med.name = str(data['name']).strip()
            med_identity_changed = True
        if 'generic_name' in data:
            med.generic_name = (data['generic_name'] or '').strip() or None
        if 'strength' in data:
            med.strength = (data['strength'] or '').strip() or None
            med_identity_changed = True
        if 'form' in data and str(data['form']).strip():
            med.form = str(data['form']).strip()
            med_identity_changed = True
        if 'prescription_required' in data:
            med.prescription_required = bool(data['prescription_required'])
        if med_identity_changed or not med.image_url:
            med.image_url = resolve_medicine_image(med.name, med.strength, med.form)

    # Recompute missing_fields dynamically
    missing = []
    if med and not med.strength:
        missing.append('strength')
    if not inv.batch_number:
        missing.append('batch_number')
    if inv.quantity is None:
        missing.append('quantity')
    if inv.price is None:
        missing.append('price')
    if inv.expiry_date is None:
        missing.append('expiry_date')
    inv.missing_fields = json.dumps(missing)

    db.session.commit()
    return jsonify({
        'message': 'Inventory batch updated successfully.',
        'inventory': inv.to_dict()
    }), 200


@inventory_bp.route('/<int:inv_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_inventory(current_user, inv_id):
    """Admin: Remove inventory batch entry."""
    inv = Inventory.query.get_or_404(inv_id)
    label = inv.batch_number or (inv.medicine.name if inv.medicine else str(inv.id))
    db.session.delete(inv)
    db.session.commit()
    return jsonify({'message': f'Inventory record {label} deleted successfully.'}), 200
