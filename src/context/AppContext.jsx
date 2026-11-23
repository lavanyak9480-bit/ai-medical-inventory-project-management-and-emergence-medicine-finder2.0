import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_MEDICINES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_ORDERS,
  DEMO_ADMIN,
  DEMO_USER
} from '../data/mockData';
import { isExpired } from '../utils/dateUtils';

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medifind_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    try {
      const savedRole = localStorage.getItem('medifind_role');
      return savedRole || null;
    } catch {
      return null;
    }
  });

  // 2. Medicines State
  const [medicines, setMedicines] = useState(() => {
    try {
      const saved = localStorage.getItem('medifind_medicines');
      return saved ? JSON.parse(saved) : INITIAL_MEDICINES;
    } catch {
      return INITIAL_MEDICINES;
    }
  });

  // 3. Prescriptions State
  const [prescriptions, setPrescriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('medifind_prescriptions');
      return saved ? JSON.parse(saved) : INITIAL_PRESCRIPTIONS;
    } catch {
      return INITIAL_PRESCRIPTIONS;
    }
  });

  // 4. Orders State
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('medifind_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // 5. Separate Pharmacy Carts: { [pharmacyName]: [ { medicine, quantity } ] }
  const [carts, setCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('medifind_carts');
      return saved ? JSON.parse(saved) : { 'Pharmacy A': [], 'Pharmacy B': [] };
    } catch {
      return { 'Pharmacy A': [], 'Pharmacy B': [] };
    }
  });

  // Persist states
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('medifind_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('medifind_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('medifind_role', role);
    } else {
      localStorage.removeItem('medifind_role');
    }
  }, [role]);

  useEffect(() => {
    localStorage.setItem('medifind_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('medifind_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem('medifind_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('medifind_carts', JSON.stringify(carts));
  }, [carts]);

  // Auth Functions
  const login = (email, password, selectedRole) => {
    if (selectedRole === 'admin') {
      const adminData = {
        ...DEMO_ADMIN,
        email: email || DEMO_ADMIN.email
      };
      setCurrentUser(adminData);
      setRole('admin');
      return { success: true, user: adminData, role: 'admin' };
    } else {
      // User login
      const userData = currentUser && currentUser.email === email ? currentUser : {
        ...DEMO_USER,
        email: email || DEMO_USER.email,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase())
      };
      setCurrentUser(userData);
      setRole('user');
      return { success: true, user: userData, role: 'user' };
    }
  };

  const register = (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      address: userData.address || "123 Green Avenue, Medical District",
      role: 'user'
    };
    setCurrentUser(newUser);
    setRole('user');
    return { success: true, user: newUser };
  };

  const updateProfile = (profileData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...profileData
    }));
  };

  const logout = () => {
    setCurrentUser(null);
    setRole(null);
    localStorage.removeItem('medifind_user');
    localStorage.removeItem('medifind_role');
  };

  // Medicine Management Functions
  const addMedicine = (formData) => {
    const {
      name,
      genericName,
      strength,
      form,
      prescriptionRequired,
      batchNumber,
      quantity,
      price,
      mfgDate,
      expiryDate,
      pharmacySelection // 'Pharmacy A' | 'Pharmacy B' | 'Both Pharmacies'
    } = formData;

    // Validation
    const parsedQty = parseInt(quantity, 10);
    const parsedPrice = parseFloat(price);

    if (!name || !strength || !form || !batchNumber || isNaN(parsedQty) || isNaN(parsedPrice) || !expiryDate) {
      throw new Error("Please fill in all mandatory fields with valid values.");
    }

    if (parsedQty <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }

    if (parsedPrice <= 0) {
      throw new Error("Price must be greater than zero.");
    }

    if (isExpired(expiryDate)) {
      throw new Error("Cannot add expired batches as sellable inventory stock.");
    }

    const newEntries = [];

    if (pharmacySelection === 'Both Pharmacies') {
      newEntries.push({
        id: `med-${Date.now()}-A`,
        name,
        genericName: genericName || '',
        strength,
        form,
        prescriptionRequired: Boolean(prescriptionRequired),
        pharmacy: 'Pharmacy A',
        batchNumber: `${batchNumber}-A`,
        quantity: parsedQty,
        price: parsedPrice,
        mfgDate: mfgDate || '',
        expiryDate
      });
      newEntries.push({
        id: `med-${Date.now()}-B`,
        name,
        genericName: genericName || '',
        strength,
        form,
        prescriptionRequired: Boolean(prescriptionRequired),
        pharmacy: 'Pharmacy B',
        batchNumber: `${batchNumber}-B`,
        quantity: parsedQty,
        price: parsedPrice,
        mfgDate: mfgDate || '',
        expiryDate
      });
    } else {
      newEntries.push({
        id: `med-${Date.now()}`,
        name,
        genericName: genericName || '',
        strength,
        form,
        prescriptionRequired: Boolean(prescriptionRequired),
        pharmacy: pharmacySelection,
        batchNumber,
        quantity: parsedQty,
        price: parsedPrice,
        mfgDate: mfgDate || '',
        expiryDate
      });
    }

    setMedicines(prev => [...prev, ...newEntries]);
    return newEntries;
  };

  const updateMedicine = (id, updatedFields) => {
    // Validate quantity & price if being updated
    if (updatedFields.quantity !== undefined && parseInt(updatedFields.quantity, 10) < 0) {
      throw new Error("Quantity cannot be negative.");
    }
    if (updatedFields.price !== undefined && parseFloat(updatedFields.price) <= 0) {
      throw new Error("Price must be greater than zero.");
    }

    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          ...updatedFields,
          quantity: updatedFields.quantity !== undefined ? parseInt(updatedFields.quantity, 10) : m.quantity,
          price: updatedFields.price !== undefined ? parseFloat(updatedFields.price) : m.price
        };
      }
      return m;
    }));
  };

  const deleteMedicine = (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  // Prescription Management Functions
  const uploadPrescription = (rxData) => {
    const newRx = {
      id: `rx-${Date.now()}`,
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Rahul Verma',
      fileName: rxData.fileName || 'prescription_upload.jpg',
      fileType: rxData.fileType || 'image/jpeg',
      fileSize: rxData.fileSize || '1.2 MB',
      fileUrl: rxData.fileUrl || null,
      uploadedAt: new Date().toISOString(),
      status: 'Pending Verification', // OCR alone never approves
      reviewedBy: null,
      reviewNotes: null,
      medicines: rxData.medicines || []
    };

    setPrescriptions(prev => [newRx, ...prev]);
    return newRx;
  };

  const verifyPrescription = (id, notes = "Verified by Main Admin") => {
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id === id) {
        return {
          ...rx,
          status: 'Verified',
          reviewedBy: currentUser?.name || 'Main Admin',
          reviewNotes: notes
        };
      }
      return rx;
    }));
  };

  const rejectPrescription = (id, reason) => {
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id === id) {
        return {
          ...rx,
          status: 'Rejected',
          reviewedBy: currentUser?.name || 'Main Admin',
          reviewNotes: reason || "Prescription rejected due to incomplete or unclear medicine details."
        };
      }
      return rx;
    }));
  };

  // Cart Functions (Per Pharmacy)
  const addToCart = (pharmacy, medicine, quantity = 1) => {
    if (isExpired(medicine.expiryDate)) {
      throw new Error("Cannot purchase expired medicine batches.");
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
        updatedPharmacyCart = [
          ...currentPharmacyCart,
          { medicine, quantity }
        ];
      }

      return {
        ...prev,
        [pharmacy]: updatedPharmacyCart
      };
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
      if (item && qty > item.medicine.quantity) {
        throw new Error(`Quantity cannot exceed available stock (${item.medicine.quantity}).`);
      }

      return {
        ...prev,
        [pharmacy]: currentCart.map(i => i.medicine.id === medicineId ? { ...i, quantity: qty } : i)
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

  // Order Functions
  const createOrder = ({ pharmacy, items, totalAmount, deliveryAddress, paymentStatus = "Paid", paymentMethod = "PhonePe UPI (Demo)" }) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}${pharmacy === 'Pharmacy A' ? 'A' : 'B'}`;

    const newOrder = {
      id: orderId,
      userId: currentUser?.id || 'usr-1',
      userName: currentUser?.name || 'Rahul Verma',
      userPhone: currentUser?.phone || '+91 98765 43210',
      userAddress: deliveryAddress || currentUser?.address || 'Indiranagar, Bengaluru - 560038',
      pharmacy,
      createdAt: new Date().toISOString(),
      medicines: items.map(item => ({
        name: `${item.medicine.name} ${item.medicine.strength}`,
        medicineId: item.medicine.id,
        quantity: item.quantity,
        price: item.medicine.price,
        subtotal: item.medicine.price * item.quantity
      })),
      totalAmount,
      paymentStatus,
      paymentMethod,
      orderStatus: "Order Placed", // Initial stage
      trackingUpdates: [
        { stage: "Order Placed", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true },
        { stage: "Verification", time: "Pending prescription check", done: false },
        { stage: "Preparing", time: "Pending", done: false },
        { stage: "Dispatched", time: "Pending", done: false },
        { stage: "Delivered", time: "Pending", done: false }
      ]
    };

    // Deduct stock from medicines inventory
    setMedicines(prev => prev.map(med => {
      const purchasedItem = items.find(it => it.medicine.id === med.id);
      if (purchasedItem) {
        return {
          ...med,
          quantity: Math.max(0, med.quantity - purchasedItem.quantity)
        };
      }
      return med;
    }));

    // Clear that pharmacy's cart
    clearCart(pharmacy);

    // Add to orders
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const STAGES = ["Order Placed", "Verification", "Preparing", "Dispatched", "Delivered"];
    const targetIndex = STAGES.indexOf(newStatus);

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updatedTracking = STAGES.map((st, idx) => {
          if (idx <= targetIndex) {
            return {
              stage: st,
              time: idx === targetIndex ? `Updated at ${now}` : "Completed",
              done: true
            };
          } else {
            return {
              stage: st,
              time: "Pending",
              done: false
            };
          }
        });

        return {
          ...order,
          orderStatus: newStatus,
          trackingUpdates: updatedTracking
        };
      }
      return order;
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role,
        login,
        register,
        updateProfile,
        logout,
        medicines,
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
        createOrder,
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
