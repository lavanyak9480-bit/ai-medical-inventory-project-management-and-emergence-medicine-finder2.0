import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { useApp } from '../../context/AppContext';

export function UserLayout({ children }) {
  const { apiError, setApiError } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
      </main>
      <Footer />
    </div>
  );
}
