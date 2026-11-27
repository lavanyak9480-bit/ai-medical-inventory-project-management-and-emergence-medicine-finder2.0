from datetime import date, datetime
from models import db
from models.user import User
from models.pharmacy import Pharmacy
from models.medicine import Medicine
from models.inventory import Inventory
from models.prescription import Prescription, PrescriptionMedicine
from models.order import Order, OrderItem
from utils.medicine_images import resolve_medicine_image

def seed_initial_data():
    """
    Populates initial required database records:
    1. Main Admin (no public registration permitted)
    2. Demo User (for testing workflows)
    3. Pharmacy A and Pharmacy B
    4. Realistic sample medicines & batch inventory
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

    # 3. Seed Medicines & Inventory Batches
    if Medicine.query.count() == 0:
        sample_medicines = [
            {
                "name": "Amoxicillin",
                "generic_name": "Amoxicillin Trihydrate",
                "strength": "500mg",
                "form": "Capsule",
                "prescription_required": True,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "AMX-2026-A1", "qty": 85, "price": 95.0, "mfg": "2026-01-10", "exp": "2027-06-30"},
                    {"pharmacy": "Pharmacy B", "batch": "AMX-2026-B4", "qty": 120, "price": 88.5, "mfg": "2026-02-15", "exp": "2027-08-20"},
                ]
            },
            {
                "name": "Paracetamol",
                "generic_name": "Acetaminophen",
                "strength": "650mg",
                "form": "Tablet",
                "prescription_required": False,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "PCM-2026-A8", "qty": 210, "price": 32.0, "mfg": "2026-03-01", "exp": "2028-02-28"},
                    {"pharmacy": "Pharmacy B", "batch": "PCM-2026-B2", "qty": 15, "price": 30.0, "mfg": "2026-01-20", "exp": "2028-01-15"}, # Low stock test
                ]
            },
            {
                "name": "Azithromycin",
                "generic_name": "Azithromycin Dihydrate",
                "strength": "500mg",
                "form": "Tablet",
                "prescription_required": True,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "AZI-2026-A3", "qty": 8, "price": 135.0, "mfg": "2025-11-05", "exp": "2026-12-15"}, # Near expiry test
                    {"pharmacy": "Pharmacy B", "batch": "AZI-2026-B9", "qty": 65, "price": 128.0, "mfg": "2026-02-10", "exp": "2027-09-15"},
                ]
            },
            {
                "name": "Pantoprazole",
                "generic_name": "Pantoprazole Sodium",
                "strength": "40mg",
                "form": "Tablet",
                "prescription_required": True,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "PAN-2026-A5", "qty": 140, "price": 78.0, "mfg": "2026-04-12", "exp": "2027-11-30"},
                    {"pharmacy": "Pharmacy B", "batch": "PAN-2026-B1", "qty": 0, "price": 75.0, "mfg": "2025-10-01", "exp": "2027-04-30"}, # Out of stock in B
                ]
            },
            {
                "name": "Metformin",
                "generic_name": "Metformin Hydrochloride",
                "strength": "500mg",
                "form": "Tablet",
                "prescription_required": True,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "MET-2026-A2", "qty": 320, "price": 45.0, "mfg": "2026-01-05", "exp": "2028-04-20"},
                    {"pharmacy": "Pharmacy B", "batch": "MET-2026-B7", "qty": 280, "price": 42.0, "mfg": "2026-02-18", "exp": "2028-06-10"},
                ]
            },
            {
                "name": "Atorvastatin",
                "generic_name": "Atorvastatin Calcium",
                "strength": "20mg",
                "form": "Tablet",
                "prescription_required": True,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "ATV-2026-A9", "qty": 90, "price": 110.0, "mfg": "2026-03-10", "exp": "2027-12-31"},
                    {"pharmacy": "Pharmacy B", "batch": "ATV-2026-B3", "qty": 115, "price": 105.0, "mfg": "2026-01-14", "exp": "2027-10-25"},
                ]
            },
            {
                "name": "Cetirizine",
                "generic_name": "Cetirizine Dihydrochloride",
                "strength": "10mg",
                "form": "Tablet",
                "prescription_required": False,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "CTZ-2026-A6", "qty": 175, "price": 25.0, "mfg": "2026-02-01", "exp": "2028-01-31"},
                    {"pharmacy": "Pharmacy B", "batch": "CTZ-2026-B8", "qty": 190, "price": 24.5, "mfg": "2026-03-15", "exp": "2028-03-31"},
                ]
            },
            {
                "name": "Cough Relief Syrup",
                "generic_name": "Dextromethorphan HBr",
                "strength": "100ml",
                "form": "Syrup",
                "prescription_required": False,
                "batches": [
                    # Expired batch test! Expired date before 2026-11-24
                    {"pharmacy": "Pharmacy A", "batch": "CRS-2025-A1", "qty": 12, "price": 85.0, "mfg": "2025-05-10", "exp": "2026-10-15"},
                ]
            },
            {
                "name": "Insulin Glargine",
                "generic_name": "Insulin Glargine recombinant",
                "strength": "100IU/ml",
                "form": "Injection",
                "prescription_required": True,
                "batches": [
                    {"pharmacy": "Pharmacy B", "batch": "INS-2026-B5", "qty": 24, "price": 590.0, "mfg": "2026-04-01", "exp": "2027-01-15"},
                ]
            },
            {
                "name": "Diclofenac Gel",
                "generic_name": "Diclofenac Diethylamine",
                "strength": "30g",
                "form": "Ointment",
                "prescription_required": False,
                "batches": [
                    {"pharmacy": "Pharmacy A", "batch": "DIC-2026-A4", "qty": 5, "price": 65.0, "mfg": "2025-12-10", "exp": "2027-05-20"},
                ]
            }
        ]

        for item in sample_medicines:
            med = Medicine(
                name=item["name"],
                generic_name=item["generic_name"],
                strength=item["strength"],
                form=item["form"],
                prescription_required=item["prescription_required"],
                image_url=resolve_medicine_image(item["name"], item["strength"], item["form"])
            )
            db.session.add(med)
            db.session.flush()

            for b in item["batches"]:
                pharma = pharma_a if b["pharmacy"] == "Pharmacy A" else pharma_b
                inv = Inventory(
                    medicine_id=med.id,
                    pharmacy_id=pharma.id,
                    batch_number=b["batch"],
                    quantity=b["qty"],
                    price=b["price"],
                    mfg_date=date.fromisoformat(b["mfg"]) if b.get("mfg") else None,
                    expiry_date=date.fromisoformat(b["exp"]),
                    data_source='Seeded Sample'
                )
                db.session.add(inv)

        db.session.commit()

    # 4. Import Pharmacy A & Pharmacy B PDF catalogs (idempotent, preserves missing fields as NULL)
    from services.catalog_importer import import_pharmacy_catalogs
    import_pharmacy_catalogs()

    # 5. Backfill image_url for any existing medicines missing an image
    updated_imgs = False
    for med in Medicine.query.filter((Medicine.image_url.is_(None)) | (Medicine.image_url == '')).all():
        med.image_url = resolve_medicine_image(med.name, med.strength, med.form)
        updated_imgs = True
    if updated_imgs:
        db.session.commit()

def import_medicines_from_data(records):
    """
    Flexible importer function for importing external / actual medicine data later.
    Accepts list of dictionaries with medicine and inventory details.
    """
    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    imported_count = 0
    for rec in records:
        # Check if medicine already exists
        med = Medicine.query.filter_by(
            name=rec['name'],
            strength=rec['strength']
        ).first()

        if not med:
            med = Medicine(
                name=rec['name'],
                generic_name=rec.get('generic_name', ''),
                strength=rec['strength'],
                form=rec.get('form', 'Tablet'),
                prescription_required=bool(rec.get('prescription_required', False)),
                image_url=rec.get('image_url') or resolve_medicine_image(rec['name'], rec['strength'], rec.get('form', 'Tablet'))
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
