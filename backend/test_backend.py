"""
Comprehensive End-to-End Test Suite for MediFind AI Backend
Runs against an isolated temporary SQLite database & upload folder so dev data is never polluted.
"""

import sys
import os
import io
import tempfile
from PIL import Image, PngImagePlugin

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from models import db
from models.medicine import Medicine
from models.inventory import Inventory


def _make_png_bytes(prescription_text=None):
    buf = io.BytesIO()
    img = Image.new('RGB', (40, 40), color=(255, 255, 255))
    if prescription_text:
        meta = PngImagePlugin.PngInfo()
        meta.add_text("PrescriptionText", prescription_text)
        img.save(buf, format='PNG', pnginfo=meta)
    else:
        img.save(buf, format='PNG')
    buf.seek(0)
    return buf


def _make_jpeg_bytes():
    buf = io.BytesIO()
    img = Image.new('RGB', (40, 40), color=(240, 248, 255))
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf


def _make_pdf_bytes(text_line):
    """Generates a minimal valid single-page PDF containing selectable text."""
    escaped = text_line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
    stream_content = f"BT /F1 12 Tf 72 720 Td ({escaped}) Tj ET".encode('latin-1')
    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        b"4 0 obj\n<< /Length " + str(len(stream_content)).encode('ascii') + b" >>\nstream\n" + stream_content + b"\nendstream\nendobj\n",
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(out))
        out.extend(obj)
    xref_pos = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode('ascii'))
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode('ascii'))
    out.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode('ascii')
    )
    return io.BytesIO(bytes(out))


def run_tests():
    with tempfile.TemporaryDirectory() as tmpdir:
        test_db_path = os.path.join(tmpdir, 'test_medifind.db')
        test_upload_dir = os.path.join(tmpdir, 'uploads')

        app = create_app(config_overrides={
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': f'sqlite:///{test_db_path}',
            'UPLOAD_FOLDER': test_upload_dir,
        })
        app_reloaded = None
        try:
            _execute_test_suite(app, test_db_path, test_upload_dir)
        finally:
            with app.app_context():
                db.session.remove()
                db.engine.dispose()


