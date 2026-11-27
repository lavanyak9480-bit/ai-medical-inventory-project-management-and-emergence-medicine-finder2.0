from datetime import datetime
from . import db
from utils.medicine_images import resolve_medicine_image


class Medicine(db.Model):
    __tablename__ = 'medicines'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    generic_name = db.Column(db.String(200), nullable=True)
    category = db.Column(db.String(120), nullable=True)
    strength = db.Column(db.String(80), nullable=True)  # Nullable when not provided in source catalog
    form = db.Column(db.String(80), nullable=False)     # Tablet, Capsule, Syrup, Drops, etc.
    indication = db.Column(db.Text, nullable=True)
    prescription_status = db.Column(db.String(120), nullable=True)
    prescription_required = db.Column(db.Boolean, default=False)
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    inventory_batches = db.relationship('Inventory', backref='medicine', lazy=True, cascade='all, delete-orphan')

    def get_image_url(self):
        return self.image_url or resolve_medicine_image(self.name, self.strength, self.form)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'generic_name': self.generic_name,
            'category': self.category,
            'strength': self.strength,
            'form': self.form,
            'indication': self.indication,
            'prescription_status': self.prescription_status,
            'prescription_required': self.prescription_required,
            'image_url': self.get_image_url(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
