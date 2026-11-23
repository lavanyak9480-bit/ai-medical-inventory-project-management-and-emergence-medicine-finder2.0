import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// Layouts
import { UserLayout } from '../components/layout/UserLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

// User Pages
import { UserDashboard } from '../pages/user/UserDashboard';
import { UploadPrescriptionPage } from '../pages/user/UploadPrescriptionPage';
import { MedicineComparePage } from '../pages/user/MedicineComparePage';
import { CheckoutPage } from '../pages/user/CheckoutPage';
import { PrescriptionsListPage } from '../pages/user/PrescriptionsListPage';
import { MyOrdersPage } from '../pages/user/MyOrdersPage';
import { UserProfilePage } from '../pages/user/UserProfilePage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { MedicinesManagementPage } from '../pages/admin/MedicinesManagementPage';
import { PharmacyAInventoryPage } from '../pages/admin/PharmacyAInventoryPage';
import { PharmacyBInventoryPage } from '../pages/admin/PharmacyBInventoryPage';
import { PrescriptionsManagementPage } from '../pages/admin/PrescriptionsManagementPage';
import { OrdersManagementPage } from '../pages/admin/OrdersManagementPage';
import { ExpiryAlertsPage } from '../pages/admin/ExpiryAlertsPage';

// Protected Route for Regular Users
function ProtectedUserRoute({ children }) {
  const { role } = useApp();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <UserLayout>{children}</UserLayout>;
}

// Protected Route for Main Admin Only
function ProtectedAdminRoute({ children }) {
  const { role } = useApp();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedUserRoute>
            <UserDashboard />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/upload-prescription"
        element={
          <ProtectedUserRoute>
            <UploadPrescriptionPage />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/compare"
        element={
          <ProtectedUserRoute>
            <MedicineComparePage />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedUserRoute>
            <CheckoutPage />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/my-prescriptions"
        element={
          <ProtectedUserRoute>
            <PrescriptionsListPage />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <ProtectedUserRoute>
            <MyOrdersPage />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedUserRoute>
            <UserProfilePage />
          </ProtectedUserRoute>
        }
      />

      {/* Admin Pages (One Main Admin Managing Pharmacy A & B) */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/medicines"
        element={
          <ProtectedAdminRoute>
            <MedicinesManagementPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/pharmacy-a"
        element={
          <ProtectedAdminRoute>
            <PharmacyAInventoryPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/pharmacy-b"
        element={
          <ProtectedAdminRoute>
            <PharmacyBInventoryPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/prescriptions"
        element={
          <ProtectedAdminRoute>
            <PrescriptionsManagementPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedAdminRoute>
            <OrdersManagementPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <ProtectedAdminRoute>
            <ExpiryAlertsPage />
          </ProtectedAdminRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
