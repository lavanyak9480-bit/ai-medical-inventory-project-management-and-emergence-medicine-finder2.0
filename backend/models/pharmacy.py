from datetime import datetime
from . import db

class Pharmacy(db.Model):
    __tablename__ = 'pharmacies'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False) # 'Pharmacy A' or 'Pharmacy B'
    address = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(25), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    inventory_items = db.relationship('Inventory', backref='pharmacy', lazy=True, cascade='all, delete-orphan')
    orders = db.relationship('Order', backref='pharmacy', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
