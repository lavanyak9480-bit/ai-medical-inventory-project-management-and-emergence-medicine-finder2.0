import React from 'react';
import { Activity, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">MediFind AI</p>
              <p className="text-xs text-slate-500">AI-Based Medical Inventory Management with Prescription OCR</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Multi-Pharmacy Verification (Pharmacy A & B)
            </span>
            <span>•</span>
            <span>Demo Prototype</span>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MediFind AI. Clean & modern medical inventory management.
          </p>
        </div>
      </div>
    </footer>
  );
}
