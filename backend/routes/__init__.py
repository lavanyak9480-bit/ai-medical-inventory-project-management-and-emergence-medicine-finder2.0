from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
user_bp = Blueprint('users', __name__, url_prefix='/api/users')
medicine_bp = Blueprint('medicines', __name__, url_prefix='/api/medicines')
inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')
pharmacy_bp = Blueprint('pharmacies', __name__, url_prefix='/api/pharmacies')
prescription_bp = Blueprint('prescriptions', __name__, url_prefix='/api/prescriptions')
order_bp = Blueprint('orders', __name__, url_prefix='/api/orders')
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
alert_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

from . import auth_routes
from . import user_routes
from . import medicine_routes
from . import inventory_routes
from . import pharmacy_routes
from . import prescription_routes
from . import order_routes
from . import admin_routes
from . import alert_routes
