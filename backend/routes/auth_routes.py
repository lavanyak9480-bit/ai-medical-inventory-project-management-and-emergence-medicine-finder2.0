from flask import request, jsonify
from . import auth_bp
from models import db
from models.user import User
from utils.auth_middleware import create_access_token, token_required

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Public User registration.
    Only creates regular 'user' role accounts. No public admin registration!
    """
    data = request.get_json() or {}
    full_name = data.get('full_name') or data.get('fullName')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    address = data.get('address', '')

    if not full_name or not email or not password:
        return jsonify({'error': 'Full name, email, and password are required.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

    email = email.strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email address already exists.'}), 409

    user = User(
        full_name=full_name.strip(),
        email=email,
        phone=phone.strip() if phone else None,
        address=address.strip() if address else None,
        role='user' # Strict enforcement: users cannot self-register as admin
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(user)
    return jsonify({
        'message': 'User registered successfully.',
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login endpoint for both Admin and User.
    Admin logs in using credentials; no separate admin portal login required.
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Please provide both email and password.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    token = create_access_token(user)
    return jsonify({
        'message': f'Welcome back, {user.full_name}!',
        'token': token,
        'user': user.to_dict(),
        'role': user.role
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Returns profile of currently authenticated user or admin."""
    return jsonify({
        'user': current_user.to_dict(),
        'role': current_user.role
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Signals logout completion for frontend token discard."""
    return jsonify({'message': 'Logged out successfully.'}), 200
