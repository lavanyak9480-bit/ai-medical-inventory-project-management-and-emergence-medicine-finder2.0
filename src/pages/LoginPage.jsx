import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, User, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();

  // Exactly two login roles: 'admin' and 'user'
  const [activeRole, setActiveRole] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password, activeRole);
      if (result.success) {
        if (result.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setActiveRole('admin');
    setEmail('admin@medifind.ai');
    setPassword('admin123');
    setError('');
  };

  const handleFillDemoUser = () => {
    setActiveRole('user');
    setEmail('rahul.verma@example.com');
    setPassword('user123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-sky-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-slate-800">MediFind AI</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Medical Inventory & Multi-Pharmacy System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 rounded-3xl">
          {/* Exactly Two Roles: User vs Admin Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveRole('user');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeRole === 'user'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('admin');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeRole === 'admin'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Main Admin Login</span>
            </button>
          </div>

          {/* Quick Demo Pre-fill Pill */}
          <div className="mb-5 text-center">
            {activeRole === 'admin' ? (
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>⚡ Fill Demo Admin (Manages Pharmacy A & B)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFillDemoUser}
                className="w-full py-1.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium rounded-lg border border-sky-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>⚡ Fill Demo User Credentials</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeRole === 'admin' ? 'admin@medifind.ai' : 'user@example.com'}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Signing in...' : `Sign in as ${activeRole === 'admin' ? 'Main Admin' : 'User'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* User Registration Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {activeRole === 'user' ? (
              <p className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                  Register here
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Main Admin login is restricted to authorized credentials only.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
