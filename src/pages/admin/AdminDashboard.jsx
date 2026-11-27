import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  FileCheck,
  AlertTriangle,
  Clock,
  PlusCircle,
  Building2,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { AddMedicineModal } from '../../components/admin/AddMedicineModal';
import { formatCurrency, formatDate, isExpired, isNearExpiry } from '../../utils/dateUtils';

export function AdminDashboard() {
  const {
    medicines,
    pharmacyAInventory,
    pharmacyBInventory,
    prescriptions,
    orders,
    adminDashboard
  } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Compute the exact 4 required statistics from backend /api/admin/dashboard (with fallback):
  const totalMedicinesCount = adminDashboard?.metrics?.total_medicines ?? medicines.length;
  const pendingRxCount = adminDashboard?.metrics?.pending_prescriptions ?? prescriptions.filter(p => p.status === 'Pending Verification').length;
  const lowStockCount = adminDashboard?.metrics?.low_stock ?? medicines.filter(m => m.quantity !== null && m.quantity !== undefined && m.quantity < 20).length;
  const nearExpiryCount = adminDashboard?.metrics?.near_expiry ?? medicines.filter(m => isNearExpiry(m.expiryDate) && !isExpired(m.expiryDate)).length;

  const pharmaACount = adminDashboard?.pharmacies?.pharmacy_a_total ?? pharmacyAInventory.length;
  const pharmaBCount = adminDashboard?.pharmacies?.pharmacy_b_total ?? pharmacyBInventory.length;

  // Recent Orders (last 5)
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Main Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized inventory control & prescription verification for Pharmacy A & Pharmacy B.
          </p>
        </div>

        {/* Add Medicine Button */}
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Exactly Four Summary Cards Required */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Medicines */}
        <StatCard
          title="Total Medicines"
          value={totalMedicinesCount}
          icon={Pill}
          description="Across Pharmacy A & B catalogs"
          color="mint"
        />

        {/* Card 2: Pending Prescriptions */}
        <StatCard
          title="Pending Prescriptions"
          value={pendingRxCount}
          icon={FileCheck}
          description="Awaiting manual pharmacist review"
          color="amber"
        />

        {/* Card 3: Low Stock */}
        <StatCard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          description="Batches with fewer than 20 units"
          color="rose"
        />

        {/* Card 4: Near Expiry */}
        <StatCard
          title="Near Expiry"
          value={nearExpiryCount}
          icon={Clock}
          description="Expiring in next 90 days"
          color="blue"
        />
      </div>

      {/* Pharmacy A & Pharmacy B Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/pharmacy-a"
          className="p-5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-base">Pharmacy A Inventory</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Branch A
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {pharmaACount} cataloged medicines & batches
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/pharmacy-b"
          className="p-5 rounded-2xl bg-white border border-sky-200 hover:border-sky-400 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-base">Pharmacy B Inventory</span>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                  Branch B
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {pharmaBCount} cataloged medicines & batches
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-sky-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-sm">Recent Orders</h2>
          </div>
          <Link to="/admin/orders" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Pharmacy</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{ord.id}</td>
                  <td className="px-4 py-3 text-slate-700">{ord.userName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ord.pharmacy}>{ord.pharmacy}</Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(ord.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ord.paymentStatus}>{ord.paymentStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ord.orderStatus}>{ord.orderStatus}</Badge>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
}
