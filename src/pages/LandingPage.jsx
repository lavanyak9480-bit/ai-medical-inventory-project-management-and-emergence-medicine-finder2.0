import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ScanLine,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function LandingPage() {
  const { role } = useApp();

  const steps = [
    {
      num: "01",
      title: "Register or Login",
      desc: "Create a user account or sign in as Admin to manage Pharmacy A & Pharmacy B.",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    },
    {
      num: "02",
      title: "Upload Prescription",
      desc: "Upload handwritten or printed prescriptions in JPG, PNG, or PDF formats.",
      icon: ScanLine,
      color: "bg-teal-50 text-teal-600 border-teal-200"
    },
    {
      num: "03",
      title: "OCR Extracts Medicines",
      desc: "AI accurately reads medicine name, strength, dosage, frequency, and duration.",
      icon: FileCheck2,
      color: "bg-sky-50 text-sky-600 border-sky-200"
    },
    {
      num: "04",
      title: "Compare Pharmacy A & B",
      desc: "Compare real-time stock and prices across both pharmacies and place separate orders.",
      icon: Building2,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-sky-50/30 text-slate-800">
      {/* Top Banner Navigation */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 bg-clip-text text-transparent">
              MediFind AI
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
              Medical Inventory & Prescription OCR System
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {role ? (
            <Link
              to={role === 'admin' ? '/admin' : '/dashboard'}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
            >
              <span>Go to {role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white/80 rounded-xl transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
          Book your medicine before you step out
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Upload doctor prescriptions, check live availability and prices across Pharmacy A and Pharmacy B, and reserve your medicines before stepping out.
        </p>

        {/* Quick Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2"
          >
            <span>Login to Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-xl shadow-sm transition-all"
          >
            User Account
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Workflow</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">How MediFind AI Works</h3>
            <p className="text-sm text-slate-500 mt-2">
              Simple 4-step pipeline from prescription upload to multi-pharmacy fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-slate-300">{st.num}</span>
                      <div className={`p-2.5 rounded-xl border ${st.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-800">{st.title}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{st.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center text-[11px] font-semibold text-emerald-700">
                    <span>Step {st.num}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="py-8 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>MediFind AI – Clean, simple & user-friendly medical inventory management.</p>
        <p className="mt-1">Pharmacy A & Pharmacy B managed under One Main Admin.</p>
      </footer>
    </div>
  );
}