def _execute_test_suite(app, test_db_path, test_upload_dir):
    client = app.test_client()

    print("\n" + "=" * 70)
    print("STARTING MEDIFIND AI BACKEND COMPREHENSIVE TEST SUITE")
    print("=" * 70)

    # 1. Health check
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    assert res.get_json()['status'] == 'healthy'
    print("[1/25] Health Check Endpoint: OK")

    # 2. Admin Login
    res = client.post('/api/auth/login', json={
        'email': 'admin@medifind.ai',
        'password': 'admin123'
    })
    assert res.status_code == 200, f"Admin login failed: {res.data}"
    admin_data = res.get_json()
    admin_token = admin_data['token']
    assert admin_data['role'] == 'admin'
    print("[2/25] Admin Login & JWT Generation: OK")

    # 3. User Registration
    test_user_email = f"testuser_{os.urandom(4).hex()}@example.com"
    res = client.post('/api/auth/register', json={
        'full_name': 'Ananya Sharma',
        'email': test_user_email,
        'phone': '+91 91234 56789',
        'password': 'password123',
        'address': '742 Evergreen Terrace, Sector 12, Bengaluru'
    })
    assert res.status_code == 201, f"Registration failed: {res.data}"
    reg_data = res.get_json()
    user_token = reg_data['token']
    assert reg_data['user']['role'] == 'user'
    print("[3/25] User Registration & Role Enforcement: OK")

    # 4. User Login & Second User for isolation tests
    res = client.post('/api/auth/login', json={
        'email': test_user_email,
        'password': 'password123'
    })
    assert res.status_code == 200, f"User login failed: {res.data}"
    other_email = f"other_{os.urandom(4).hex()}@example.com"
    res_other = client.post('/api/auth/register', json={
        'full_name': 'Other User',
        'email': other_email,
        'password': 'password123'
    })
    assert res_other.status_code == 201
    other_token = res_other.get_json()['token']
    print("[4/25] User Login & Isolation Setup: OK")

    # 5. Access Control Test: Normal user cannot access Admin endpoints
    for admin_ep in ['/api/admin/dashboard', '/api/admin/users', '/api/alerts/all', '/api/orders/all', '/api/prescriptions/all']:
        res = client.get(admin_ep, headers={'Authorization': f'Bearer {user_token}'})
        assert res.status_code == 403, f"Expected 403 on {admin_ep}, got {res.status_code}"
    assert client.get('/api/admin/dashboard').status_code == 401
    print("[5/25] Role-Based Access Control (401/403): OK")

    # 6. Admin Add Medicine with 'Both Pharmacies' + Expired & Duplicate Validation
    res = client.post('/api/medicines', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'name': 'Cefixime',
        'generic_name': 'Cefixime Trihydrate',
        'strength': '200mg',
        'form': 'Tablet',
        'prescription_required': True,
        'batch_number': 'CFX-2026-X1',
        'quantity': 150,
        'price': 115.0,
        'mfg_date': '2026-01-01',
        'expiry_date': '2028-01-01',
        'pharmacy': 'Both Pharmacies'
    })
    assert res.status_code == 201, f"Add medicine failed: {res.data}"
    med_data = res.get_json()
    assert len(med_data['inventories']) == 2
    med_id = med_data['medicine']['id']
    inv_id_a = med_data['inventories'][0]['id']

    # Reject expired add
    res_exp = client.post('/api/medicines', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'name': 'TestExpired',
        'strength': '10mg',
        'form': 'Tablet',
        'batch_number': 'EXP-01',
        'quantity': 10,
        'price': 10.0,
        'expiry_date': '2020-01-01',
        'pharmacy': 'Pharmacy A'
    })
    assert res_exp.status_code == 400
    # Reject duplicate batch
    res_dup = client.post('/api/medicines', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'name': 'Cefixime',
        'strength': '200mg',
        'form': 'Tablet',
        'batch_number': 'CFX-2026-X1',
        'quantity': 10,
        'price': 115.0,
        'expiry_date': '2028-01-01',
        'pharmacy': 'Both Pharmacies'
    })
    assert res_dup.status_code == 409
    print("[6/25] Admin Add Medicine (Dual Pharmacy, Expired Block, Duplicate Block): OK")

    # 7. Edit Medicine & Inventory Update
    res = client.put(f'/api/medicines/{med_id}', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'generic_name': 'Cefixime Anhydrous'
    })
    assert res.status_code == 200
    res = client.put(f'/api/inventory/{inv_id_a}', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'quantity': 140,
        'price': 112.0
    })
    assert res.status_code == 200
    assert res.get_json()['inventory']['quantity'] == 140
    print("[7/25] Admin Edit Medicine & Inventory Batch Update: OK")

    # 8. Dual Pharmacy Medicine Comparison & Search
    res = client.get('/api/medicines/compare?search=Amoxicillin')
    assert res.status_code == 200
    comp_list = res.get_json()['comparison']
    amx = next((m for m in comp_list if m['name'] == 'Amoxicillin' and m['strength'] == '500mg'), None)
    assert amx is not None
    assert amx['pharmacy_a']['available'] is True and amx['pharmacy_a']['stock'] > 0
    assert amx['pharmacy_b']['available'] is True and amx['pharmacy_b']['stock'] > 0
    # Expired Cough Relief Syrup must NOT be marked available
    res_crs = client.get('/api/medicines/compare?search=Cough%20Relief%20Syrup')
    crs = res_crs.get_json()['comparison'][0]
    assert crs['pharmacy_a']['available'] is False
    assert crs['pharmacy_a']['status'] == 'Expired (Blocked)'
    print("[8/25] Dual Pharmacy Comparison & Expired Quarantine: OK")

    # 9. Pharmacy A & B Dedicated Inventory Views (No Duplicates)
    res_a = client.get('/api/inventory/pharmacy-a')
    res_b = client.get('/api/inventory/pharmacy-b')
    assert res_a.status_code == 200 and res_b.status_code == 200
    assert len(res_a.get_json()['inventory']) >= 58
    assert len(res_b.get_json()['inventory']) >= 138
    print("[9/25] Pharmacy A & B Dedicated Inventory Views: OK")

    # 10. Upload Security: Reject spoofed/corrupted files
    spoofed = (io.BytesIO(b"<html><script>alert(1)</script></html>"), "fake.jpg")
    res_spoof = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': spoofed}, content_type='multipart/form-data')
    assert res_spoof.status_code == 400
    bad_pdf = (io.BytesIO(b"not a real pdf"), "bad.pdf")
    res_bad_pdf = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': bad_pdf}, content_type='multipart/form-data')
    assert res_bad_pdf.status_code == 400
    print("[10/25] Upload Security (Spoofed JPG & Invalid PDF Rejected): OK")

    # 11. Prescription Upload: Valid PNG with clinical text, JPG, JPEG, and PDF
    png_file = (_make_png_bytes("Amoxicillin 500mg Twice daily 5 days\nParacetamol 650mg SOS 3 days"), "rx_valid.png")
    res_png = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': png_file}, content_type='multipart/form-data')
    assert res_png.status_code == 201, f"PNG upload failed: {res_png.data}"
    rx_json = res_png.get_json()['prescription']
    rx_id = rx_json['id']
    rx_file_path = rx_json['file_path']
    assert rx_json['status'] == 'Pending Verification'
    assert any(m['name'] == 'Amoxicillin' and m['strength'] == '500mg' for m in rx_json['medicines'])

    # Valid JPG & JPEG upload (no Tesseract -> safe unclear fallback, never guesses)
    for ext in ('jpg', 'jpeg'):
        res_img = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': (_make_jpeg_bytes(), f"amoxicillin_scan.{ext}")}, content_type='multipart/form-data')
        assert res_img.status_code == 201, f"{ext} upload failed: {res_img.data}"
        meds = res_img.get_json()['prescription']['medicines']
        assert meds[0]['name'] == 'Unable to detect – manual confirmation required.'

    # Valid PDF upload with real PDF text extraction
    pdf_file = (_make_pdf_bytes("Atorvastatin 20mg Once daily 30 days"), "cardio_rx.pdf")
    res_pdf = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': pdf_file}, content_type='multipart/form-data')
    assert res_pdf.status_code == 201, f"PDF upload failed: {res_pdf.data}"
    pdf_meds = res_pdf.get_json()['prescription']['medicines']
    assert any(m['name'] == 'Atorvastatin' and m['strength'] == '20mg' for m in pdf_meds), f"PDF OCR failed: {pdf_meds}"
    print("[11/25] Prescription Upload (PNG, JPG, JPEG, PDF + Safe Unclear Fallback): OK")

    # 12. Prescription File Download Security
    assert client.get(f'/api/prescriptions/file/{rx_file_path}').status_code == 401
    assert client.get(f'/api/prescriptions/file/{rx_file_path}', headers={'Authorization': f'Bearer {other_token}'}).status_code == 403
    assert client.get(f'/api/prescriptions/file/{rx_file_path}', headers={'Authorization': f'Bearer {user_token}'}).status_code == 200
    assert client.get(f'/api/prescriptions/file/{rx_file_path}', headers={'Authorization': f'Bearer {admin_token}'}).status_code == 200
    print("[12/25] Prescription File Access Control (401/403/200): OK")

    # 13. Rx Medicine Blocked Before Admin Verification
    with app.app_context():
        amx_inv = Inventory.query.join(Medicine).filter(Medicine.name == 'Amoxicillin', Inventory.quantity > 5).first()
        amx_inv_id = amx_inv.id
        amx_pharma = amx_inv.pharmacy.name
        amx_initial_qty = amx_inv.quantity

        expired_inv = Inventory.query.filter(Inventory.batch_number == 'CRS-2025-A1').first()
        expired_inv_id = expired_inv.id

    res_rx_block = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': amx_pharma,
        'items': [{'inventory_id': amx_inv_id, 'quantity': 1}],
        'delivery_address': 'Test Address'
    })
    assert res_rx_block.status_code == 400
    print("[13/25] Rx Medicine Blocked Without Verified Prescription: OK")

    # 14. Admin Prescription Verification & Rejection
    res = client.post(f'/api/prescriptions/{rx_id}/verify', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'notes': 'Verified by Main Admin.'
    })
    assert res.status_code == 200 and res.get_json()['prescription']['status'] == 'Verified'

    res_blurry = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': (_make_png_bytes("blurry unreadable line"), "blurry.png")}, content_type='multipart/form-data')
    blurry_id = res_blurry.get_json()['prescription']['id']
    res_rej = client.post(f'/api/prescriptions/{blurry_id}/reject', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'reason': 'Prescription image is too blurry.'
    })
    assert res_rej.status_code == 200 and res_rej.get_json()['prescription']['status'] == 'Rejected'
    print("[14/25] Admin Prescription Verification & Rejection: OK")

    # 15. Prevent Ordering Expired or Over-Stock Medicines
    res_exp_ord = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': 'Pharmacy A',
        'items': [{'inventory_id': expired_inv_id, 'quantity': 1}],
        'delivery_address': 'Test Address'
    })
    assert res_exp_ord.status_code == 400

    res_over_ord = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': amx_pharma,
        'items': [{'inventory_id': amx_inv_id, 'quantity': 9999}],
        'delivery_address': 'Test Address'
    })
    assert res_over_ord.status_code == 400
    print("[15/25] Prevent Ordering Expired & Over-Stock Medicines: OK")

    # 16. Order Creation + Payment Failure Handling (No Stock Deduction) + Payment Success
    res = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': amx_pharma,
        'items': [{'inventory_id': amx_inv_id, 'quantity': 2}],
        'delivery_address': 'Flat 402, Green Valley Apts, Indiranagar, Bengaluru'
    })
    assert res.status_code == 201
    order_id = res.get_json()['order']['id']

    res_fail = client.post(f'/api/orders/{order_id}/pay', headers={'Authorization': f'Bearer {user_token}'}, json={'status': 'Failed'})
    assert res_fail.status_code == 200 and res_fail.get_json()['order']['payment_status'] == 'Failed'
    with app.app_context():
        assert db.session.get(Inventory, amx_inv_id).quantity == amx_initial_qty

    res_pay = client.post(f'/api/orders/{order_id}/pay', headers={'Authorization': f'Bearer {user_token}'}, json={'status': 'Paid'})
    assert res_pay.status_code == 200 and res_pay.get_json()['order']['payment_status'] == 'Paid'
    with app.app_context():
        assert db.session.get(Inventory, amx_inv_id).quantity == amx_initial_qty - 2
    print("[16/25] Order Creation, Payment Failure (Stock Intact), Payment Success (Stock Deducted): OK")

    # 17. Order Cancellation Restores Stock
    res_cancel_test = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': amx_pharma,
        'items': [{'inventory_id': amx_inv_id, 'quantity': 3}],
        'delivery_address': 'Flat 402, Green Valley Apts'
    })
    cancel_order_id = res_cancel_test.get_json()['order']['id']
    client.post(f'/api/orders/{cancel_order_id}/pay', headers={'Authorization': f'Bearer {user_token}'}, json={'status': 'Paid'})
    res_cancel = client.post(f'/api/orders/{cancel_order_id}/cancel', headers={'Authorization': f'Bearer {user_token}'})
    assert res_cancel.status_code == 200
    assert res_cancel.get_json()['order']['order_status'] == 'Cancelled'
    with app.app_context():
        assert db.session.get(Inventory, amx_inv_id).quantity == amx_initial_qty - 2
    print("[17/25] Order Cancellation & Stock Restoration: OK")

    # 18. Order Tracking 5-Stage Progression & Dispatched Order Cannot Cancel
    for st in ["Verification", "Preparing", "Dispatched", "Delivered"]:
        res = client.put(f'/api/orders/{order_id}/status', headers={'Authorization': f'Bearer {admin_token}'}, json={'status': st})
        assert res.status_code == 200
    assert client.post(f'/api/orders/{order_id}/cancel', headers={'Authorization': f'Bearer {user_token}'}).status_code == 400
    print("[18/25] Order Tracking 5-Stage Progression & Delivered Cancel Guard: OK")

    # 19. Payment Cancellation Flow
    res_ord2 = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': amx_pharma,
        'items': [{'inventory_id': amx_inv_id, 'quantity': 1}],
        'delivery_address': 'Test Address'
    })
    ord2_id = res_ord2.get_json()['order']['id']
    res_pay_cancel = client.post(f'/api/orders/{ord2_id}/pay', headers={'Authorization': f'Bearer {user_token}'}, json={'status': 'Cancelled'})
    assert res_pay_cancel.status_code == 200
    assert res_pay_cancel.get_json()['order']['order_status'] == 'Cancelled'
    assert res_pay_cancel.get_json()['order']['payment_status'] == 'Cancelled'
    print("[19/25] Payment Cancellation Flow: OK")

    # 20. Admin Dashboard & Alerts Consistency
    res_dash = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {admin_token}'})
    res_alerts = client.get('/api/alerts/all', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_dash.status_code == 200 and res_alerts.status_code == 200
    dash_metrics = res_dash.get_json()['metrics']
    alert_counts = res_alerts.get_json()['counts']
    assert dash_metrics['low_stock'] == alert_counts['low_stock_count']
    assert dash_metrics['near_expiry'] == alert_counts['near_expiry_count']
    print("[20/25] Admin Dashboard & Alerts Statistics Consistency: OK")

    # 21. User Profile Update & Duplicate Email Check
    res_prof = client.put('/api/users/profile', headers={'Authorization': f'Bearer {user_token}'}, json={
        'full_name': 'Ananya S. Updated',
        'phone': '+91 99999 88888',
        'address': 'New Address 123'
    })
    assert res_prof.status_code == 200
    assert res_prof.get_json()['user']['full_name'] == 'Ananya S. Updated'
    res_dup_email = client.put('/api/users/profile', headers={'Authorization': f'Bearer {user_token}'}, json={
        'email': 'admin@medifind.ai'
    })
    assert res_dup_email.status_code == 409
    print("[21/25] User Profile Update & Duplicate Email Guard: OK")

    # 22. Delete Inventory Batch & Medicine
    res_del_inv = client.delete(f'/api/inventory/{inv_id_a}', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_del_inv.status_code == 200
    res_del_med = client.delete(f'/api/medicines/{med_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_del_med.status_code == 200
    assert client.get(f'/api/medicines/{med_id}').status_code == 404
    print("[22/25] Delete Inventory Batch & Medicine: OK")

    # 23. Database Persistence Check Across Fresh App Context
    app_reloaded = create_app(config_overrides={
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{test_db_path}',
        'UPLOAD_FOLDER': test_upload_dir,
    })
    try:
        client_reloaded = app_reloaded.test_client()
        res_persisted = client_reloaded.get(f'/api/orders/{order_id}', headers={'Authorization': f'Bearer {user_token}'})
        assert res_persisted.status_code == 200
        assert res_persisted.get_json()['order']['order_status'] == 'Delivered'
        print("[23/25] Database Persistence Across App Reload: OK")

        # 24. Auth Password Security Check (Password Hash Not Returned)
        res_me = client_reloaded.get('/api/auth/me', headers={'Authorization': f'Bearer {user_token}'})
        assert res_me.status_code == 200
        assert 'password' not in res_me.get_json()['user']
        assert 'password_hash' not in res_me.get_json()['user']
        print("[24/25] Auth Response Excludes Password Hash: OK")
    finally:
        with app_reloaded.app_context():
            db.session.remove()
            db.engine.dispose()

    # 25. Production Config Safety Check
    try:
        create_app(config_overrides={
            'FLASK_ENV': 'production',
            'SECRET_KEY': 'medifind_secret_key_default_2026',
            'SQLALCHEMY_DATABASE_URI': f'sqlite:///{test_db_path}',
            'UPLOAD_FOLDER': test_upload_dir,
        })
        assert False, "Production mode must reject insecure default SECRET_KEY"
    except RuntimeError:
        pass
    print("[25/33] Production Secret Validation: OK")

    # 26. Uncertain OCR Cannot Be Verified Without Manual Confirmation
    res_unc = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': (_make_png_bytes("blurry unreadable text"), "unclear_only.png")}, content_type='multipart/form-data')
    assert res_unc.status_code == 201
    unc_id = res_unc.get_json()['prescription']['id']
    res_auto_v = client.post(f'/api/prescriptions/{unc_id}/verify', headers={'Authorization': f'Bearer {admin_token}'}, json={})
    assert res_auto_v.status_code == 400, f"Uncertain prescription must not verify without confirmed medicines: {res_auto_v.data}"
    res_manual_v = client.post(f'/api/prescriptions/{unc_id}/verify', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'confirmed_medicines': [{'name': 'Cetirizine', 'strength': '10mg', 'dosage': '1 tablet', 'frequency': 'Once daily', 'duration': '5 days'}]
    })
    assert res_manual_v.status_code == 200 and res_manual_v.get_json()['prescription']['status'] == 'Verified'
    print("[26/33] Uncertain OCR Verification Guard & Manual Confirmation: OK")

    # 27. Cross-User Isolation on Orders & Prescriptions
    assert client.get(f'/api/orders/{order_id}', headers={'Authorization': f'Bearer {other_token}'}).status_code == 403
    assert client.post(f'/api/orders/{order_id}/pay', headers={'Authorization': f'Bearer {other_token}'}, json={'status': 'Paid'}).status_code == 403
    assert client.post(f'/api/orders/{order_id}/cancel', headers={'Authorization': f'Bearer {other_token}'}).status_code == 403
    assert client.get(f'/api/prescriptions/{rx_id}', headers={'Authorization': f'Bearer {other_token}'}).status_code == 403
    res_cross_rx_ord = client.post('/api/orders', headers={'Authorization': f'Bearer {other_token}'}, json={
        'pharmacy': amx_pharma,
        'items': [{'inventory_id': amx_inv_id, 'quantity': 1}],
        'prescription_id': rx_id,
        'delivery_address': 'Other User Address'
    })
    assert res_cross_rx_ord.status_code == 400
    print("[27/33] Cross-User Order & Prescription Isolation (403/400): OK")

    # 28. Duplicate Payment Does Not Double-Deduct Stock & Delivered Status Immutable
    with app.app_context():
        qty_before = db.session.get(Inventory, amx_inv_id).quantity
    res_dup_ord = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': amx_pharma,
        'items': [{'inventory_id': amx_inv_id, 'quantity': 1}],
        'delivery_address': 'Duplicate Pay Test Address'
    })
    assert res_dup_ord.status_code == 201
    dup_ord_id = res_dup_ord.get_json()['order']['id']
    assert client.post(f'/api/orders/{dup_ord_id}/pay', headers={'Authorization': f'Bearer {user_token}'}, json={'status': 'Paid'}).status_code == 200
    assert client.post(f'/api/orders/{dup_ord_id}/pay', headers={'Authorization': f'Bearer {user_token}'}, json={'status': 'Paid'}).status_code == 200
    with app.app_context():
        assert db.session.get(Inventory, amx_inv_id).quantity == qty_before - 1
    assert client.put(f'/api/orders/{order_id}/status', headers={'Authorization': f'Bearer {admin_token}'}, json={'status': 'Cancelled'}).status_code == 400
    print("[28/33] Duplicate Payment Idempotency & Delivered Status Lock: OK")

    # 29. Upload Edge Cases (Empty File, Disallowed Extension, Oversized > 10 MB)
    assert client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': (io.BytesIO(b""), "empty.png")}, content_type='multipart/form-data').status_code == 400
    assert client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': (io.BytesIO(b"<svg></svg>"), "xss.svg")}, content_type='multipart/form-data').status_code == 400
    oversized = io.BytesIO(b'x' * (10 * 1024 * 1024 + 100))
    res_big = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={'file': (oversized, "huge.png")}, content_type='multipart/form-data')
    assert res_big.status_code in (400, 413)
    print("[29/33] Upload Size, Empty File & Extension Security Validation: OK")

    # 30. OCR Extended Dosage, Strength & Frequency Extraction
    res_ocr_ext = client.post('/api/prescriptions/upload', headers={'Authorization': f'Bearer {user_token}'}, data={
        'file': (_make_png_bytes("Paracetamol Tab 650mg 2 tablets BD 5 days"), "extended_rx.png")
    }, content_type='multipart/form-data')
    assert res_ocr_ext.status_code == 201
    ext_med = res_ocr_ext.get_json()['prescription']['medicines'][0]
    assert ext_med['name'] == 'Paracetamol'
    assert ext_med['strength'] == '650mg'
    assert ext_med['dosage'] == '2 tablets'
    assert ext_med['frequency'] == 'Twice daily after meals'
    assert ext_med['duration'] == '5 days'
    print("[30/33] OCR Dosage, Form-Separated Strength & Frequency Extraction: OK")

    # 31. JSON Error Handlers (400 Malformed JSON & 405 Method Not Allowed)
    res_bad_json = client.post('/api/auth/login', data="{bad json", content_type='application/json')
    assert res_bad_json.status_code == 400 and 'error' in res_bad_json.get_json()
    res_405 = client.delete('/api/health')
    assert res_405.status_code == 405 and 'error' in res_405.get_json()
    print("[31/33] JSON 400 & 405 Error Handlers: OK")

    # 32. Password Hash Verification in DB
    from models.user import User
    with app.app_context():
        u = User.query.filter_by(email=test_user_email).first()
        assert u is not None and u.password_hash != 'password123' and u.check_password('password123')
    print("[32/33] Password Hashing Verification: OK")

    # 33. Logout Endpoint
    res_logout = client.post('/api/auth/logout', headers={'Authorization': f'Bearer {user_token}'})
    assert res_logout.status_code == 200
    print("[33/33] Auth Logout Endpoint: OK")

    print("\n" + "=" * 70)
    print("ALL 33 MEDIFIND AI BACKEND TESTS PASSED SUCCESSFULLY!")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    run_tests()
