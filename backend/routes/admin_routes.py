from flask import jsonify
from datetime import date
from . import admin_bp
from models import db
from models.user import User
from models.medicine import Medicine
from models.inventory import Inventory
from models.prescription import Prescription
from models.order import Order
from utils.auth_middleware import token_required, admin_required

@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def get_dashboard_metrics(current_user):
    """
    Main Admin Dashboard Metrics.
    Returns EXACTLY the four required summary metrics:
    1. Total Medicines
    2. Pending Prescriptions
    3. Low Stock
    4. Near Expiry
    Plus shortcuts & recent orders.
    """
    today = date.today()

    # 1. Total Medicines
    total_medicines = Medicine.query.count()

    # 2. Pending Prescriptions
    pending_prescriptions = Prescription.query.filter_by(status='Pending Verification').count()

    # 3. Low Stock (< 20 units, excluding unstocked catalog entries with NULL quantity)
    low_stock = Inventory.query.filter(
        Inventory.quantity.isnot(None),
        Inventory.quantity < 20
    ).count()

    # 4. Near Expiry (<= 90 days from today and not already expired)
    all_inventories = Inventory.query.all()
    near_expiry = sum(1 for inv in all_inventories if inv.is_near_expiry(90))

    # Recent Orders (last 5)
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()

    return jsonify({
        'metrics': {
            'total_medicines': total_medicines,
            'pending_prescriptions': pending_prescriptions,
            'low_stock': low_stock,
            'near_expiry': near_expiry
        },
        'pharmacies': {
            'pharmacy_a_total': Inventory.query.filter(Inventory.pharmacy.has(name='Pharmacy A')).count(),
            'pharmacy_b_total': Inventory.query.filter(Inventory.pharmacy.has(name='Pharmacy B')).count()
        },
        'recent_orders': [o.to_dict() for o in recent_orders]
    }), 200

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def list_users(current_user):
    """Admin: View registered users."""
    users = User.query.filter_by(role='user').order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@admin_bp.route('/prescriptions', methods=['GET'])
@token_required
@admin_required
def list_all_prescriptions(current_user):
    """Admin: Review all uploaded prescriptions across users."""
    prescriptions = Prescription.query.order_by(Prescription.created_at.desc()).all()
    return jsonify({'prescriptions': [p.to_dict() for p in prescriptions]}), 200

@admin_bp.route('/orders', methods=['GET'])
@token_required
@admin_required
def list_all_orders(current_user):
    """Admin: Monitor and manage all orders across Pharmacy A and Pharmacy B."""
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200
