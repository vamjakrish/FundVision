import { useState } from 'react';
import { Upload, FileText, Lock, Eye, AlertCircle, Check, X, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card } from '../ui';
import { proofAPI } from '../../services/api';

export const DOCUMENT_TYPES = [
  { value: 'hospital_estimate', label: 'Hospital Estimate / Medical Quotation' },
  { value: 'medical_report', label: 'Medical Report / Diagnostic Scan' },
  { value: 'government_certificate', label: 'Government Certificate / 80G / 12A' },
  { value: 'project_proposal', label: 'Project Proposal / Detailed Plan' },
  { value: 'project_quotation', label: 'Vendor / Project Quotation' },
  { value: 'vendor_invoice', label: 'Vendor Invoice / Equipment Bill' },
  { value: 'beneficiary_proof', label: 'Beneficiary Proof / Identification' },
  { value: 'authorization_letter', label: 'Authorization / NOC Letter' },
  { value: 'bank_statement', label: 'Bank Statement / Cancelled Cheque' },
  { value: 'site_photo', label: 'Site / Beneficiary Photo' },
  { value: 'other', label: 'Other Supporting Document' },
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export default function CampaignProofUpload({
  campaignId,
  onUploadSuccess,
  onCancel,
  initialDocType,
}) {
  const [documentType, setDocumentType] = useState(initialDocType || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('admin_only'); // Default: admin_only for security
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File size exceeds the 15MB limit');
      e.target.value = '';
      return;
    }

    // Check extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('Unsupported file format. Please upload PDF, JPG, PNG, or WEBP.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    if (!title) {
      // Auto-suggest title from filename
      const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(base.replace(/[-_]/g, ' ').substring(0, 80));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!campaignId) {
      toast.error('Campaign ID is required to upload documents');
      return;
    }

    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }

    if (!title || !title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a document file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);
      formData.append('title', title.trim());
      if (description && description.trim()) {
        formData.append('description', description.trim());
      }
      formData.append('visibility', visibility);

      const res = await proofAPI.uploadProof(campaignId, formData);
      if (res.data?.success) {
        toast.success('Document uploaded successfully! Awaiting verification. 🎉');
        // Reset form
        setDocumentType('');
        setTitle('');
        setDescription('');
        setVisibility('admin_only');
        setSelectedFile(null);
        onUploadSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm" padding="p-5 sm:p-7">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Upload Campaign Proof Document
            </h3>
            <p className="text-xs text-slate-500">
              Provide authentic documents to verify your campaign legitimacy.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Document Type & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Document Type *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="input-field text-sm"
              required
            >
              <option value="">Select document type...</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Document Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apollo Hospital Cost Estimate 2026"
              className="input-field text-sm"
              maxLength={200}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Description / Context <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Briefly explain what this document verifies (e.g. Breakdown of surgery & ICU stay costs)"
            className="input-field text-xs resize-none"
            maxLength={1000}
          />
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            File (PDF, JPG, PNG, WEBP — Max 15MB) *
          </label>

          <label
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              selectedFile
                ? 'border-primary bg-primary/5 dark:bg-primary-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-primary/50 bg-slate-50/50 dark:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[260px] sm:max-w-md">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Click to choose different file
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Click or drag file to upload
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports official PDFs, medical scans, estimates, and bills
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Visibility Setting */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Document Visibility & Donor Access *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                visibility === 'admin_only'
                  ? 'border-primary bg-primary/5 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="doc_visibility"
                value="admin_only"
                checked={visibility === 'admin_only'}
                onChange={() => setVisibility('admin_only')}
                className="mt-1 accent-primary"
              />
              <div className="text-xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Admin Only (Recommended)
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Kept strictly confidential. Only authorized FundVision administrators can review this document.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                visibility === 'public'
                  ? 'border-primary bg-primary/5 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="doc_visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
                className="mt-1 accent-primary"
              />
              <div className="text-xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Eye className="w-3.5 h-3.5 text-green-500" /> Public Proof
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Safe for donor viewing. Once verified by admins, this document can be viewed by donors on the campaign page.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          {onCancel && (
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isUploading || !selectedFile || !documentType || !title.trim()}
            icon={isUploading ? RefreshCw : Upload}
            iconPosition="left"
            className={isUploading ? 'opacity-80' : ''}
          >
            {isUploading ? 'Uploading Document...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
