import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Building2,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  LogOut,
  PlusCircle,
  Activity,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AddMedicineModal } from '../admin/AddMedicineModal';

export function AdminLayout({ children }) {
  const { logout, prescriptions, apiError, setApiError } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pendingRxCount = prescriptions.filter(p => p.status === 'Pending Verification').length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Medicines', path: '/admin/medicines', icon: Pill },
    { name: 'Pharmacy A', path: '/admin/pharmacy-a', icon: Building2 },
    { name: 'Pharmacy B', path: '/admin/pharmacy-b', icon: Building2 },
    { name: 'Prescriptions', path: '/admin/prescriptions', icon: FileCheck, badge: pendingRxCount > 0 ? pendingRxCount : null },
    { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Expiry Alerts', path: '/admin/alerts', icon: AlertTriangle },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-base sm:text-lg">MediFind AI</span>
                <span className="hidden sm:inline-block ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                  Main Admin Portal
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Direct Add Medicine Button */}
            <button
              type="button"
              onClick={() => setIsAddMedicineOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 shrink-0">
          <div className="mb-4 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Managing Units</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Pharmacy A</span>
              <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">Pharmacy B</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors mt-4 text-left"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative w-64 bg-white p-4 flex flex-col h-full shadow-2xl z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-800">Admin Navigation</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                        active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {apiError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError('')}
                  className="p-1 text-rose-500 hover:text-rose-700 rounded-lg"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Add Medicine Modal Component */}
      <AddMedicineModal
        isOpen={isAddMedicineOpen}
        onClose={() => setIsAddMedicineOpen(false)}
      />
    </div>
  );
}
