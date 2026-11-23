import React, { useState } from 'react';
import { FileCheck, Search, CheckCircle2, XCircle, Eye, AlertCircle, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/dateUtils';

export function PrescriptionsManagementPage() {
  const { prescriptions, verifyPrescription, rejectPrescription } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [inspectingRx, setInspectingRx] = useState(null);

  // Reject modal state
  const [rejectingRxId, setRejectingRxId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleVerify = (id) => {
    verifyPrescription(id, "Verified by Main Admin - Approved for dispensing.");
  };

  const handleOpenReject = (id) => {
    setRejectingRxId(id);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejecting this prescription.");
      return;
    }
    rejectPrescription(rejectingRxId, rejectReason);
    setRejectingRxId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Prescription Verification</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review patient uploaded prescriptions, verify OCR-extracted medicine lists, or reject invalid documents.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Clinical Verification Mandate:</strong> OCR extraction is assistive and does not constitute medical approval. Each prescription requires manual verification by the Main Admin prior to dispensing.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient name, Prescription ID, or File name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
            <option value="Uploaded">Uploaded</option>
          </select>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Prescription ID</th>
                <th className="px-4 py-3.5">Patient Details</th>
                <th className="px-4 py-3.5">File Name & Date</th>
                <th className="px-4 py-3.5">Extracted Medicines</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-800">{rx.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{rx.userName || 'Patient'}</p>
                    <p className="text-[11px] text-slate-400">ID: {rx.userId || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-700">{rx.fileName}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(rx.uploadedAt)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setInspectingRx(rx)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{rx.medicines?.length || 0} Medicines</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={rx.status}>{rx.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {rx.status === 'Pending Verification' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleVerify(rx.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReject(rx.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition-colors inline-flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {rx.status} by {rx.reviewedBy || 'Admin'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPrescriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No prescriptions match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect OCR Extracted Details Modal */}
      {inspectingRx && (
        <Modal
          isOpen={Boolean(inspectingRx)}
          onClose={() => setInspectingRx(null)}
          title={`Prescription Review: ${inspectingRx.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Uploaded File: {inspectingRx.fileName}</p>
                <p className="text-slate-400">Patient: {inspectingRx.userName}</p>
              </div>
              <Badge variant={inspectingRx.status}>{inspectingRx.status}</Badge>
            </div>

            {inspectingRx.reviewNotes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <strong>Review Note:</strong> {inspectingRx.reviewNotes}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                OCR Extracted Clinical Items
              </p>
              <div className="space-y-2">
                {inspectingRx.medicines?.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{m.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Strength: {m.strength} • Dosage: {m.dosage} • Frequency: {m.frequency}
                      </p>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">{m.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            {inspectingRx.fileUrl && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Document Scan:</p>
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                  <img src={inspectingRx.fileUrl} alt="Prescription" className="max-h-56 object-contain" />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectingRx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close Review
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {rejectingRxId && (
        <Modal
          isOpen={Boolean(rejectingRxId)}
          onClose={() => setRejectingRxId(null)}
          title="Reject Prescription"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Please enter the clinical rejection reason that will be shown to the patient:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Doctor's medical council registration number is missing, or prescription is unreadable."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRejectingRxId(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
