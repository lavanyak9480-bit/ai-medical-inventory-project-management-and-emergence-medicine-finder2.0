from datetime import datetime
from . import db

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.String(50), primary_key=True) # e.g. ORD-9481A
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey('pharmacies.id', ondelete='CASCADE'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    delivery_address = db.Column(db.Text, nullable=False)
    # Payment status: Pending, Paid, Cancelled
    payment_status = db.Column(db.String(30), default='Pending', nullable=False)
    payment_method = db.Column(db.String(50), default='PhonePe UPI (Demo)')
    # Order stages: Order Placed, Verification, Preparing, Dispatched, Delivered, Cancelled
    order_status = db.Column(db.String(50), default='Order Placed', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Order items relation
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        stages = ["Order Placed", "Verification", "Preparing", "Dispatched", "Delivered"]
        current_idx = stages.index(self.order_status) if self.order_status in stages else 0

        tracking_updates = []
        for idx, st in enumerate(stages):
            tracking_updates.append({
                'stage': st,
                'done': idx <= current_idx,
                'time': self.created_at.strftime('%b %d, %I:%M %p') if idx == 0 else ('Completed' if idx < current_idx else ('Current' if idx == current_idx else 'Pending'))
            })

        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'user_phone': self.user.phone if self.user else None,
            'user_address': self.delivery_address,
            'pharmacy_id': self.pharmacy_id,
            'pharmacy_name': self.pharmacy.name if self.pharmacy else None,
            'total_amount': float(self.total_amount),
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'order_status': self.order_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'items': [item.to_dict() for item in self.items],
            'tracking_updates': tracking_updates
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.String(50), db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.id', ondelete='SET NULL'), nullable=True)
    medicine_name = db.Column(db.String(150), nullable=False)
    strength = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'inventory_id': self.inventory_id,
            'name': f"{self.medicine_name} {self.strength}",
            'medicine_name': self.medicine_name,
            'strength': self.strength,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'price': float(self.unit_price),
            'subtotal': float(self.subtotal)
        }
