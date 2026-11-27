import os
from flask import request, jsonify, current_app, send_from_directory
from datetime import datetime, timezone
from . import prescription_bp
from models import db
from models.prescription import Prescription, PrescriptionMedicine
from utils.auth_middleware import token_required, admin_required
from utils.helpers import validate_uploaded_file, save_uploaded_file
from services.ocr_service import extract_prescription_text, parse_clinical_entities


@prescription_bp.route('/upload', methods=['POST'])
@token_required
def upload_prescription(current_user):
    """
    Users upload prescriptions as JPG, JPEG, PNG, or PDF.
    Validates file content & size, extracts clinical entities using OCR/PDF parser.
    Status set to 'Pending Verification'.
    OCR does NOT automatically approve prescriptions!
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded in request.'}), 400

    file = request.files['file']
    is_valid, err_msg = validate_uploaded_file(
        file,
        allowed_extensions=current_app.config['ALLOWED_EXTENSIONS'],
        max_bytes=current_app.config.get('MAX_CONTENT_LENGTH', 10 * 1024 * 1024)
    )
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    unique_filename, filepath = save_uploaded_file(file, current_app.config['UPLOAD_FOLDER'])
    file_size_kb = round(os.path.getsize(filepath) / 1024, 1)
    safe_display_name = os.path.basename(file.filename or 'prescription')[:255] or 'prescription'

    prescription = Prescription(
        user_id=current_user.id,
        file_name=safe_display_name,
        file_path=unique_filename,
        file_type=file.content_type or 'image/jpeg',
        file_size=f"{file_size_kb} KB",
        status='Pending Verification'  # Mandatory: OCR does not auto-approve
    )
    db.session.add(prescription)
    db.session.flush()

    raw_text = extract_prescription_text(filepath)
    extracted_entities = parse_clinical_entities(raw_text, filename=file.filename)

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


@prescription_bp.route('/my', methods=['GET'])
@token_required
def get_my_prescriptions(current_user):
    """Get prescriptions belonging to the currently authenticated user."""
    prescriptions = Prescription.query.filter_by(user_id=current_user.id).order_by(Prescription.created_at.desc()).all()
    return jsonify({'prescriptions': [p.to_dict() for p in prescriptions]}), 200


@prescription_bp.route('/all', methods=['GET'])
@token_required
@admin_required
def get_all_prescriptions(current_user):
    """Admin: Get all uploaded prescriptions across users."""
    prescriptions = Prescription.query.order_by(Prescription.created_at.desc()).all()
    return jsonify({'prescriptions': [p.to_dict() for p in prescriptions]}), 200


@prescription_bp.route('/<int:rx_id>', methods=['GET'])
@token_required
def get_prescription(current_user, rx_id):
    """View details of a specific prescription."""
    prescription = Prescription.query.get_or_404(rx_id)
    if current_user.role != 'admin' and prescription.user_id != current_user.id:
        return jsonify({'error': 'Access denied to this prescription.'}), 403

    return jsonify({'prescription': prescription.to_dict()}), 200


@prescription_bp.route('/file/<path:filename>', methods=['GET'])
@token_required
def get_uploaded_file(current_user, filename):
    """Serve uploaded prescription document/image only to its owner or Main Admin."""
    rx = Prescription.query.filter_by(file_path=filename).first_or_404()
    if current_user.role != 'admin' and rx.user_id != current_user.id:
        return jsonify({'error': 'Access denied to this prescription file.'}), 403
    safe_name = os.path.basename(rx.file_path or '')
    if not safe_name or safe_name != rx.file_path:
        return jsonify({'error': 'Invalid prescription file path.'}), 400
    full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], safe_name)
    if not os.path.isfile(full_path):
        return jsonify({'error': 'Prescription file not found on server.'}), 404
    resp = send_from_directory(current_app.config['UPLOAD_FOLDER'], safe_name)
    resp.headers['X-Content-Type-Options'] = 'nosniff'
    resp.headers['Content-Security-Policy'] = "default-src 'none'"
    return resp


@prescription_bp.route('/<int:rx_id>/verify', methods=['POST'])
@token_required
@admin_required
def verify_prescription(current_user, rx_id):
    """Admin: Verify prescription and authorize for dispensing."""
    prescription = Prescription.query.get_or_404(rx_id)
    data = request.get_json() or {}
    notes = (data.get('notes') or f"Verified by Main Admin ({current_user.full_name})").strip()

    # Optional manually confirmed/corrected medicine entries from Admin review
    confirmed_medicines = data.get('confirmed_medicines')
    confirmed_count = 0
    if isinstance(confirmed_medicines, list):
        cleaned_items = []
        for item in confirmed_medicines:
            if not isinstance(item, dict):
                continue
            med_name = (item.get('name') or item.get('medicine_name') or '').strip()
            strength = (item.get('strength') or 'As prescribed').strip()
            if not med_name or len(med_name) < 2 or 'unable to detect' in med_name.lower():
                continue
            cleaned_items.append({
                'medicine_name': med_name,
                'strength': strength,
                'dosage': (item.get('dosage') or 'As directed').strip(),
                'frequency': (item.get('frequency') or 'As directed').strip(),
                'duration': (item.get('duration') or 'As prescribed').strip(),
                'confidence': 'Verified'
            })
        if not cleaned_items:
            return jsonify({
                'error': 'Cannot verify prescription without at least one confirmed medicine name. Please provide valid medicine details or reject the prescription.'
            }), 400
        PrescriptionMedicine.query.filter_by(prescription_id=prescription.id).delete()
        for ci in cleaned_items:
            db.session.add(PrescriptionMedicine(
                prescription_id=prescription.id,
                medicine_name=ci['medicine_name'],
                strength=ci['strength'],
                dosage=ci['dosage'],
                frequency=ci['frequency'],
                duration=ci['duration'],
                confidence='High',
                is_confirmed=True
            ))
        confirmed_count = len(cleaned_items)
    else:
        for pm in prescription.medicines:
            pm_name = (pm.medicine_name or '').strip()
            if pm_name and len(pm_name) >= 2 and 'unable to detect' not in pm_name.lower():
                pm.is_confirmed = True
                confirmed_count += 1

    if confirmed_count == 0:
        return jsonify({
            'error': 'Cannot verify an unclear prescription with no confirmed readable medicines. Please confirm medicine names manually or reject the prescription.'
        }), 400

    prescription.status = 'Verified'
    prescription.reviewed_by = current_user.full_name
    prescription.reviewed_at = datetime.now(timezone.utc)
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
    """Admin: Reject prescription with clinical reason."""
    prescription = Prescription.query.get_or_404(rx_id)
    data = request.get_json() or {}
    reason = (data.get('reason') or '').strip()

    if not reason:
        return jsonify({'error': 'Rejection reason is required.'}), 400

    prescription.status = 'Rejected'
    prescription.reviewed_by = current_user.full_name
    prescription.reviewed_at = datetime.now(timezone.utc)
    prescription.rejection_reason = reason
    db.session.commit()

    return jsonify({
        'message': 'Prescription rejected.',
        'prescription': prescription.to_dict()
    }), 200
