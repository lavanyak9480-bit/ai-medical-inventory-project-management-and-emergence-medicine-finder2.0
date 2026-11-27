import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  ShoppingBag,
  User,
  LogOut,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Scale
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/dateUtils';

export function UserDashboard() {
  const { currentUser, prescriptions, orders, logout } = useApp();
  const navigate = useNavigate();

  // Filter current user's data
  const myPrescriptions = prescriptions.filter(p => !p.userId || p.userId === currentUser?.id);
  const myOrders = orders.filter(o => !o.userId || o.userId === currentUser?.id);

  const pendingRx = myPrescriptions.filter(p => p.status === 'Pending Verification').length;
  const activeOrders = myOrders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length;

  return (
    <div className="space-y-6">
      {/* Welcome Message Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              Patient / Customer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name || 'Rahul Verma'}!
            </h1>
            <p className="text-sm text-emerald-100 max-w-xl">
              Upload doctor prescriptions for instant AI OCR scanning and compare medicine prices across Pharmacy A & Pharmacy B.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/upload-prescription"
              className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-md transition-all flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Upload Prescription</span>
            </Link>
            <Link
              to="/compare"
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-sm backdrop-blur-sm transition-all flex items-center space-x-1.5"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Prices</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 4 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Upload Prescription */}
        <Link
          to="/upload-prescription"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 mt-4 text-base">Upload Prescription</h3>
          <p className="text-xs text-slate-500 mt-1">
            JPG, PNG, or PDF with instant clinical OCR extraction.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600">
            <span>Scan new Rx</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 2. My Prescriptions */}
        <Link
          to="/my-prescriptions"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            {pendingRx > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {pendingRx} Pending
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 mt-4 text-base">My Prescriptions</h3>
          <p className="text-xs text-slate-500 mt-1">
            {myPrescriptions.length} uploaded records with verification status.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-sky-600">
            <span>View prescriptions</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 3. My Orders */}
        <Link
          to="/my-orders"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {activeOrders > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {activeOrders} Active
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 mt-4 text-base">My Orders</h3>
          <p className="text-xs text-slate-500 mt-1">
            Live 5-stage order tracking for Pharmacy A & B orders.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
            <span>Track orders</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 4. Profile */}
        <Link
          to="/profile"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <User className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 mt-4 text-base">User Profile</h3>
          <p className="text-xs text-slate-500 mt-1">
            Update personal info and delivery address for dispatch.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-teal-600">
            <span>Edit profile</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Recent Prescriptions & Recent Orders Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-sm">Recent Prescriptions</h2>
            </div>
            <Link to="/my-prescriptions" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {myPrescriptions.slice(0, 3).map((rx) => (
              <div key={rx.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rx.fileName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uploaded: {formatDate(rx.uploadedAt)} • {rx.medicines?.length || 0} extracted items
                  </p>
                </div>
                <div>
                  <Badge variant={rx.status}>{rx.status}</Badge>
                </div>
              </div>
            ))}
            {myPrescriptions.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No prescriptions uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-sky-600" />
              <h2 className="font-bold text-slate-800 text-sm">Recent Orders</h2>
            </div>
            <Link to="/my-orders" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {myOrders.slice(0, 3).map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">{ord.id}</span>
                    <Badge variant={ord.pharmacy}>{ord.pharmacy}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatCurrency(ord.totalAmount)} • {ord.medicines?.length || 0} items • Status: {ord.orderStatus}
                  </p>
                </div>
                <div>
                  <Badge variant={ord.orderStatus}>{ord.orderStatus}</Badge>
                </div>
              </div>
            ))}
            {myOrders.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No orders placed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
