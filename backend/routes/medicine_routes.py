from flask import request, jsonify
from datetime import date
import json
from . import medicine_bp
from models import db
from models.medicine import Medicine
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from utils.auth_middleware import token_required, admin_required
from utils.medicine_images import resolve_medicine_image


def _sanitize_image_url(raw_url):
    if not raw_url:
        return None
    cleaned = str(raw_url).strip()
    if not cleaned:
        return None
    if cleaned.startswith('/') or cleaned.startswith('https://') or cleaned.startswith('http://'):
        return cleaned[:500]
    return None


@medicine_bp.route('', methods=['GET'])
def list_medicines():
    """List and search medicines across catalog."""
    query = (request.args.get('q') or request.args.get('search') or '').strip()
    medicine_query = Medicine.query

    if query:
        medicine_query = medicine_query.filter(
            (Medicine.name.ilike(f'%{query}%')) |
            (Medicine.generic_name.ilike(f'%{query}%')) |
            (Medicine.category.ilike(f'%{query}%')) |
            (Medicine.strength.ilike(f'%{query}%')) |
            (Medicine.form.ilike(f'%{query}%'))
        )

    medicines = medicine_query.order_by(Medicine.name.asc()).all()
    return jsonify({'medicines': [m.to_dict() for m in medicines]}), 200


@medicine_bp.route('/<int:med_id>', methods=['GET'])
def get_medicine(med_id):
    """Get single medicine with its active inventory batches."""
    med = Medicine.query.get_or_404(med_id)
    batches = [b.to_dict() for b in med.inventory_batches]
    data = med.to_dict()
    data['inventory_batches'] = batches
    return jsonify({'medicine': data}), 200


