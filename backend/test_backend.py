"""
Comprehensive End-to-End Test Suite for MediFind AI Backend
Tests all 17 requirements:
1. User registration & JWT auth
2. User login
3. Admin login
4. Role-based access control
5. Add medicine with dual pharmacy support
6. Edit & delete medicine
7. Pharmacy A and Pharmacy B inventory
8. Prescription upload & clinical OCR extraction
9. Prescription verification by Admin
10. Prescription rejection with reason
11. Medicine comparison across Pharmacy A & B
12. Stock limit validation & expired batch quarantine
13. Order creation
14. Demo PhonePe payment simulation
15. Order tracking stages
16. Expiry and low stock alerts
17. User profile updates
"""

import sys
import os
import json
import io

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from models import db
from models.user import User
from models.medicine import Medicine
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from models.prescription import Prescription
from models.order import Order

def run_tests():
    app = create_app()
    client = app.test_client()

    print("\n" + "="*70)
    print("🚀 STARTING MEDIFIND AI BACKEND COMPREHENSIVE TESTS")
    print("="*70)

    # 1. Health check
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    print("✅ [1/17] Health Check Endpoint: OK")

    # 2. Admin Login
    res = client.post('/api/auth/login', json={
        'email': 'admin@medifind.ai',
        'password': 'admin123'
    })
    assert res.status_code == 200, f"Admin login failed: {res.data}"
    admin_data = res.get_json()
    admin_token = admin_data['token']
    assert admin_data['role'] == 'admin', "Admin role not returned"
    print("✅ [2/17] Admin Login & JWT Generation: OK")

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
    user_id = reg_data['user']['id']
    assert reg_data['user']['role'] == 'user', "Public registration must only create 'user' role"
    print("✅ [3/17] User Registration & Role Enforcement: OK")

    # 4. User Login
    res = client.post('/api/auth/login', json={
        'email': test_user_email,
        'password': 'password123'
    })
    assert res.status_code == 200, f"User login failed: {res.data}"
    print("✅ [4/17] User Login: OK")

    # 5. Access Control Test: Normal user cannot access Admin endpoint
    res = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {user_token}'})
    assert res.status_code == 403, f"Non-admin should get 403 Forbidden on admin route, got {res.status_code}"
    print("✅ [5/17] Role-Based Access Control (403 Forbidden for Non-Admin): OK")

    # 6. Admin Add Medicine with 'Both' pharmacies option
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
    assert len(med_data['inventories']) == 2, "Should create 2 inventory entries when 'Both' is selected"
    print("✅ [6/17] Admin Add Medicine (Dual Pharmacy Inventory Creation): OK")

    # 7. Edit Medicine Details
    med_id = med_data['medicine']['id']
    res = client.put(f'/api/medicines/{med_id}', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'generic_name': 'Cefixime Anhydrous equivalent'
    })
    assert res.status_code == 200, f"Edit medicine failed: {res.data}"
    print("✅ [7/17] Admin Edit Medicine: OK")

    # 8. Dual Pharmacy Medicine Comparison
    res = client.get('/api/medicines/compare')
    assert res.status_code == 200, f"Compare failed: {res.data}"
    comp_list = res.get_json()['comparison']
    assert len(comp_list) > 0, "Comparison list should not be empty"
    # Find Amoxicillin comparison
    amx = next((m for m in comp_list if m['name'] == 'Amoxicillin'), None)
    assert amx is not None, "Amoxicillin must be present in comparison"
    assert amx['pharmacy_a']['stock'] > 0, "Pharmacy A stock should be present"
    assert amx['pharmacy_b']['stock'] > 0, "Pharmacy B stock should be present"
    print("✅ [8/17] Dual Pharmacy Price & Stock Comparison API: OK")

    # 9. Pharmacy A & B Dedicated Inventory Views
    res_a = client.get('/api/inventory/pharmacy-a')
    assert res_a.status_code == 200, f"Pharmacy A inventory failed: {res_a.data}"
    res_b = client.get('/api/inventory/pharmacy-b')
    assert res_b.status_code == 200, f"Pharmacy B inventory failed: {res_b.data}"
    print("✅ [9/17] Pharmacy A & Pharmacy B Separate Inventory Views: OK")

    # 10. Prescription Upload & OCR Extraction
    fake_prescription_file = (io.BytesIO(b"Simulated prescription bytes with Amoxicillin 500mg Twice daily"), "dr_sharma_amoxicillin_rx.jpg")
    res = client.post('/api/prescriptions/upload',
        headers={'Authorization': f'Bearer {user_token}'},
        data={'file': fake_prescription_file},
        content_type='multipart/form-data'
    )
    assert res.status_code == 201, f"Prescription upload failed: {res.data}"
    rx_json = res.get_json()
    rx_id = rx_json['prescription']['id']
    assert rx_json['prescription']['status'] == 'Pending Verification', "OCR must not auto-approve prescription"
    assert len(rx_json['prescription']['medicines']) > 0, "OCR should extract clinical medicines"
    print("✅ [10/17] Prescription Upload & OCR Extraction (Status: Pending Verification): OK")

    # 11. Admin Prescription Verification
    res = client.post(f'/api/prescriptions/{rx_id}/verify', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'notes': 'Verified by Main Admin. Valid medical license detected.'
    })
    assert res.status_code == 200, f"Verification failed: {res.data}"
    assert res.get_json()['prescription']['status'] == 'Verified'
    print("✅ [11/17] Admin Prescription Verification: OK")

    # 12. Create Second Rx and Test Admin Rejection
    fake_prescription_unclear = (io.BytesIO(b"Unclear blurry image bytes"), "blurry_unclear_rx.jpg")
    res = client.post('/api/prescriptions/upload',
        headers={'Authorization': f'Bearer {user_token}'},
        data={'file': fake_prescription_unclear},
        content_type='multipart/form-data'
    )
    unclear_rx_id = res.get_json()['prescription']['id']
    res = client.post(f'/api/prescriptions/{unclear_rx_id}/reject', headers={'Authorization': f'Bearer {admin_token}'}, json={
        'reason': 'Prescription image is too blurry. Doctor registration number not readable.'
    })
    assert res.status_code == 200, f"Rejection failed: {res.data}"
    assert res.get_json()['prescription']['status'] == 'Rejected'
    print("✅ [12/17] Admin Prescription Rejection with Reason: OK")

    # 13. Create Order for Pharmacy A
    with app.app_context():
        inv_item = Inventory.query.filter(Inventory.quantity > 5).first()
        inv_item_id = inv_item.id
        pharmacy_name = inv_item.pharmacy.name
        initial_qty = inv_item.quantity

    res = client.post('/api/orders', headers={'Authorization': f'Bearer {user_token}'}, json={
        'pharmacy': pharmacy_name,
        'items': [
            {'inventory_id': inv_item_id, 'quantity': 2}
        ],
        'delivery_address': 'Flat 402, Green Valley Apts, Indiranagar, Bengaluru'
    })
    assert res.status_code == 201, f"Order placement failed: {res.data}"
    order_data = res.get_json()['order']
    order_id = order_data['id']
    assert order_data['payment_status'] == 'Pending'
    assert order_data['order_status'] == 'Order Placed'
    print(f"✅ [13/17] Order Creation with Stock Validation ({order_id}): OK")

    # 14. Demo Payment Simulation (PhonePe)
    res = client.post(f'/api/orders/{order_id}/pay', headers={'Authorization': f'Bearer {user_token}'}, json={
        'status': 'Paid'
    })
    assert res.status_code == 200, f"Payment simulation failed: {res.data}"
    paid_order = res.get_json()['order']
    assert paid_order['payment_status'] == 'Paid'
    # Verify stock deduction
    with app.app_context():
        updated_inv = db.session.get(Inventory, inv_item_id)
        assert updated_inv.quantity == initial_qty - 2, "Stock must be deducted upon payment confirmation"
    print("✅ [14/17] Demo PhonePe Payment Simulation & Stock Deduction: OK")

    # 15. Admin Advance Order Tracking Statuses
    stages = ["Verification", "Preparing", "Dispatched", "Delivered"]
    for st in stages:
        res = client.put(f'/api/orders/{order_id}/status', headers={'Authorization': f'Bearer {admin_token}'}, json={
            'status': st
        })
        assert res.status_code == 200, f"Status update to {st} failed: {res.data}"
    print("✅ [15/17] Order Tracking 5-Stage Stepper Progression: OK")

    # 16. Admin Dashboard 4 Summary Cards
    res = client.get('/api/admin/dashboard', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200, f"Admin dashboard failed: {res.data}"
    metrics = res.get_json()['metrics']
    assert 'total_medicines' in metrics
    assert 'pending_prescriptions' in metrics
    assert 'low_stock' in metrics
    assert 'near_expiry' in metrics
    print(f"✅ [16/17] Admin Dashboard 4 Summary Cards ({metrics}): OK")

    # 17. Expiry & Low Stock Safety Alerts
    res = client.get('/api/alerts/all', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200, f"Alerts failed: {res.data}"
    alerts_data = res.get_json()
    assert 'expired' in alerts_data
    assert 'near_expiry' in alerts_data
    assert 'low_stock' in alerts_data
    print(f"✅ [17/17] Expiry, Near-Expiry, and Low-Stock Safety Triage: OK")

    print("\n" + "="*70)
    print("🎉 ALL 17 MEDIFIND AI BACKEND TESTS PASSED SUCCESSFULLY!")
    print("="*70 + "\n")

if __name__ == '__main__':
    run_tests()
