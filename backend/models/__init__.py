from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .pharmacy import Pharmacy
from .medicine import Medicine
from .inventory import Inventory
from .prescription import Prescription, PrescriptionMedicine
from .order import Order, OrderItem
