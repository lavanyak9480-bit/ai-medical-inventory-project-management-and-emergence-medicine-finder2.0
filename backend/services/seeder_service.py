from datetime import date
from models import db
from models.user import User
from models.pharmacy import Pharmacy
from models.medicine import Medicine
from models.inventory import Inventory
from utils.medicine_images import resolve_medicine_image


def seed_initial_data():
    """
    Populates initial required database records:
    1. Pharmacy A and Pharmacy B
    2. Main Admin (no public registration permitted)
    3. Demo User (for testing workflows)
    4. Verified 50-medicine Pharmacy A and 50-medicine Pharmacy B inventories
    """
    # 1. Create Pharmacies: Pharmacy A and Pharmacy B
    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    if not pharma_a:
        pharma_a = Pharmacy(
            name='Pharmacy A',
            address='Unit 101, Medical Park Central, Sector 4',
            phone='+91 80 2345 6701'
        )
        db.session.add(pharma_a)

    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()
    if not pharma_b:
        pharma_b = Pharmacy(
            name='Pharmacy B',
            address='Unit 204, Metro Health Hub, Sector 9',
            phone='+91 80 2345 6702'
        )
        db.session.add(pharma_b)
    db.session.commit()

    # 2. Create Main Admin
    admin_user = User.query.filter_by(email='admin@medifind.ai').first()
    if not admin_user:
        admin_user = User(
            full_name='Dr. Rajeshwar Rao (Main Admin)',
            email='admin@medifind.ai',
            phone='+91 94400 12345',
            role='admin',
            address='MediFind Central Administration Office'
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)

    # Create Demo User
    demo_user = User.query.filter_by(email='rahul.verma@example.com').first()
    if not demo_user:
        demo_user = User(
            full_name='Rahul Verma',
            email='rahul.verma@example.com',
            phone='+91 98765 43210',
            role='user',
            address='Flat 402, Green Valley Apts, Indiranagar, Bengaluru - 560038'
        )
        demo_user.set_password('user123')
        db.session.add(demo_user)
    db.session.commit()

    # 3. Import verified Pharmacy A (50) & Pharmacy B (50) datasets (idempotent, replaces legacy dataset)
    from services.catalog_importer import import_pharmacy_catalogs
    import_pharmacy_catalogs()

    # 4. Backfill image_url for any medicines missing an image
    updated_imgs = False
    for med in Medicine.query.filter((Medicine.image_url.is_(None)) | (Medicine.image_url == '')).all():
        med.image_url = resolve_medicine_image(med.name, med.strength, med.form)
        updated_imgs = True
    if updated_imgs:
        db.session.commit()


def import_medicines_from_data(records):
    """
    Flexible importer function for importing external / actual medicine data.
    Accepts list of dictionaries with medicine and inventory details.
    """
    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    imported_count = 0
    for rec in records:
        strength = rec.get('strength') or None
        form = rec.get('form', 'Tablet')
        med = Medicine.query.filter_by(
            name=rec['name'],
            strength=strength,
            form=form
        ).first()

        if not med:
            med = Medicine(
                name=rec['name'],
                generic_name=rec.get('generic_name', ''),
                category=rec.get('category'),
                strength=strength,
                form=form,
                indication=rec.get('indication'),
                prescription_required=bool(rec.get('prescription_required', False)),
                image_url=rec.get('image_url') or resolve_medicine_image(rec['name'], strength, form)
            )
            db.session.add(med)
            db.session.flush()

        target_pharma = rec.get('pharmacy', 'Pharmacy A')
        pharma = pharma_a if 'A' in target_pharma else pharma_b

        inv = Inventory(
            medicine_id=med.id,
            pharmacy_id=pharma.id,
            batch_number=rec['batch_number'],
            quantity=int(rec['quantity']),
            price=float(rec['price']),
            mfg_date=date.fromisoformat(rec['mfg_date']) if rec.get('mfg_date') else None,
            expiry_date=date.fromisoformat(rec['expiry_date'])
        )
        db.session.add(inv)
        imported_count += 1

    db.session.commit()
    return imported_count
