import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authAPI,
  userAPI,
  medicineAPI,
  inventoryAPI,
  prescriptionAPI,
  orderAPI,
  adminAPI,
  getAuthToken,
  setAuthToken
} from '../services/api';
import { isExpired } from '../utils/dateUtils';

const AppContext = createContext();

// Normalizers to align backend snake_case JSON with existing React component props
function normalizeUser(u) {
  if (!u) return null;
  return {
    ...u,
    name: u.full_name || u.name || '',
    fullName: u.full_name || u.name || ''
  };
}

function normalizeInventoryItem(item) {
  if (!item) return null;
  return {
    id: item.id,
    inventoryId: item.id,
    medicineId: item.medicine_id,
    name: item.medicine_name || item.name || '',
    genericName: item.generic_name || '',
    category: item.category || '',
    strength: item.strength || null,
    form: item.form || '',
    indication: item.indication || '',
    prescriptionStatus: item.prescription_status || '',
    prescriptionRequired: Boolean(item.prescription_required),
    imageUrl: item.image_url || '',
    pharmacy: item.pharmacy_name || '',
    pharmacyId: item.pharmacy_id,
    catalogItemNo: item.catalog_item_no || null,
    batchNumber: item.batch_number || null,
    quantity: item.quantity !== undefined ? item.quantity : null,
    price: item.price !== undefined && item.price !== null ? Number(item.price) : null,
    mfgDate: item.mfg_date || null,
    expiryDate: item.expiry_date || null,
    dataSource: item.data_source || '',
    missingFields: item.missing_fields || [],
    isOrderable: Boolean(item.is_orderable),
    isExpired: Boolean(item.is_expired),
    isNearExpiry: Boolean(item.is_near_expiry),
    isLowStock: Boolean(item.is_low_stock)
  };
}

function normalizePrescription(rx) {
  if (!rx) return null;
  return {
    id: rx.id,
    userId: rx.user_id,
    userName: rx.user_name || 'Patient',
    fileName: rx.file_name,
    filePath: rx.file_path || null,
    fileType: rx.file_type,
    fileSize: rx.file_size,
    fileUrl: rx.file_path ? prescriptionAPI.getFileUrl(rx.file_path) : null,
    uploadedAt: rx.created_at,
    status: rx.status,
    reviewedBy: rx.reviewed_by,
    reviewNotes: rx.rejection_reason || null,
    medicines: (rx.medicines || []).map(m => ({
      id: m.id,
      name: m.name || m.medicine_name,
      strength: m.strength,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      confidence: m.confidence
    }))
  };
}

