import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, UploadCloud, CheckCircle2, Clock, XCircle, FileCheck, Scale } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../utils/dateUtils';

export function PrescriptionsListPage() {
  const { prescriptions, currentUser } = useApp();

  const myPrescriptions = prescriptions.filter(p => !p.userId || p.userId === currentUser?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Prescriptions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track verification status and view extracted medicine records.
          </p>
        </div>
        <Link
          to="/upload-prescription"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Prescription</span>
        </Link>
      </div>

      {myPrescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No prescriptions uploaded yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload your prescription to extract medicines and compare prices across Pharmacy A & B.
          </p>
          <Link
            to="/upload-prescription"
            className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
          >
            Upload Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myPrescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{rx.fileName}</h3>
                    <p className="text-xs text-slate-400">
                      Uploaded on {formatDate(rx.uploadedAt)} • ID: {rx.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={rx.status}>{rx.status}</Badge>
                </div>
              </div>

              {/* Review feedback if verified or rejected */}
              {rx.reviewNotes && (
                <div className={`p-3 rounded-xl text-xs ${
                  rx.status === 'Verified' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <strong>Pharmacist / Admin Note:</strong> {rx.reviewNotes}
                </div>
              )}

              {/* Extracted medicines list */}
              {rx.medicines && rx.medicines.length > 0 && (
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Extracted Medicines ({rx.medicines.length}):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {rx.medicines.map((m, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                        <p className="font-semibold text-slate-800">{m.name}</p>
                        <p className="text-slate-500 text-[11px]">{m.strength} • {m.frequency || m.dosage}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-1">
                <Link
                  to="/compare"
                  state={{ extractedMedicines: rx.medicines }}
                  className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg border border-sky-200 transition-colors flex items-center space-x-1"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare in Pharmacies</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
