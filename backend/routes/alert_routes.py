from flask import jsonify
from datetime import date
from sqlalchemy.orm import joinedload
from . import alert_bp
from models.inventory import Inventory
from utils.auth_middleware import token_required, admin_required


def _load_all_inventories():
    return Inventory.query.options(joinedload(Inventory.medicine), joinedload(Inventory.pharmacy)).all()


@alert_bp.route('/all', methods=['GET'])
@token_required
@admin_required
def get_all_alerts(current_user):
    """
    Returns comprehensive inventory safety triage:
    - Expired medicines (Quarantined)
    - Near-expiry medicines (<= 90 days)
    - Low-stock medicines (< 20 units)
    """
    all_inventories = _load_all_inventories()
    expired = [i.to_dict() for i in all_inventories if i.is_expired()]
    near_expiry = [i.to_dict() for i in all_inventories if i.is_near_expiry(90)]
    low_stock = [i.to_dict() for i in all_inventories if i.quantity is not None and i.quantity < 20]

    return jsonify({
        'expired': expired,
        'near_expiry': near_expiry,
        'low_stock': low_stock,
        'counts': {
            'expired_count': len(expired),
            'near_expiry_count': len(near_expiry),
            'low_stock_count': len(low_stock)
        }
    }), 200

@alert_bp.route('/expired', methods=['GET'])
@token_required
@admin_required
def get_expired_alerts(current_user):
    """View expired stock batches quarantined from sale."""
    all_inventories = _load_all_inventories()
    expired = [i.to_dict() for i in all_inventories if i.is_expired()]
    return jsonify({'expired_batches': expired}), 200

@alert_bp.route('/near-expiry', methods=['GET'])
@token_required
@admin_required
def get_near_expiry_alerts(current_user):
    """View near-expiry stock batches expiring within 90 days."""
    all_inventories = _load_all_inventories()
    near_expiry = [i.to_dict() for i in all_inventories if i.is_near_expiry(90)]
    return jsonify({'near_expiry_batches': near_expiry}), 200

@alert_bp.route('/low-stock', methods=['GET'])
@token_required
@admin_required
def get_low_stock_alerts(current_user):
    """View stock batches with fewer than 20 units available."""
    all_inventories = _load_all_inventories()
    low_stock = [i.to_dict() for i in all_inventories if i.quantity is not None and i.quantity < 20]
    return jsonify({'low_stock_batches': low_stock}), 200