function normalizeOrder(ord) {
  if (!ord) return null;
  return {
    id: ord.id,
    userId: ord.user_id,
    userName: ord.user_name || 'Patient',
    userPhone: ord.user_phone || '',
    userAddress: ord.user_address || '',
    pharmacy: ord.pharmacy_name || '',
    createdAt: ord.created_at,
    medicines: (ord.items || []).map(it => ({
      id: it.id,
      inventoryId: it.inventory_id,
      name: it.name || `${it.medicine_name} ${it.strength || ''}`.trim(),
      medicineName: it.medicine_name || it.name || '',
      strength: it.strength || '',
      form: it.form || '',
      imageUrl: it.image_url || '',
      quantity: it.quantity,
      price: Number(it.unit_price ?? it.price ?? 0),
      subtotal: Number(it.subtotal ?? 0)
    })),
    totalAmount: Number(ord.total_amount ?? 0),
    paymentStatus: ord.payment_status,
    paymentMethod: ord.payment_method,
    orderStatus: ord.order_status,
    trackingUpdates: ord.tracking_updates || []
  };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Database-backed state
  const [pharmacyAInventory, setPharmacyAInventory] = useState([]);
  const [pharmacyBInventory, setPharmacyBInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [comparisonList, setComparisonList] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [alertsData, setAlertsData] = useState({ expired: [], near_expiry: [], low_stock: [], counts: {} });

  // Separate Pharmacy Carts persisted locally until checkout
  const [carts, setCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('medifind_carts');
      return saved ? JSON.parse(saved) : { 'Pharmacy A': [], 'Pharmacy B': [] };
    } catch {
      return { 'Pharmacy A': [], 'Pharmacy B': [] };
    }
  });

  useEffect(() => {
    localStorage.setItem('medifind_carts', JSON.stringify(carts));
  }, [carts]);

  // Fetch Pharmacy A & Pharmacy B separately from backend
  const fetchPharmacyAInventory = useCallback(async () => {
    const res = await inventoryAPI.getPharmacyA();
    const normalized = (res.inventory || []).map(normalizeInventoryItem);
    setPharmacyAInventory(normalized);
    return normalized;
  }, []);

  const fetchPharmacyBInventory = useCallback(async () => {
    const res = await inventoryAPI.getPharmacyB();
    const normalized = (res.inventory || []).map(normalizeInventoryItem);
    setPharmacyBInventory(normalized);
    return normalized;
  }, []);

  const fetchInventories = useCallback(async () => {
    const [aList, bList] = await Promise.all([
      fetchPharmacyAInventory(),
      fetchPharmacyBInventory()
    ]);
    setMedicines([...aList, ...bList]);
  }, [fetchPharmacyAInventory, fetchPharmacyBInventory]);

  const fetchComparison = useCallback(async (search = '') => {
    const res = await medicineAPI.compare(search);
    setComparisonList(res.comparison || []);
    return res.comparison || [];
  }, []);

  const fetchRoleScopedData = useCallback(async (activeRole) => {
    if (!activeRole) {
      setPrescriptions([]);
      setOrders([]);
      setAdminDashboard(null);
      setAlertsData({ expired: [], near_expiry: [], low_stock: [], counts: {} });
      return;
    }

    if (activeRole === 'admin') {
      const [rxRes, ordRes, dashRes, alertRes] = await Promise.all([
        prescriptionAPI.getAll(),
        orderAPI.getAll(),
        adminAPI.getDashboard(),
        adminAPI.getAlerts()
      ]);
      setPrescriptions((rxRes.prescriptions || []).map(normalizePrescription));
      setOrders((ordRes.orders || []).map(normalizeOrder));
      setAdminDashboard(dashRes);
      setAlertsData({
        expired: (alertRes.expired || []).map(normalizeInventoryItem),
        near_expiry: (alertRes.near_expiry || []).map(normalizeInventoryItem),
        low_stock: (alertRes.low_stock || []).map(normalizeInventoryItem),
        counts: alertRes.counts || {}
      });
    } else {
      const [rxRes, ordRes] = await Promise.all([
        prescriptionAPI.getMyPrescriptions(),
        orderAPI.getMyOrders()
      ]);
      setPrescriptions((rxRes.prescriptions || []).map(normalizePrescription));
      setOrders((ordRes.orders || []).map(normalizeOrder));
    }
  }, []);

  const refreshAllData = useCallback(async (activeRole = role) => {
    setDataLoading(true);
    setApiError('');
    try {
      await Promise.all([
        fetchInventories(),
        fetchComparison(),
        fetchRoleScopedData(activeRole)
      ]);
    } catch (err) {
      setApiError(err.message || 'Failed to sync with backend API.');
    } finally {
      setDataLoading(false);
    }
  }, [role, fetchInventories, fetchComparison, fetchRoleScopedData]);

  // Restore session from JWT on initial mount & load catalog data
  useEffect(() => {
    let cancelled = false;
    async function initApp() {
      setAuthLoading(true);
      try {
        const token = getAuthToken();
        let activeRole = null;
        if (token) {
          try {
            const meRes = await authAPI.getMe();
            if (!cancelled && meRes.user) {
              setCurrentUser(normalizeUser(meRes.user));
              setRole(meRes.role || meRes.user.role);
              activeRole = meRes.role || meRes.user.role;
            }
          } catch {
            setAuthToken(null);
            if (!cancelled) {
              setCurrentUser(null);
              setRole(null);
            }
          }
        }
        if (!cancelled) {
          await refreshAllData(activeRole);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    initApp();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth Functions
  const login = async (email, password, selectedRole) => {
    const res = await authAPI.login(email, password);
    const actualRole = res.role || res.user?.role;

    if (selectedRole && actualRole !== selectedRole) {
      await authAPI.logout();
      setCurrentUser(null);
      setRole(null);
      if (selectedRole === 'admin') {
        throw new Error('Access denied. This account does not have Main Admin privileges.');
      } else {
        throw new Error('Please use the Main Admin Login tab for administrator accounts.');
      }
    }

    const user = normalizeUser(res.user);
    setCurrentUser(user);
    setRole(actualRole);
    await refreshAllData(actualRole);
    return { success: true, user, role: actualRole };
  };

  const register = async (userData) => {
    const res = await authAPI.register({
      full_name: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      address: userData.address || ''
    });
    const user = normalizeUser(res.user);
    setCurrentUser(user);
    setRole('user');
    await refreshAllData('user');
    return { success: true, user };
  };

  const updateProfile = async (profileData) => {
    const res = await userAPI.updateProfile({
      full_name: profileData.name || profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address
    });
    const updated = normalizeUser(res.user);
    setCurrentUser(updated);
    return updated;
  };

  const logout = async () => {
    await authAPI.logout();
    setCurrentUser(null);
    setRole(null);
    setPrescriptions([]);
    setOrders([]);
    setAdminDashboard(null);
    setAlertsData({ expired: [], near_expiry: [], low_stock: [], counts: {} });
    setCarts({ 'Pharmacy A': [], 'Pharmacy B': [] });
    localStorage.removeItem('medifind_carts');
  };

  // Medicine & Inventory Management Functions
  const addMedicine = async (formData) => {
    const payload = {
      name: formData.name,
      generic_name: formData.genericName || '',
      strength: formData.strength,
      form: formData.form,
      prescription_required: Boolean(formData.prescriptionRequired),
      batch_number: formData.batchNumber,
      quantity: parseInt(formData.quantity, 10),
      price: parseFloat(formData.price),
      mfg_date: formData.mfgDate || null,
      expiry_date: formData.expiryDate,
      pharmacy: formData.pharmacySelection || 'Both Pharmacies'
    };

    const res = await medicineAPI.create(payload);
    await refreshAllData(role);
    return (res.inventories || []).map(normalizeInventoryItem);
  };

  const updateMedicine = async (inventoryId, updatedFields) => {
    const payload = {};
    if (updatedFields.name !== undefined) payload.name = updatedFields.name;
    if (updatedFields.genericName !== undefined) payload.generic_name = updatedFields.genericName;
    if (updatedFields.strength !== undefined) payload.strength = updatedFields.strength;
    if (updatedFields.form !== undefined) payload.form = updatedFields.form;
    if (updatedFields.batchNumber !== undefined) payload.batch_number = updatedFields.batchNumber;
    if (updatedFields.quantity !== undefined && updatedFields.quantity !== '') payload.quantity = parseInt(updatedFields.quantity, 10);
    if (updatedFields.price !== undefined && updatedFields.price !== '') payload.price = parseFloat(updatedFields.price);
    if (updatedFields.expiryDate !== undefined) payload.expiry_date = updatedFields.expiryDate;
    if (updatedFields.prescriptionRequired !== undefined) payload.prescription_required = Boolean(updatedFields.prescriptionRequired);

    await inventoryAPI.updateBatch(inventoryId, payload);
    await refreshAllData(role);
  };

  const deleteMedicine = async (inventoryId) => {
    await inventoryAPI.deleteBatch(inventoryId);
    await refreshAllData(role);
  };

  // Prescription Management Functions
  const uploadPrescription = async (file) => {
    const res = await prescriptionAPI.upload(file);
    const normalized = normalizePrescription(res.prescription);
    await fetchRoleScopedData(role);
    return normalized;
  };

  const verifyPrescription = async (id, notes = 'Verified by Main Admin', confirmedMedicines = null) => {
    await prescriptionAPI.verify(id, notes, confirmedMedicines);
    await fetchRoleScopedData(role);
  };

  const rejectPrescription = async (id, reason) => {
    await prescriptionAPI.reject(id, reason);
    await fetchRoleScopedData(role);
  };

  // Cart Functions (Per Pharmacy)
  const addToCart = (pharmacy, medicine, quantity = 1) => {
    if (isExpired(medicine.expiryDate)) {
      throw new Error('Cannot purchase expired medicine batches.');
    }
    if (medicine.quantity === null || medicine.quantity === undefined || medicine.quantity <= 0) {
      throw new Error('This medicine does not have available stock.');
    }
    if (medicine.price === null || medicine.price === undefined) {
      throw new Error('Price is missing for this medicine.');
    }
    if (quantity > medicine.quantity) {
      throw new Error(`Requested quantity exceeds available stock (${medicine.quantity}).`);
    }

    setCarts(prev => {
      const currentPharmacyCart = prev[pharmacy] || [];
      const existingIndex = currentPharmacyCart.findIndex(item => item.medicine.id === medicine.id);

      let updatedPharmacyCart;
      if (existingIndex > -1) {
        const newQty = currentPharmacyCart[existingIndex].quantity + quantity;
        if (newQty > medicine.quantity) {
          throw new Error(`Total in cart cannot exceed available stock (${medicine.quantity}).`);
        }
        updatedPharmacyCart = [...currentPharmacyCart];
        updatedPharmacyCart[existingIndex] = {
          ...updatedPharmacyCart[existingIndex],
          quantity: newQty
        };
      } else {
        updatedPharmacyCart = [...currentPharmacyCart, { medicine, quantity }];
      }

      return { ...prev, [pharmacy]: updatedPharmacyCart };
    });
  };

  const updateCartQuantity = (pharmacy, medicineId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(pharmacy, medicineId);
      return;
    }

    setCarts(prev => {
      const currentCart = prev[pharmacy] || [];
      const item = currentCart.find(i => i.medicine.id === medicineId);
      if (item && item.medicine.quantity !== null && qty > item.medicine.quantity) {
        throw new Error(`Quantity cannot exceed available stock (${item.medicine.quantity}).`);
      }
      return {
        ...prev,
        [pharmacy]: currentCart.map(i => (i.medicine.id === medicineId ? { ...i, quantity: qty } : i))
      };
    });
  };

  const removeFromCart = (pharmacy, medicineId) => {
    setCarts(prev => ({
      ...prev,
      [pharmacy]: (prev[pharmacy] || []).filter(item => item.medicine.id !== medicineId)
    }));
  };

  const clearCart = (pharmacy) => {
    if (pharmacy) {
      setCarts(prev => ({ ...prev, [pharmacy]: [] }));
    } else {
      setCarts({ 'Pharmacy A': [], 'Pharmacy B': [] });
    }
  };

  // Order & Demo Payment Functions
  const placeOrder = async ({ pharmacy, items, deliveryAddress }) => {
    const res = await orderAPI.create({
      pharmacy,
      items: items.map(it => ({
        inventory_id: it.medicine.inventoryId || it.medicine.id,
        medicine_id: it.medicine.medicineId,
        name: it.medicine.name,
        quantity: it.quantity
      })),
      delivery_address: deliveryAddress || currentUser?.address,
      payment_method: 'PhonePe UPI (Demo)'
    });
    const created = normalizeOrder(res.order);
    await fetchRoleScopedData(role);
    return created;
  };

  const completeDemoPayment = async (orderId, pharmacy) => {
    const res = await orderAPI.simulatePayment(orderId, 'Paid');
    if (pharmacy) {
      clearCart(pharmacy);
    }
    await refreshAllData(role);
    return normalizeOrder(res.order);
  };

  const failDemoPayment = async (orderId) => {
    const res = await orderAPI.simulatePayment(orderId, 'Failed');
    await fetchRoleScopedData(role);
    return normalizeOrder(res.order);
  };

  const cancelDemoPayment = async (orderId) => {
    const res = await orderAPI.simulatePayment(orderId, 'Cancelled');
    await fetchRoleScopedData(role);
    return normalizeOrder(res.order);
  };

  const cancelOrder = async (orderId) => {
    const res = await orderAPI.cancel(orderId);
    await refreshAllData(role);
    return normalizeOrder(res.order);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await orderAPI.updateStatus(orderId, newStatus);
    await refreshAllData(role);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role,
        authLoading,
        dataLoading,
        apiError,
        setApiError,
        login,
        register,
        updateProfile,
        logout,
        medicines,
        pharmacyAInventory,
        pharmacyBInventory,
        comparisonList,
        adminDashboard,
        alertsData,
        fetchPharmacyAInventory,
        fetchPharmacyBInventory,
        fetchComparison,
        refreshAllData,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        prescriptions,
        uploadPrescription,
        verifyPrescription,
        rejectPrescription,
        carts,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        orders,
        placeOrder,
        completeDemoPayment,
        failDemoPayment,
        cancelDemoPayment,
        cancelOrder,
        updateOrderStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
