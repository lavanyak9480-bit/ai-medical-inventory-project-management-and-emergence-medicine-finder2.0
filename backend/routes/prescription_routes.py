import os
from flask import request, jsonify, current_app, send_from_directory
from datetime import datetime
from . import prescription_bp
from models import db
from models.prescription import Prescription, PrescriptionMedicine
from utils.auth_middleware import token_required, admin_required
from utils.helpers import is_allowed_file, save_uploaded_file
from services.ocr_service import extract_prescription_text, parse_clinical_entities

@prescription_bp.route('/upload', methods=['POST'])
@token_required
def upload_prescription(current_user):
    """
    Users upload prescriptions as JPG, PNG, or PDF.
    Extracts clinical entities using OCR.
    Status set to 'Pending Verification'.
    OCR does NOT automatically approve prescriptions!
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded in request.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400

    if not is_allowed_file(file.filename, current_app.config['ALLOWED_EXTENSIONS']):
        return jsonify({'error': 'Unsupported file format. Please upload JPG, PNG, or PDF.'}), 400

    # Save file securely
    unique_filename, filepath = save_uploaded_file(file, current_app.config['UPLOAD_FOLDER'])
    file_size_kb = round(os.path.getsize(filepath) / 1024, 1)

    # 1. Create Prescription record in 'Pending Verification' status
    prescription = Prescription(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=unique_filename,
        file_type=file.content_type or 'image/jpeg',
        file_size=f"{file_size_kb} KB",
        status='Pending Verification' # Mandatory: OCR does not auto-approve
    )
    db.session.add(prescription)
    db.session.flush()

    # 2. Run OCR extraction
    raw_text = extract_prescription_text(filepath)
    extracted_entities = parse_clinical_entities(raw_text, filename=file.filename)

    # 3. Save extracted entities in database
    for ent in extracted_entities:
        pm = PrescriptionMedicine(
            prescription_id=prescription.id,
            medicine_name=ent['medicine_name'],
            strength=ent['strength'],
            dosage=ent.get('dosage'),
            frequency=ent.get('frequency'),
            duration=ent.get('duration'),
            confidence=ent.get('confidence', 'High')
        )
        db.session.add(pm)

    db.session.commit()

    return jsonify({
        'message': 'Prescription uploaded and scanned successfully. Status: Pending Verification.',
        'prescription': prescription.to_dict()
    }), 201

@prescription_bp.route('/<int:rx_id>', methods=['GET'])
@token_required
def get_prescription(current_user, rx_id):
    """View details of a specific prescription."""
    prescription = Prescription.query.get_or_404(rx_id)
    # Users can access only their own prescriptions; Admin can access all
    if current_user.role != 'admin' and prescription.user_id != current_user.id:
        return jsonify({'error': 'Access denied to this prescription.'}), 403

    return jsonify({'prescription': prescription.to_dict()}), 200

@prescription_bp.route('/file/<filename>', methods=['GET'])
def get_uploaded_file(filename):
    """Serve uploaded prescription document/image for preview."""
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@prescription_bp.route('/<int:rx_id>/verify', methods=['POST'])
@token_required
@admin_required
def verify_prescription(current_user, rx_id):
    """
    Admin: Verify prescription.
    Authorizes prescription for dispensing.
    """
    prescription = Prescription.query.get_or_404(rx_id)
    data = request.get_json() or {}
    notes = data.get('notes', f"Verified by Main Admin ({current_user.full_name})")

    prescription.status = 'Verified'
    prescription.reviewed_by = current_user.full_name
    prescription.reviewed_at = datetime.utcnow()
    prescription.rejection_reason = notes
    db.session.commit()

    return jsonify({
        'message': 'Prescription verified and approved for dispensing.',
        'prescription': prescription.to_dict()
    }), 200

@prescription_bp.route('/<int:rx_id>/reject', methods=['POST'])
@token_required
@admin_required
def reject_prescription(current_user, rx_id):
    """
    Admin: Reject prescription with clinical reason.
    """
    prescription = Prescription.query.get_or_404(rx_id)
    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    if not reason:
        return jsonify({'error': 'Rejection reason is required.'}), 400

    prescription.status = 'Rejected'
    prescription.reviewed_by = current_user.full_name
    prescription.reviewed_at = datetime.utcnow()
    prescription.rejection_reason = reason
    db.session.commit()

    return jsonify({
        'message': 'Prescription rejected.',
        'prescription': prescription.to_dict()
    }), 200
