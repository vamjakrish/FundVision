import { useState } from 'react';
import { HelpCircle, Check, X, FileUp, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../ui';
import { adminAPI } from '../../services/api';

const DOCUMENT_TYPES = [
  { value: 'hospital_estimate', label: 'Hospital Estimate / Quotation' },
  { value: 'medical_report', label: 'Medical Report / Diagnostic Scan' },
  { value: 'government_certificate', label: 'Government Certificate / 80G / 12A' },
  { value: 'project_proposal', label: 'Project Proposal / Plan' },
  { value: 'project_quotation', label: 'Vendor / Project Quotation' },
  { value: 'vendor_invoice', label: 'Vendor Invoice / Equipment Bill' },
  { value: 'beneficiary_proof', label: 'Beneficiary Proof / ID' },
  { value: 'authorization_letter', label: 'Authorization / NOC Letter' },
  { value: 'bank_statement', label: 'Bank Statement / Cancelled Cheque' },
  { value: 'site_photo', label: 'Site / Beneficiary Photo' },
  { value: 'other', label: 'Other Supporting Document' },
];

export default function AdminRequestInfoModal({
  open,
  onClose,
  campaign,
  onSuccess,
}) {
  const [reason, setReason] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campaign) return null;

  const toggleType = (typeValue) => {
    setSelectedTypes((prev) =>
      prev.includes(typeValue)
        ? prev.filter((t) => t !== typeValue)
        : [...prev, typeValue]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason || !reason.trim()) {
      toast.error('Please specify the reason/information required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAPI.requestMoreInfo(campaign._id, {
        reason: reason.trim(),
        requestedTypes: selectedTypes,
      });

      if (res.data?.success) {
        toast.success('Information request sent to organization! 📋');
        setReason('');
        setSelectedTypes([]);
        onClose();
        onSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <HelpCircle className="w-5 h-5" />
          <span>Request More Information</span>
        </div>
      }
      size="lg"
      footer={
        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="flex-1 !bg-amber-600 hover:!bg-amber-700"
            icon={Send}
            iconPosition="left"
          >
            {isSubmitting ? 'Sending Request...' : 'Send Request to Organization'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The campaign verification status will change to{' '}
          <strong className="text-amber-600 font-semibold">More Information Required</strong>.
          The organization will receive a notification and can upload requested documents before resubmitting.
        </p>

        {/* Reason */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Explanation / Feedback for Organization *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Please upload an updated hospital estimate with official stamp and date, and clarify medicine expenses."
            className="input-field text-xs resize-none"
            maxLength={1000}
            required
          />
        </div>

        {/* Specific Document Types Multi-select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Specifically Requested Document Types (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
            {DOCUMENT_TYPES.map((t) => {
              const isSelected = selectedTypes.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleType(t.value)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="truncate pr-2">{t.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
