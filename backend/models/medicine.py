from datetime import datetime
from . import db

class Medicine(db.Model):
    __tablename__ = 'medicines'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    generic_name = db.Column(db.String(200), nullable=True)
    strength = db.Column(db.String(50), nullable=False) # e.g. '500mg', '650mg'
    form = db.Column(db.String(50), nullable=False)     # Tablet, Capsule, Syrup, Injection, Ointment, etc.
    prescription_required = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    inventory_batches = db.relationship('Inventory', backref='medicine', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'generic_name': self.generic_name,
            'strength': self.strength,
            'form': self.form,
            'prescription_required': self.prescription_required,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
