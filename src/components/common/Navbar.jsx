import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  UploadCloud,
  FileText,
  ShoppingBag,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Scale
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Navbar() {
  const { currentUser, role, logout, carts } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Total items in cart across both pharmacies
  const totalCartItems = (carts['Pharmacy A']?.length || 0) + (carts['Pharmacy B']?.length || 0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={role === 'admin' ? '/admin' : (role === 'user' ? '/dashboard' : '/')} className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 bg-clip-text text-transparent">
                MediFind AI
              </span>
              <span className="block text-[10px] text-slate-500 font-medium -mt-1 tracking-tight">
                Medical Inventory & OCR Comparison
              </span>
            </div>
          </Link>

          {/* Desktop Navigation for User */}
          {role === 'user' && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/upload-prescription"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/upload-prescription') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                <span>Upload Rx & OCR</span>
              </Link>
              <Link
                to="/compare"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/compare') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Scale className="w-4 h-4 text-sky-600" />
                <span>Compare Pharmacies</span>
              </Link>
              <Link
                to="/my-prescriptions"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/my-prescriptions') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>My Prescriptions</span>
              </Link>
              <Link
                to="/my-orders"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive('/my-orders') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                <span>My Orders</span>
              </Link>
            </div>
          )}

          {/* Right Area: Profile / Cart / Switcher / Login */}
          <div className="hidden md:flex items-center space-x-3">
            {role === 'user' && (
              <>
                <Link
                  to="/checkout"
                  className="relative p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Checkout / Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {totalCartItems}
                    </span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1.5 pl-2.5 pr-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-colors text-slate-700 text-sm font-medium"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}

            {role === 'admin' && (
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Main Admin</span>
                </span>
                <span className="text-xs text-slate-500">
                  Managing: Pharmacy A & B
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-1 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {!role && (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {role === 'user' && totalCartItems > 0 && (
              <Link to="/checkout" className="p-2 text-emerald-600 relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartItems}
                </span>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {role === 'user' && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                to="/upload-prescription"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Upload Prescription & OCR
              </Link>
              <Link
                to="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Compare Pharmacies
              </Link>
              <Link
                to="/my-prescriptions"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                My Prescriptions
              </Link>
              <Link
                to="/my-orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                My Orders
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                Logout
              </button>
            </>
          )}

          {role === 'admin' && (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                Admin Mode Active (Pharmacy A & B)
              </div>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Admin Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50"
              >
                Logout
              </button>
            </div>
          )}

          {!role && (
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
