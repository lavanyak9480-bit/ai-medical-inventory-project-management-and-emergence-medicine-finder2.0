from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timedelta, timezone
from models import db
from models.user import User

def create_access_token(user, expires_in_hours=24):
    """Generates a signed JWT access token containing user identity and role."""
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user.id),
        'email': user.email,
        'name': user.full_name,
        'role': user.role,
        'iat': now,
        'exp': now + timedelta(hours=expires_in_hours)
    }
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    return token

def token_required(f):
    """Decorator to protect routes requiring valid user or admin authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header:
            parts = auth_header.split(' ')
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]

        if not token:
            return jsonify({'error': 'Authentication token is missing. Please log in.'}), 401

        try:
            payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            user_id = int(payload['sub'])
            current_user = db.session.get(User, user_id)
            if not current_user:
                return jsonify({'error': 'User account associated with this token no longer exists.'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Session token has expired. Please log in again.'}), 401
        except (jwt.InvalidTokenError, ValueError, TypeError):
            return jsonify({'error': 'Invalid authentication token.'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to enforce strict Main Admin role access control."""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({
                'error': 'Access denied. Only the Main Admin is authorized to access this resource.'
            }), 403
        return f(current_user, *args, **kwargs)
    return decorated
