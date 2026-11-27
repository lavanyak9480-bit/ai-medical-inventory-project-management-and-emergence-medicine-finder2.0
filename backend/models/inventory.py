import json
from datetime import datetime, date
from . import db
from utils.medicine_images import resolve_medicine_image

class Inventory(db.Model):
    __tablename__ = 'inventory'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.id', ondelete='CASCADE'), nullable=False)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey('pharmacies.id', ondelete='CASCADE'), nullable=False)
    catalog_item_no = db.Column(db.String(50), nullable=True, index=True)
    batch_number = db.Column(db.String(80), nullable=True)
    quantity = db.Column(db.Integer, nullable=True)
    price = db.Column(db.Float, nullable=True)
    mfg_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    data_source = db.Column(db.String(80), nullable=True)
    missing_fields = db.Column(db.Text, nullable=True)  # JSON list of fields not provided in source
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
        if self.quantity is None:
            return False
        return 0 < self.quantity < threshold

    def is_orderable(self):
        return (
            not self.is_expired()
            and self.quantity is not None
            and self.quantity > 0
            and self.price is not None
            and self.price > 0
            and self.expiry_date is not None
        )

    def get_missing_fields_list(self):
        if not self.missing_fields:
            return []
        try:
            parsed = json.loads(self.missing_fields)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return [f.strip() for f in self.missing_fields.split(',') if f.strip()]

    def to_dict(self):
        med = self.medicine
        pharma = self.pharmacy
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'medicine_name': med.name if med else '',
            'generic_name': med.generic_name if med else '',
            'category': med.category if med else None,
            'strength': med.strength if med else None,
            'form': med.form if med else '',
            'indication': med.indication if med else None,
            'prescription_status': med.prescription_status if med else None,
            'prescription_required': med.prescription_required if med else False,
            'image_url': med.get_image_url() if med else resolve_medicine_image('Medicine', None, None),
            'pharmacy_id': self.pharmacy_id,
            'pharmacy_name': pharma.name if pharma else '',
            'catalog_item_no': self.catalog_item_no,
            'batch_number': self.batch_number,
            'quantity': self.quantity,
            'price': float(self.price) if self.price is not None else None,
            'mfg_date': self.mfg_date.isoformat() if self.mfg_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'data_source': self.data_source,
            'missing_fields': self.get_missing_fields_list(),
            'is_orderable': self.is_orderable(),
            'is_expired': self.is_expired(),
            'is_near_expiry': self.is_near_expiry(),
            'is_low_stock': self.is_low_stock(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
