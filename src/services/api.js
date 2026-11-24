/**
 * MediFind AI - Frontend API Service Client
 * Connects React UI to Flask REST API running at http://localhost:5000/api
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get JWT token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('medifind_jwt') || null;
};

// Helper to set JWT token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('medifind_jwt', token);
  } else {
    localStorage.removeItem('medifind_jwt');
  }
};

// Core request wrapper with automatic Bearer token injection
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = options.headers || {};

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
}

// ============================================================================
// 1. AUTHENTICATION & USER APIS
// ============================================================================

export const authAPI = {
  // Login: returns { token, user: { id, full_name, email, role } }
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  // Register User: role is strictly 'User'
  register: async (userData) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: userData
    });
    return res;
  },

  // Current session details
  getMe: async () => {
    return await request('/auth/me');
  },

  // Logout
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  }
};

// ============================================================================
// 2. MEDICINE APIS (CRUD & MULTI-PHARMACY COMPARISON)
// ============================================================================

export const medicineAPI = {
  // List all medicines
  getAll: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await request(`/medicines${query}`);
  },

  // Get medicine details
  getById: async (id) => {
    return await request(`/medicines/${id}`);
  },

  // Dual-Pharmacy Price & Stock Comparison
  compare: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await request(`/medicines/compare${query}`);
  },

  // Admin: Add medicine (supports pharmacy: 'A', 'B', or 'Both')
  create: async (medicineData) => {
    return await request('/medicines', {
      method: 'POST',
      body: medicineData
    });
  },

  // Admin: Update medicine details
  update: async (id, medicineData) => {
    return await request(`/medicines/${id}`, {
      method: 'PUT',
      body: medicineData
    });
  },

  // Admin: Delete medicine
  delete: async (id) => {
    return await request(`/medicines/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================================================
// 3. INVENTORY MANAGEMENT APIS
// ============================================================================

export const inventoryAPI = {
  // All active batches
  getAll: async () => {
    return await request('/inventory');
  },

  // Pharmacy A Inventory
  getPharmacyA: async () => {
    return await request('/inventory/pharmacy-a');
  },

  // Pharmacy B Inventory
  getPharmacyB: async () => {
    return await request('/inventory/pharmacy-b');
  },

  // Update specific batch (quantity, price, expiry date)
  updateBatch: async (inventoryId, batchData) => {
    return await request(`/inventory/${inventoryId}`, {
      method: 'PUT',
      body: batchData
    });
  },

  // Delete inventory batch
  deleteBatch: async (inventoryId) => {
    return await request(`/inventory/${inventoryId}`, {
      method: 'DELETE'
    });
  }
};

// ============================================================================
// 4. PRESCRIPTION OCR & VERIFICATION APIS
// ============================================================================

export const prescriptionAPI = {
  // Upload prescription file (JPG, PNG, PDF) with Tesseract OCR extraction
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await request('/prescriptions/upload', {
      method: 'POST',
      body: formData
    });
  },

  // User's own prescriptions
  getMyPrescriptions: async () => {
    return await request('/prescriptions/my');
  },

  // Admin: All uploaded prescriptions across users
  getAll: async () => {
    return await request('/prescriptions/all');
  },

  // Admin: Verify prescription
  verify: async (prescriptionId) => {
    return await request(`/prescriptions/${prescriptionId}/verify`, {
      method: 'POST'
    });
  },

  // Admin: Reject prescription with reason
  reject: async (prescriptionId, reason) => {
    return await request(`/prescriptions/${prescriptionId}/reject`, {
      method: 'POST',
      body: { reason }
    });
  },

  // URL for prescription file download/preview
  getFileUrl: (filename) => {
    return `${API_BASE_URL}/prescriptions/file/${filename}`;
  }
};

// ============================================================================
// 5. ORDER & PAYMENT APIS (PHONEPE SIMULATION)
// ============================================================================

export const orderAPI = {
  // Place separate order for Pharmacy A or Pharmacy B
  create: async (orderPayload) => {
    // orderPayload: { pharmacy: 'Pharmacy A', items: [{ inventory_id, quantity }], delivery_address }
    return await request('/orders', {
      method: 'POST',
      body: orderPayload
    });
  },

  // User's own orders
  getMyOrders: async () => {
    return await request('/orders/my');
  },

  // Admin: All orders
  getAll: async () => {
    return await request('/orders/all');
  },

  // Demo PhonePe Payment Simulation (deducts inventory stock once)
  simulatePayment: async (orderId) => {
    return await request(`/orders/${orderId}/pay`, {
      method: 'POST',
      body: { status: 'Paid' }
    });
  },

  // Admin: Update order status (5-stage progression)
  updateStatus: async (orderId, status) => {
    return await request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status }
    });
  }
};

// ============================================================================
// 6. ADMIN DASHBOARD & ALERTS APIS
// ============================================================================

export const adminAPI = {
  // 4 Core Summary Cards
  getDashboard: async () => {
    return await request('/admin/dashboard');
  },

  // Registered users list
  getUsers: async () => {
    return await request('/admin/users');
  },

  // Expiry & stock alerts
  getAlerts: async () => {
    return await request('/alerts/all');
  },

  getExpired: async () => {
    return await request('/alerts/expired');
  },

  getNearExpiry: async () => {
    return await request('/alerts/near-expiry');
  },

  getLowStock: async () => {
    return await request('/alerts/low-stock');
  }
};

export default {
  auth: authAPI,
  medicine: medicineAPI,
  inventory: inventoryAPI,
  prescription: prescriptionAPI,
  order: orderAPI,
  admin: adminAPI
};
