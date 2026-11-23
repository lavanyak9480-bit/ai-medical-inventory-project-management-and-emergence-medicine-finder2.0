import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck2,
  Scale,
  Sparkles,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SAMPLE_PRESCRIPTIONS } from '../../data/mockData';
import { simulateOcrProcessing } from '../../utils/ocrSimulator';
import { Badge } from '../../components/common/Badge';

export function UploadPrescriptionPage() {
  const { uploadPrescription } = useApp();
  const navigate = useNavigate();

  // Upload & File State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);

  // OCR Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [extractedMedicines, setExtractedMedicines] = useState(null);
  const [submittedRx, setSubmittedRx] = useState(null);
  const [error, setError] = useState('');

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check supported format: JPG, PNG, PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid JPG, PNG, or PDF file.');
      return;
    }

    setError('');
    setSelectedSample(null);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      // PDF file preview placeholder
      setPreviewUrl(null);
    }

    // Reset previous extraction
    setExtractedMedicines(null);
    setSubmittedRx(null);
  };

  // Handle Sample selection for immediate quick testing
  const handleSelectSample = (sample) => {
    setError('');
    setSelectedFile({
      name: `${sample.id}.jpg`,
      type: 'image/jpeg',
      size: 1024 * 850
    });
    setPreviewUrl(sample.previewUrl);
    setSelectedSample(sample);
    setExtractedMedicines(null);
    setSubmittedRx(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedSample(null);
    setExtractedMedicines(null);
    setSubmittedRx(null);
    setError('');
  };

  // Run OCR processing
  const handleStartOcr = async () => {
    if (!selectedFile) {
      setError('Please upload a prescription or choose a sample to process.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const results = await simulateOcrProcessing(selectedSample, (progress) => {
        setOcrProgress(progress);
      });

      setExtractedMedicines(results);

      // Save as prescription in context with status "Pending Verification"
      // OCR must not automatically approve a prescription
      const rxRecord = uploadPrescription({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        fileUrl: previewUrl,
        medicines: results
      });

      setSubmittedRx(rxRecord);
    } catch (err) {
      setError('OCR extraction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToCompare = () => {
    // Navigate to comparison page with extracted medicine names
    navigate('/compare', { state: { extractedMedicines } });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Prescription OCR Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Upload Doctor's Prescription
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Supports JPG, PNG, and PDF. Optical Character Recognition extracts clinical medicine details for multi-pharmacy comparison.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload & Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Box + Sample Picker */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Upload Document</span>
            </h2>

            {/* Drag & Drop Input */}
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 text-center">
                Click to browse or drop file here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Accepted: JPG, PNG, PDF (Max 10MB)
              </p>
            </label>

            {/* Quick Sample Selector for immediate demo testing */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <span>Or select a test sample prescription:</span>
              </p>
              <div className="space-y-2">
                {SAMPLE_PRESCRIPTIONS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      selectedSample?.id === sample.id
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{sample.title}</p>
                      <p className="text-[11px] text-slate-500">{sample.doctorName} • {sample.date}</p>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">Select</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: File Preview & Action Trigger */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <span>Prescription Preview</span>
                </h2>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove File</span>
                  </button>
                )}
              </div>

              {/* Preview Body */}
              <div className="mt-4">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{selectedFile.name}</span>
                      </div>
                      <span className="text-slate-500 shrink-0">
                        {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ''}
                      </span>
                    </div>

                    {previewUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100 flex items-center justify-center">
                        <img
                          src={previewUrl}
                          alt="Prescription Scan"
                          className="w-full h-auto object-contain max-h-64"
                        />
                        {isProcessing && (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                            <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-semibold mt-2">OCR Scanning in Progress...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">PDF Document Loaded</p>
                        <p className="text-[11px] text-slate-500 mt-1">Ready for text & table extraction</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <UploadCloud className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">No prescription file selected yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Upload a photo/PDF or click one of the test samples.</p>
                  </div>
                )}
              </div>
            </div>

            {/* OCR Process Button */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={handleStartOcr}
                disabled={!selectedFile || isProcessing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Prescription OCR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI OCR Extraction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OCR Progress Status View */}
      {isProcessing && ocrProgress && (
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>OCR Status: {ocrProgress.message}</span>
            <span>{ocrProgress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${ocrProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Extracted Clinical Medicines Table */}
      {extractedMedicines && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Extracted Medicines Details</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically parsed clinical entities from prescription scan.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="Pending Verification">Status: Pending Verification</Badge>
            </div>
          </div>

          {/* Safety Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Verification Requirement:</strong> OCR parses handwritten text for convenience, but does not constitute automated medical approval. A pharmacist or admin verifies records before fulfillment.
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Medicine Name</th>
                  <th className="px-4 py-3">Strength</th>
                  <th className="px-4 py-3">Dosage</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractedMedicines.map((med, idx) => {
                  const isUncertain =
                    med.name.includes('Unable to detect') ||
                    med.strength.includes('Unable to detect');

                  return (
                    <tr key={idx} className={isUncertain ? 'bg-rose-50/40' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {med.name === 'Unable to detect – manual confirmation required.' ? (
                          <span className="text-rose-600 font-medium italic">
                            Unable to detect – manual confirmation required.
                          </span>
                        ) : (
                          med.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {med.strength === 'Unable to detect – manual confirmation required.' ? (
                          <span className="text-rose-600 italic">
                            Unable to detect – manual confirmation required.
                          </span>
                        ) : (
                          med.strength
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{med.dosage}</td>
                      <td className="px-4 py-3 text-slate-600">{med.frequency}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {med.duration === 'Unable to detect – manual confirmation required.' ? (
                          <span className="text-rose-600 italic">
                            Unable to detect – manual confirmation required.
                          </span>
                        ) : (
                          med.duration
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action to proceed to Comparison */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Prescription saved to your account. Ready to check prices and stock across Pharmacy A and B.
            </span>
            <button
              type="button"
              onClick={handleProceedToCompare}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Pharmacy A & Pharmacy B</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