@medicine_bp.route('', methods=['POST'])
@token_required
@admin_required
def create_medicine(current_user):
    """
    Admin: Add a new medicine.
    If 'Both' pharmacies is selected, creates separate inventory entries for Pharmacy A and Pharmacy B.
    Validates required fields, quantities > 0, price > 0, and non-expired dates.
    """
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    generic_name = (data.get('generic_name') or '').strip()
    category = (data.get('category') or '').strip() or None
    strength = (data.get('strength') or '').strip()
    form = (data.get('form') or 'Tablet').strip()
    indication = (data.get('indication') or '').strip() or None
    prescription_required = bool(data.get('prescription_required', False))
    prescription_status = (data.get('prescription_status') or ('Rx' if prescription_required else 'Non-prescription')).strip()
    custom_image_url = _sanitize_image_url(data.get('image_url'))
    batch_number = (data.get('batch_number') or '').strip()
    quantity = data.get('quantity')
    price = data.get('price')
    mfg_date_str = data.get('mfg_date')
    expiry_date_str = data.get('expiry_date')
    pharmacy_selection = data.get('pharmacy', 'Both Pharmacies')

    if not name or not strength or not form or not batch_number or not expiry_date_str:
        return jsonify({'error': 'Name, strength, form, batch number, and expiry date are required.'}), 400

    try:
        qty = int(quantity)
        prc = float(price)
        if qty <= 0:
            return jsonify({'error': 'Quantity must be a positive integer greater than 0.'}), 400
        if prc <= 0:
            return jsonify({'error': 'Price must be greater than 0.'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid quantity or price provided.'}), 400

    try:
        expiry_date = date.fromisoformat(expiry_date_str)
        if expiry_date < date.today():
            return jsonify({'error': 'Cannot add expired batches as sellable inventory stock.'}), 400
        mfg_date = date.fromisoformat(mfg_date_str) if mfg_date_str else None
        if mfg_date and mfg_date >= expiry_date:
            return jsonify({'error': 'Manufacture date must be earlier than expiry date.'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date format. Expected YYYY-MM-DD.'}), 400

    valid_selections = {'Both', 'Both Pharmacies', 'Pharmacy A', 'Pharmacy B'}
    if pharmacy_selection not in valid_selections:
        return jsonify({'error': f"Invalid pharmacy selection '{pharmacy_selection}'. Choose Pharmacy A, Pharmacy B, or Both Pharmacies."}), 400

    # Match existing Medicine accurately by (name, strength, form)
    med = Medicine.query.filter_by(name=name, strength=strength, form=form).first()
    if not med:
        med = Medicine(
            name=name,
            generic_name=generic_name if generic_name else None,
            category=category,
            strength=strength,
            form=form,
            indication=indication,
            prescription_status=prescription_status,
            prescription_required=prescription_required,
            image_url=custom_image_url or resolve_medicine_image(name, strength, form)
        )
        db.session.add(med)
        db.session.flush()

    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    created_inventories = []

    if pharmacy_selection in ['Both', 'Both Pharmacies']:
        if pharma_a:
            bn_a = f"{batch_number}-A" if not batch_number.endswith("-A") else batch_number
            if Inventory.query.filter_by(medicine_id=med.id, pharmacy_id=pharma_a.id, batch_number=bn_a).first():
                return jsonify({'error': f"Batch '{bn_a}' for {med.name} already exists in Pharmacy A."}), 409
            inv_a = Inventory(
                medicine_id=med.id,
                pharmacy_id=pharma_a.id,
                batch_number=bn_a,
                quantity=qty,
                price=prc,
                mfg_date=mfg_date,
                expiry_date=expiry_date,
                data_source='Admin Manual Entry',
                missing_fields=json.dumps([])
            )
            db.session.add(inv_a)
            created_inventories.append(inv_a)

        if pharma_b:
            bn_b = f"{batch_number}-B" if not batch_number.endswith("-B") else batch_number
            if Inventory.query.filter_by(medicine_id=med.id, pharmacy_id=pharma_b.id, batch_number=bn_b).first():
                return jsonify({'error': f"Batch '{bn_b}' for {med.name} already exists in Pharmacy B."}), 409
            inv_b = Inventory(
                medicine_id=med.id,
                pharmacy_id=pharma_b.id,
                batch_number=bn_b,
                quantity=qty,
                price=prc,
                mfg_date=mfg_date,
                expiry_date=expiry_date,
                data_source='Admin Manual Entry',
                missing_fields=json.dumps([])
            )
            db.session.add(inv_b)
            created_inventories.append(inv_b)
    else:
        target_pharma = pharma_a if pharmacy_selection == 'Pharmacy A' else pharma_b
        if not target_pharma:
            return jsonify({'error': f'Selected pharmacy {pharmacy_selection} not found.'}), 404

        if Inventory.query.filter_by(medicine_id=med.id, pharmacy_id=target_pharma.id, batch_number=batch_number).first():
            return jsonify({'error': f"Batch '{batch_number}' for {med.name} already exists in {target_pharma.name}."}), 409

        inv = Inventory(
            medicine_id=med.id,
            pharmacy_id=target_pharma.id,
            batch_number=batch_number,
            quantity=qty,
            price=prc,
            mfg_date=mfg_date,
            expiry_date=expiry_date,
            data_source='Admin Manual Entry',
            missing_fields=json.dumps([])
        )
        db.session.add(inv)
        created_inventories.append(inv)

    db.session.commit()

    return jsonify({
        'message': f'Successfully added {med.name} {med.strength} to inventory.',
        'medicine': med.to_dict(),
        'inventories': [inv.to_dict() for inv in created_inventories]
    }), 201


@medicine_bp.route('/<int:med_id>', methods=['PUT'])
@token_required
@admin_required
def update_medicine(current_user, med_id):
    """Admin: Edit medicine details."""
    med = Medicine.query.get_or_404(med_id)
    data = request.get_json() or {}

    if 'name' in data and str(data['name']).strip():
        med.name = str(data['name']).strip()
    if 'generic_name' in data:
        med.generic_name = (data['generic_name'] or '').strip() or None
    if 'category' in data:
        med.category = (data['category'] or '').strip() or None
    if 'strength' in data:
        med.strength = (data['strength'] or '').strip() or None
    if 'form' in data and str(data['form']).strip():
        med.form = str(data['form']).strip()
    if 'indication' in data:
        med.indication = (data['indication'] or '').strip() or None
    if 'prescription_status' in data:
        med.prescription_status = (data['prescription_status'] or '').strip() or None
    if 'prescription_required' in data:
        med.prescription_required = bool(data['prescription_required'])
    if 'image_url' in data:
        sanitized_img = _sanitize_image_url(data.get('image_url'))
        med.image_url = sanitized_img or resolve_medicine_image(med.name, med.strength, med.form)
    elif not med.image_url:
        med.image_url = resolve_medicine_image(med.name, med.strength, med.form)

    db.session.commit()
    return jsonify({
        'message': 'Medicine details updated successfully.',
        'medicine': med.to_dict()
    }), 200


@medicine_bp.route('/<int:med_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_medicine(current_user, med_id):
    """Admin: Delete medicine and its inventory."""
    med = Medicine.query.get_or_404(med_id)
    db.session.delete(med)
    db.session.commit()
    return jsonify({'message': f'Medicine {med.name} deleted successfully.'}), 200


def _build_pharmacy_offer(batches, pharmacy_name, today):
    """Computes comparison offer for a single pharmacy without including expired stock as available."""
    if not batches:
        return {
            'pharmacy_name': pharmacy_name,
            'available': False,
            'stocked_in_catalog': False,
            'stock': 0,
            'price': None,
            'expiry_date': None,
            'batch_number': None,
            'is_near_expiry': False,
            'status': 'Not Stocked',
            'inventory_id': None,
            'missing_fields': []
        }

    # Sellable: not expired, has quantity > 0, has valid price and expiry_date
    sellable = [
        b for b in batches
        if b.expiry_date is not None
        and b.expiry_date >= today
        and b.quantity is not None
        and b.quantity > 0
        and b.price is not None
        and b.price > 0
    ]

    if sellable:
        total_stock = sum(b.quantity for b in sellable)
        best = min(sellable, key=lambda b: b.price)
        status = 'Available' if total_stock >= 20 else 'Low Stock'
        return {
            'pharmacy_name': pharmacy_name,
            'available': True,
            'stocked_in_catalog': True,
            'stock': total_stock,
            'price': float(best.price),
            'expiry_date': best.expiry_date.isoformat(),
            'batch_number': best.batch_number,
            'is_near_expiry': best.is_near_expiry(),
            'status': status,
            'inventory_id': best.id,
            'missing_fields': best.get_missing_fields_list()
        }

    # Non-expired with 0 stock
    zero_stock = [b for b in batches if b.expiry_date is not None and b.expiry_date >= today and b.quantity == 0]
    if zero_stock:
        ref = zero_stock[0]
        return {
            'pharmacy_name': pharmacy_name,
            'available': False,
            'stocked_in_catalog': True,
            'stock': 0,
            'price': float(ref.price) if ref.price is not None else None,
            'expiry_date': ref.expiry_date.isoformat(),
            'batch_number': ref.batch_number,
            'is_near_expiry': ref.is_near_expiry(),
            'status': 'Out of Stock',
            'inventory_id': ref.id,
            'missing_fields': ref.get_missing_fields_list()
        }

    # Catalog records where price/quantity/expiry are missing from PDF
    incomplete = [b for b in batches if b.price is None or b.quantity is None or b.expiry_date is None]
    if incomplete:
        ref = incomplete[0]
        return {
            'pharmacy_name': pharmacy_name,
            'available': False,
            'stocked_in_catalog': True,
            'stock': ref.quantity,
            'price': float(ref.price) if ref.price is not None else None,
            'expiry_date': ref.expiry_date.isoformat() if ref.expiry_date else None,
            'batch_number': ref.batch_number,
            'is_near_expiry': False,
            'status': 'Catalog Listed (Price/Stock Missing)',
            'inventory_id': ref.id,
            'missing_fields': ref.get_missing_fields_list()
        }

    # Remaining batches are expired
    return {
        'pharmacy_name': pharmacy_name,
        'available': False,
        'stocked_in_catalog': True,
        'stock': 0,
        'price': None,
        'expiry_date': None,
        'batch_number': None,
        'is_near_expiry': False,
        'status': 'Expired (Blocked)',
        'inventory_id': None,
        'missing_fields': []
    }


@medicine_bp.route('/compare', methods=['GET'])
def compare_medicines():
    """
    Compare availability across Pharmacy A and Pharmacy B.
    Requirements:
    - Same medicine, strength & dosage form accurately matched (never compare different strengths as same).
    - Excludes expired stock from available results.
    - If unavailable in both: 'Not available in either pharmacy.'
    """
    query = (request.args.get('q') or request.args.get('search') or '').strip()
    today = date.today()

    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    medicine_query = Medicine.query
    if query:
        medicine_query = medicine_query.filter(
            (Medicine.name.ilike(f'%{query}%')) |
            (Medicine.generic_name.ilike(f'%{query}%')) |
            (Medicine.category.ilike(f'%{query}%')) |
            (Medicine.strength.ilike(f'%{query}%')) |
            (Medicine.form.ilike(f'%{query}%'))
        )

    all_medicines = medicine_query.order_by(Medicine.name.asc()).all()
    med_ids = [m.id for m in all_medicines]
    batches_by_key = {}
    if med_ids:
        all_batches = Inventory.query.filter(Inventory.medicine_id.in_(med_ids)).all()
        for b in all_batches:
            batches_by_key.setdefault((b.medicine_id, b.pharmacy_id), []).append(b)

    pharma_a_id = pharma_a.id if pharma_a else -1
    pharma_b_id = pharma_b.id if pharma_b else -1
    comparison_results = []

    for med in all_medicines:
        batches_a = batches_by_key.get((med.id, pharma_a_id), [])
        batches_b = batches_by_key.get((med.id, pharma_b_id), [])

        offer_a = _build_pharmacy_offer(batches_a, 'Pharmacy A', today)
        offer_b = _build_pharmacy_offer(batches_b, 'Pharmacy B', today)

        unavailable_both = (not offer_a['available'] and not offer_b['available'])

        comparison_results.append({
            'medicine_id': med.id,
            'name': med.name,
            'generic_name': med.generic_name,
            'category': med.category,
            'strength': med.strength,
            'form': med.form,
            'indication': med.indication,
            'prescription_status': med.prescription_status,
            'prescription_required': med.prescription_required,
            'image_url': med.get_image_url(),
            'pharmacy_a': offer_a,
            'pharmacy_b': offer_b,
            'overall_status': 'Not available in either pharmacy.' if unavailable_both else 'Available in one or more pharmacies'
        })

    return jsonify({'comparison': comparison_results}), 200
