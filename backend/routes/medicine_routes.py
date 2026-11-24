from flask import request, jsonify
from datetime import date
from . import medicine_bp
from models import db
from models.medicine import Medicine
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from utils.auth_middleware import token_required, admin_required

@medicine_bp.route('', methods=['GET'])
def list_medicines():
    """List and search medicines across catalog."""
    query = request.args.get('q', '').strip()
    medicine_query = Medicine.query

    if query:
        medicine_query = medicine_query.filter(
            (Medicine.name.ilike(f'%{query}%')) |
            (Medicine.generic_name.ilike(f'%{query}%'))
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
    If 'Both' pharmacies is selected, creates separate inventory entries for Pharmacy A and Pharmacy B!
    Validates required fields, quantities > 0, price > 0, and non-expired dates.
    """
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    generic_name = data.get('generic_name', '').strip()
    strength = data.get('strength', '').strip()
    form = data.get('form', 'Tablet').strip()
    prescription_required = bool(data.get('prescription_required', False))
    batch_number = data.get('batch_number', '').strip()
    quantity = data.get('quantity')
    price = data.get('price')
    mfg_date_str = data.get('mfg_date')
    expiry_date_str = data.get('expiry_date')
    pharmacy_selection = data.get('pharmacy', 'Both Pharmacies') # 'Pharmacy A', 'Pharmacy B', or 'Both Pharmacies'

    # Validation
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
    except ValueError:
        return jsonify({'error': 'Invalid date format. Expected YYYY-MM-DD.'}), 400

    # Find or create base Medicine entry
    med = Medicine.query.filter_by(name=name, strength=strength).first()
    if not med:
        med = Medicine(
            name=name,
            generic_name=generic_name if generic_name else None,
            strength=strength,
            form=form,
            prescription_required=prescription_required
        )
        db.session.add(med)
        db.session.flush()

    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    created_inventories = []

    if pharmacy_selection in ['Both', 'Both Pharmacies']:
        if pharma_a:
            inv_a = Inventory(
                medicine_id=med.id,
                pharmacy_id=pharma_a.id,
                batch_number=f"{batch_number}-A" if not batch_number.endswith("-A") else batch_number,
                quantity=qty,
                price=prc,
                mfg_date=mfg_date,
                expiry_date=expiry_date
            )
            db.session.add(inv_a)
            created_inventories.append(inv_a)

        if pharma_b:
            inv_b = Inventory(
                medicine_id=med.id,
                pharmacy_id=pharma_b.id,
                batch_number=f"{batch_number}-B" if not batch_number.endswith("-B") else batch_number,
                quantity=qty,
                price=prc,
                mfg_date=mfg_date,
                expiry_date=expiry_date
            )
            db.session.add(inv_b)
            created_inventories.append(inv_b)
    else:
        target_pharma = pharma_a if 'A' in pharmacy_selection else pharma_b
        if not target_pharma:
            return jsonify({'error': f'Selected pharmacy {pharmacy_selection} not found.'}), 404

        inv = Inventory(
            medicine_id=med.id,
            pharmacy_id=target_pharma.id,
            batch_number=batch_number,
            quantity=qty,
            price=prc,
            mfg_date=mfg_date,
            expiry_date=expiry_date
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

    if 'name' in data and data['name'].strip():
        med.name = data['name'].strip()
    if 'generic_name' in data:
        med.generic_name = data['generic_name'].strip()
    if 'strength' in data and data['strength'].strip():
        med.strength = data['strength'].strip()
    if 'form' in data and data['form'].strip():
        med.form = data['form'].strip()
    if 'prescription_required' in data:
        med.prescription_required = bool(data['prescription_required'])

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

@medicine_bp.route('/compare', methods=['GET'])
def compare_medicines():
    """
    Compare availability across Pharmacy A and Pharmacy B.
    Requirements:
    - Same medicine & strength accurately matched.
    - Excludes expired stock.
    - If unavailable in both: 'Not available in either pharmacy.'
    - Displays price, available quantity, stock status.
    """
    query = request.args.get('q', '').strip()
    today = date.today()

    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    medicine_query = Medicine.query
    if query:
        medicine_query = medicine_query.filter(
            (Medicine.name.ilike(f'%{query}%')) |
            (Medicine.generic_name.ilike(f'%{query}%'))
        )

    all_medicines = medicine_query.order_by(Medicine.name.asc()).all()
    comparison_results = []

    for med in all_medicines:
        # Get active non-expired batches for Pharmacy A
        batches_a = Inventory.query.filter(
            Inventory.medicine_id == med.id,
            Inventory.pharmacy_id == pharma_a.id if pharma_a else -1,
            Inventory.expiry_date >= today
        ).all()

        total_stock_a = sum(b.quantity for b in batches_a)
        price_a = min((b.price for b in batches_a), default=None) if batches_a else None

        # Get active non-expired batches for Pharmacy B
        batches_b = Inventory.query.filter(
            Inventory.medicine_id == med.id,
            Inventory.pharmacy_id == pharma_b.id if pharma_b else -1,
            Inventory.expiry_date >= today
        ).all()

        total_stock_b = sum(b.quantity for b in batches_b)
        price_b = min((b.price for b in batches_b), default=None) if batches_b else None

        # Determine availability statuses
        status_a = "Available" if total_stock_a >= 20 else ("Low Stock" if total_stock_a > 0 else "Out of Stock")
        status_b = "Available" if total_stock_b >= 20 else ("Low Stock" if total_stock_b > 0 else "Out of Stock")

        unavailable_both = (total_stock_a == 0 and total_stock_b == 0)

        comparison_results.append({
            'medicine_id': med.id,
            'name': med.name,
            'generic_name': med.generic_name,
            'strength': med.strength,
            'form': med.form,
            'prescription_required': med.prescription_required,
            'pharmacy_a': {
                'pharmacy_name': 'Pharmacy A',
                'available': total_stock_a > 0,
                'stock': total_stock_a,
                'price': float(price_a) if price_a is not None else None,
                'status': status_a,
                'inventory_id': batches_a[0].id if batches_a else None
            },
            'pharmacy_b': {
                'pharmacy_name': 'Pharmacy B',
                'available': total_stock_b > 0,
                'stock': total_stock_b,
                'price': float(price_b) if price_b is not None else None,
                'status': status_b,
                'inventory_id': batches_b[0].id if batches_b else None
            },
            'overall_status': 'Not available in either pharmacy.' if unavailable_both else 'Available in one or more pharmacies'
        })

    return jsonify({'comparison': comparison_results}), 200
