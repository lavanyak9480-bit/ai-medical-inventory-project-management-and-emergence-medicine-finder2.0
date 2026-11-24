from datetime import datetime, date
from . import db

class Inventory(db.Model):
    __tablename__ = 'inventory'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id', ondelete='CASCADE'), nullable=False)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey('pharmacies.id', ondelete='CASCADE'), nullable=False)
    batch_number = db.Column(db.String(80), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    price = db.Column(db.Float, nullable=False)
    mfg_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Helper properties
    def is_expired(self):
        if not self.expiry_date:
            return False
        return self.expiry_date < date.today()

    def is_near_expiry(self, days_threshold=90):
        if not self.expiry_date or self.is_expired():
            return False
        delta = (self.expiry_date - date.today()).days
        return 0 <= delta <= days_threshold

    def is_low_stock(self, threshold=20):
        return 0 < self.quantity < threshold

    def to_dict(self):
        med = self.medicine
        pharma = self.pharmacy
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'medicine_name': med.name if med else '',
            'generic_name': med.generic_name if med else '',
            'strength': med.strength if med else '',
            'form': med.form if med else '',
            'prescription_required': med.prescription_required if med else False,
            'pharmacy_id': self.pharmacy_id,
            'pharmacy_name': pharma.name if pharma else '',
            'batch_number': self.batch_number,
            'quantity': self.quantity,
            'price': float(self.price),
            'mfg_date': self.mfg_date.isoformat() if self.mfg_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'is_expired': self.is_expired(),
            'is_near_expiry': self.is_near_expiry(),
            'is_low_stock': self.is_low_stock(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
