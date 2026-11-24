from flask import request, jsonify
from datetime import date
from . import inventory_bp
from models import db
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from models.medicine import Medicine
from utils.auth_middleware import token_required, admin_required

@inventory_bp.route('', methods=['GET'])
def list_inventory():
    """List all inventory batches across pharmacies."""
    pharmacy_filter = request.args.get('pharmacy')
    query = Inventory.query

    if pharmacy_filter:
        pharma = Pharmacy.query.filter_by(name=pharmacy_filter).first()
        if pharma:
            query = query.filter_by(pharmacy_id=pharma.id)

    inventory_items = query.order_by(Inventory.created_at.desc()).all()
    return jsonify({'inventory': [item.to_dict() for item in inventory_items]}), 200

@inventory_bp.route('/pharmacy-a', methods=['GET'])
def get_pharmacy_a_inventory():
    """View dedicated Pharmacy A inventory records."""
    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first_or_404()
    items = Inventory.query.filter_by(pharmacy_id=pharma_a.id).order_by(Inventory.created_at.desc()).all()
    return jsonify({
        'pharmacy': pharma_a.to_dict(),
        'inventory': [item.to_dict() for item in items]
    }), 200

@inventory_bp.route('/pharmacy-b', methods=['GET'])
def get_pharmacy_b_inventory():
    """View dedicated Pharmacy B inventory records."""
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first_or_404()
    items = Inventory.query.filter_by(pharmacy_id=pharma_b.id).order_by(Inventory.created_at.desc()).all()
    return jsonify({
        'pharmacy': pharma_b.to_dict(),
        'inventory': [item.to_dict() for item in items]
    }), 200

@inventory_bp.route('/<int:inv_id>', methods=['PUT'])
@token_required
@admin_required
def update_inventory(current_user, inv_id):
    """Admin: Update inventory batch stock, price, batch number, or expiry date."""
    inv = Inventory.query.get_or_404(inv_id)
    data = request.get_json() or {}

    if 'quantity' in data:
        try:
            qty = int(data['quantity'])
            if qty < 0:
                return jsonify({'error': 'Stock quantity cannot be negative.'}), 400
            inv.quantity = qty
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid quantity.'}), 400

    if 'price' in data:
        try:
            prc = float(data['price'])
            if prc <= 0:
                return jsonify({'error': 'Price must be greater than zero.'}), 400
            inv.price = prc
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid price.'}), 400

    if 'batch_number' in data and data['batch_number'].strip():
        inv.batch_number = data['batch_number'].strip()

    if 'expiry_date' in data and data['expiry_date']:
        try:
            inv.expiry_date = date.fromisoformat(data['expiry_date'])
        except ValueError:
            return jsonify({'error': 'Invalid expiry date format. Expected YYYY-MM-DD.'}), 400

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
    db.session.delete(inv)
    db.session.commit()
    return jsonify({'message': f'Inventory batch {inv.batch_number} deleted successfully.'}), 200
