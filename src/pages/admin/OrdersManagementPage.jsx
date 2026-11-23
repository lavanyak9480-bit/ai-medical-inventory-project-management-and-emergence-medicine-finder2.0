import React, { useState } from 'react';
import { ClipboardList, Search, Filter, CheckCircle2, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/dateUtils';

const ORDER_STAGES = [
  "Order Placed",
  "Verification",
  "Preparing",
  "Dispatched",
  "Delivered"
];

export function OrdersManagementPage() {
  const { orders, updateOrderStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState('ALL');

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.medicines.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPharmacy = selectedPharmacy === 'ALL' || o.pharmacy === selectedPharmacy;
    return matchesSearch && matchesPharmacy;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Order Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor and advance order fulfillment stages across Pharmacy A and Pharmacy B.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Patient name, or Medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Pharmacies (A & B)</option>
            <option value="Pharmacy A">Pharmacy A Orders</option>
            <option value="Pharmacy B">Pharmacy B Orders</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Customer & Contact</th>
                <th className="px-4 py-3.5">Pharmacy</th>
                <th className="px-4 py-3.5">Selected Medicines</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Update Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    <p>{ord.id}</p>
                    <span className="text-[11px] text-slate-400 font-normal">{formatDate(ord.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{ord.userName}</p>
                    <p className="text-[11px] text-slate-400">{ord.userPhone}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{ord.userAddress}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={ord.pharmacy}>{ord.pharmacy}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                      {ord.medicines.map((m, idx) => (
                        <p key={idx} className="text-slate-700">
                          {m.name} <span className="text-slate-400 font-medium">× {m.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    {formatCurrency(ord.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={ord.paymentStatus}>{ord.paymentStatus}</Badge>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{ord.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    >
                      {ORDER_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No orders match the search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
