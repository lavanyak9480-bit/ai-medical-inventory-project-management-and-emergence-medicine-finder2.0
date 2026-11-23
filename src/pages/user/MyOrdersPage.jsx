import React from 'react';
import { ShoppingBag, CheckCircle2, Clock, Truck, Package, ShieldCheck, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/dateUtils';

const STAGES = [
  { key: "Order Placed", label: "1. Order Placed", icon: ShoppingBag },
  { key: "Verification", label: "2. Verification", icon: ShieldCheck },
  { key: "Preparing", label: "3. Preparing", icon: Package },
  { key: "Dispatched", label: "4. Dispatched", icon: Truck },
  { key: "Delivered", label: "5. Delivered", icon: CheckCircle2 }
];

export function MyOrdersPage() {
  const { orders, currentUser } = useApp();

  const myOrders = orders.filter(o => !o.userId || o.userId === currentUser?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Orders & Live Tracking</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track stage-by-stage fulfillment from Pharmacy A and Pharmacy B.
        </p>
      </div>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No orders placed yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Compare prices across Pharmacy A & B and complete a demo checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => {
            const currentStageIndex = STAGES.findIndex(s => s.key === order.orderStatus);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-base">{order.id}</span>
                      <Badge variant={order.pharmacy}>{order.pharmacy}</Badge>
                      <Badge variant={order.paymentStatus}>{order.paymentStatus}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Placed on {formatDate(order.createdAt)} • Payment Method: {order.paymentMethod}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">Total Amount</span>
                    <span className="text-xl font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                {/* 5-Stage Stepper Tracker */}
                <div className="py-2">
                  <p className="text-xs font-semibold text-slate-500 mb-4">Order Progress Stages:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {STAGES.map((stage, idx) => {
                      const isCompleted = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      const Icon = stage.icon;

                      return (
                        <div
                          key={stage.key}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isCurrent
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                              : isCompleted
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : 'bg-white border-slate-100 text-slate-400 opacity-60'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-xs mb-1.5 ${
                              isCompleted
                                ? 'bg-emerald-500 text-white font-bold'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[11px] font-bold">{stage.label}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {isCompleted ? (isCurrent ? 'Current' : 'Done') : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Medicines List in Order */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Prescribed Medicines Ordered:</p>
                  <div className="divide-y divide-slate-200/60">
                    {order.medicines.map((m, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{m.name}</span>
                        <span className="text-slate-600">
                          {m.quantity} × {formatCurrency(m.price)} = <strong className="text-slate-800">{formatCurrency(m.subtotal)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Destination */}
                <div className="flex items-center text-xs text-slate-500 space-x-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Delivery to: <strong className="text-slate-700">{order.userAddress}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
