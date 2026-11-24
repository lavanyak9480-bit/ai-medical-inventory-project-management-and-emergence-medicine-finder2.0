from flask import jsonify
from . import pharmacy_bp
from models.pharmacy import Pharmacy

@pharmacy_bp.route('', methods=['GET'])
def list_pharmacies():
    """List both supported pharmacies: Pharmacy A and Pharmacy B."""
    pharmacies = Pharmacy.query.all()
    return jsonify({'pharmacies': [p.to_dict() for p in pharmacies]}), 200

@pharmacy_bp.route('/<int:pharma_id>', methods=['GET'])
def get_pharmacy(pharma_id):
    """Get single pharmacy details."""
    pharma = Pharmacy.query.get_or_404(pharma_id)
    return jsonify({'pharmacy': pharma.to_dict()}), 200
