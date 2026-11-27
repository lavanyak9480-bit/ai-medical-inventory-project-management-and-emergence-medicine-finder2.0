from datetime import datetime
from . import db

class Prescription(db.Model):
    __tablename__ = 'prescriptions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50), nullable=True)
    file_size = db.Column(db.String(50), nullable=True)
    # Statuses: Uploaded, Processing, Pending Verification, Verified, Rejected
    status = db.Column(db.String(50), default='Pending Verification', nullable=False)
    rejection_reason = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.String(100), nullable=True) # Admin reviewer name
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Extracted medicines relation
    medicines = db.relationship('PrescriptionMedicine', backref='prescription', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'reviewed_by': self.reviewed_by,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'medicines': [m.to_dict() for m in self.medicines]
        }

class PrescriptionMedicine(db.Model):
    __tablename__ = 'prescription_medicines'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    prescription_id = db.Column(db.Integer, db.ForeignKey('prescriptions.id', ondelete='CASCADE'), nullable=False)
    medicine_name = db.Column(db.String(150), nullable=False)
    strength = db.Column(db.String(50), nullable=False)
    dosage = db.Column(db.String(100), nullable=True)
    frequency = db.Column(db.String(150), nullable=True)
    duration = db.Column(db.String(100), nullable=True)
    confidence = db.Column(db.String(20), default='High') # High, Medium, Low
    is_confirmed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'prescription_id': self.prescription_id,
            'name': self.medicine_name,
            'strength': self.strength,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'duration': self.duration,
            'confidence': self.confidence,
            'is_confirmed': self.is_confirmed
        }
