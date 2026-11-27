import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Smartphone, XCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';

export function PhonePeModal({ isOpen, onClose, amount, pharmacy, onPaymentSuccess, onPaymentFail }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successView, setSuccessView] = useState(false);
  const [failedView, setFailedView] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setSuccessView(false);
      setFailedView(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateSuccess = () => {
    setIsProcessing(true);
    setFailedView(false);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessView(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 1000);
  };

  const handleSimulateFailure = () => {
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        if (onPaymentFail) {
          await onPaymentFail();
        }
      } finally {
        setIsProcessing(false);
        setFailedView(true);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100"
      >
        {/* PhonePe Purple Header */}
        <div className="bg-[#5f259f] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
              पे
            </div>
            <div>
              <div className="font-bold text-base tracking-wide flex items-center gap-1.5">
                PhonePe
                <span className="text-[10px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold border border-purple-400/30">
                  Demo Payment
                </span>
              </div>
              <p className="text-xs text-purple-200">Instant UPI Payment</p>
            </div>
          </div>
          <span className="text-xs bg-purple-400/20 text-purple-100 px-2.5 py-1 rounded-full border border-purple-300/30">
            {pharmacy}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successView ? (
            <div className="py-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-800">Demo Payment Successful!</h3>
              <p className="text-sm text-slate-500">
                Amount: <span className="font-semibold text-slate-700">{formatCurrency(amount)}</span>
              </p>
              <p className="text-xs text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block font-medium">
                Status: Paid • Updating Order Details...
              </p>
            </div>
          ) : failedView ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Demo Payment Failed</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Simulated UPI transaction was declined. No stock was deducted and no real payment was attempted.
              </p>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailedView(false)}
                  className="w-full py-2.5 px-4 bg-[#5f259f] hover:bg-[#4d1e82] text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Demo Payment</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-4 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-xs"
                >
                  Cancel Order & Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-center">
              {/* Order Amount display */}
              <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-100">
                <span className="text-xs text-purple-700 font-medium uppercase tracking-wider">Total Payable Amount</span>
                <div className="text-3xl font-extrabold text-[#5f259f] mt-1">
                  {formatCurrency(amount)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Paying to: <span className="font-semibold text-slate-700">MediFind - {pharmacy}</span>
                </div>
              </div>

              {/* Dummy QR Code Container */}
              <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-purple-200 shadow-inner">
                {/* Simulated high-fidelity QR SVG */}
                <svg
                  className="w-48 h-48 mx-auto"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="200" height="200" fill="white" />
                  {/* Top-Left Position Detection Marker */}
                  <rect x="15" y="15" width="45" height="45" rx="6" stroke="#5f259f" strokeWidth="8" />
                  <rect x="27" y="27" width="21" height="21" rx="3" fill="#5f259f" />

                  {/* Top-Right Position Detection Marker */}
                  <rect x="140" y="15" width="45" height="45" rx="6" stroke="#5f259f" strokeWidth="8" />
                  <rect x="152" y="27" width="21" height="21" rx="3" fill="#5f259f" />

                  {/* Bottom-Left Position Detection Marker */}
                  <rect x="15" y="140" width="45" height="45" rx="6" stroke="#5f259f" strokeWidth="8" />
                  <rect x="27" y="152" width="21" height="21" rx="3" fill="#5f259f" />

                  {/* Dummy data matrix blocks */}
                  <rect x="75" y="20" width="12" height="12" fill="#334155" />
                  <rect x="95" y="20" width="12" height="12" fill="#5f259f" />
                  <rect x="115" y="20" width="12" height="12" fill="#334155" />
                  
                  <rect x="75" y="40" width="12" height="25" fill="#334155" />
                  <rect x="95" y="40" width="12" height="12" fill="#334155" />
                  <rect x="115" y="45" width="12" height="20" fill="#5f259f" />

                  <rect x="20" y="75" width="12" height="12" fill="#5f259f" />
                  <rect x="40" y="75" width="20" height="12" fill="#334155" />
                  <rect x="70" y="75" width="20" height="20" fill="#334155" />
                  <rect x="100" y="75" width="25" height="12" fill="#5f259f" />
                  <rect x="135" y="75" width="15" height="12" fill="#334155" />
                  <rect x="160" y="75" width="20" height="20" fill="#334155" />

                  <rect x="20" y="100" width="25" height="12" fill="#334155" />
                  <rect x="55" y="95" width="12" height="25" fill="#5f259f" />
                  <rect x="75" y="105" width="15" height="15" fill="#334155" />
                  <rect x="100" y="95" width="12" height="25" fill="#334155" />
                  <rect x="120" y="100" width="25" height="15" fill="#5f259f" />
                  <rect x="155" y="105" width="25" height="12" fill="#334155" />

                  <rect x="75" y="135" width="20" height="15" fill="#334155" />
                  <rect x="105" y="130" width="15" height="25" fill="#5f259f" />
                  <rect x="130" y="135" width="25" height="12" fill="#334155" />
                  <rect x="165" y="135" width="15" height="20" fill="#5f259f" />

                  <rect x="75" y="160" width="15" height="20" fill="#5f259f" />
                  <rect x="100" y="165" width="25" height="15" fill="#334155" />
                  <rect x="135" y="160" width="20" height="20" fill="#334155" />
                  <rect x="165" y="165" width="15" height="15" fill="#334155" />

                  {/* Center PhonePe Logo Badge */}
                  <rect x="82" y="82" width="36" height="36" rx="8" fill="#5f259f" />
                  <text x="100" y="106" fill="white" fontSize="18" fontWeight="bold" textAnchor="middle">पे</text>
                </svg>

                <div className="mt-2 text-xs text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  Scan using PhonePe or any UPI app
                </div>
              </div>

              {/* Demo Payment Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-start space-x-2 text-left">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Demo Payment Mode:</strong> This is a simulated frontend QR code. No real payment address is used and no real money is transferred.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-[#5f259f] hover:bg-[#4d1e82] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Simulated Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                      <span>Simulate Payment Success</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  disabled={isProcessing}
                  className="w-full py-2 px-4 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-medium rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Payment Failure</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-xl text-sm transition-colors flex items-center justify-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cancel Payment</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-center space-x-1 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Demo UPI Checkout • MediFind AI Multi-Pharmacy System</span>
        </div>
      </motion.div>
    </div>
  );
}
