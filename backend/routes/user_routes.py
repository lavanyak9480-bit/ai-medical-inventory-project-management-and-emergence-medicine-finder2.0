from flask import request, jsonify
from . import user_bp
from models import db
from models.prescription import Prescription
from models.order import Order
from utils.auth_middleware import token_required

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """View current user profile."""
    return jsonify({'user': current_user.to_dict()}), 200

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Edit user contact details and delivery address."""
    data = request.get_json() or {}
    if 'full_name' in data:
        current_user.full_name = data['full_name'].strip()
    if 'phone' in data:
        current_user.phone = data['phone'].strip()
    if 'address' in data:
        current_user.address = data['address'].strip()

    db.session.commit()
    return jsonify({
        'message': 'Profile updated successfully.',
        'user': current_user.to_dict()
    }), 200

@user_bp.route('/prescriptions', methods=['GET'])
@token_required
def get_my_prescriptions(current_user):
    """View prescriptions uploaded by current user only."""
    prescriptions = Prescription.query.filter_by(user_id=current_user.id).order_by(Prescription.created_at.desc()).all()
    return jsonify({'prescriptions': [p.to_dict() for p in prescriptions]}), 200

@user_bp.route('/orders', methods=['GET'])
@token_required
def get_my_orders(current_user):
    """View orders placed by current user only."""
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200
