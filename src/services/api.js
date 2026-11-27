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
  const headers = { ...(options.headers || {}) };

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, { ...options, headers, body });
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

  register: async (userData) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: userData
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  getMe: async () => {
    return await request('/auth/me');
  },

  logout: async () => {
    try {
      if (getAuthToken()) {
        await request('/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore network/token errors on logout
    } finally {
      setAuthToken(null);
    }
  }
};

export const userAPI = {
  getProfile: async () => {
    return await request('/users/profile');
  },

  updateProfile: async (profileData) => {
    return await request('/users/profile', {
      method: 'PUT',
      body: profileData
    });
  }
};

// ============================================================================
// 2. PHARMACY & MEDICINE APIS (CRUD & MULTI-PHARMACY COMPARISON)
// ============================================================================

export const pharmacyAPI = {
  getAll: async () => {
    return await request('/pharmacies');
  }
};

export const medicineAPI = {
  getAll: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await request(`/medicines${query}`);
  },

  getById: async (id) => {
    return await request(`/medicines/${id}`);
  },

  compare: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await request(`/medicines/compare${query}`);
  },

  create: async (medicineData) => {
    return await request('/medicines', {
      method: 'POST',
      body: medicineData
    });
  },

  update: async (id, medicineData) => {
    return await request(`/medicines/${id}`, {
      method: 'PUT',
      body: medicineData
    });
  },

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
  getAll: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await request(`/inventory${query}`);
  },

  getPharmacyA: async () => {
    return await request('/inventory/pharmacy-a');
  },

  getPharmacyB: async () => {
    return await request('/inventory/pharmacy-b');
  },

  updateBatch: async (inventoryId, batchData) => {
    return await request(`/inventory/${inventoryId}`, {
      method: 'PUT',
      body: batchData
    });
  },

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
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await request('/prescriptions/upload', {
      method: 'POST',
      body: formData
    });
  },

  getMyPrescriptions: async () => {
    return await request('/prescriptions/my');
  },

  getAll: async () => {
    return await request('/prescriptions/all');
  },

  verify: async (prescriptionId, notes, confirmedMedicines = null) => {
    const body = {};
    if (notes) body.notes = notes;
    if (Array.isArray(confirmedMedicines) && confirmedMedicines.length > 0) {
      body.confirmed_medicines = confirmedMedicines;
    }
    return await request(`/prescriptions/${prescriptionId}/verify`, {
      method: 'POST',
      body
    });
  },

  reject: async (prescriptionId, reason) => {
    return await request(`/prescriptions/${prescriptionId}/reject`, {
      method: 'POST',
      body: { reason }
    });
  },

  getFileUrl: (filename) => {
    if (!filename) return null;
    return `${API_BASE_URL}/prescriptions/file/${encodeURIComponent(filename)}`;
  },

  fetchFileBlob: async (filename) => {
    if (!filename) return null;
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/prescriptions/file/${encodeURIComponent(filename)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error(`Unable to load prescription file (${res.status})`);
    }
    const blob = await res.blob();
    return {
      blobUrl: URL.createObjectURL(blob),
      contentType: blob.type || ''
    };
  }
};

// ============================================================================
// 5. ORDER & PAYMENT APIS (PHONEPE SIMULATION)
// ============================================================================

export const orderAPI = {
  create: async (orderPayload) => {
    return await request('/orders', {
      method: 'POST',
      body: orderPayload
    });
  },

  getMyOrders: async () => {
    return await request('/orders/my');
  },

  getAll: async () => {
    return await request('/orders/all');
  },

  simulatePayment: async (orderId, status = 'Paid') => {
    return await request(`/orders/${orderId}/pay`, {
      method: 'POST',
      body: { status }
    });
  },

  cancel: async (orderId) => {
    return await request(`/orders/${orderId}/cancel`, {
      method: 'POST'
    });
  },

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
  getDashboard: async () => {
    return await request('/admin/dashboard');
  },

  getUsers: async () => {
    return await request('/admin/users');
  },

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
  user: userAPI,
  pharmacy: pharmacyAPI,
  medicine: medicineAPI,
  inventory: inventoryAPI,
  prescription: prescriptionAPI,
  order: orderAPI,
  admin: adminAPI
};
