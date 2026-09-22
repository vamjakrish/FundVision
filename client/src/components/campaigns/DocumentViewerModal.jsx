import { useState, useEffect } from 'react';
import { ExternalLink, FileText, Lock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal, Badge, Button } from '../ui';
import { proofAPI } from '../../services/api';

const DOC_TYPE_LABELS = {
  hospital_estimate: 'Hospital Estimate / Quotation',
  medical_report: 'Medical Report / Diagnostic Scan',
  government_certificate: 'Government Certificate / 80G / 12A',
  project_proposal: 'Project Proposal / Plan',
  project_quotation: 'Vendor / Project Quotation',
  vendor_invoice: 'Vendor Invoice / Receipt',
  beneficiary_proof: 'Beneficiary Proof / ID',
  authorization_letter: 'Authorization / NOC Letter',
  bank_statement: 'Bank Statement / Cancelled Cheque',
  site_photo: 'Site / Beneficiary Photo',
  other: 'Supporting Document',
};

const STATUS_TONES = {
  verified: 'success',
  pending: 'warning',
  rejected: 'danger',
  superseded: 'slate',
};

export default function DocumentViewerModal({ docId, open, onClose, fallbackTitle }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (!open || !docId) {
      setPreviewData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    proofAPI
      .getSecurePreview(docId)
      .then((res) => {
        if (isMounted && res.data?.success) {
          setPreviewData(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Failed to load secure document preview. Please try again.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, docId]);

  const doc = previewData?.document;
  const previewUrl = previewData?.previewUrl;
  const isPdf = doc?.fileType === 'application/pdf' || previewUrl?.includes('.pdf');
  const title = doc?.title || fallbackTitle || 'Document Preview';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 max-w-[85%]">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <span className="truncate">{title}</span>
        </div>
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2 text-xs text-slate-400">
          <span>🔒 Protected with time-limited signed access</span>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary !py-1.5 !px-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-primary"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Screen
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Metadata Bar */}
        {doc && (
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex-wrap text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
              </span>
              <Badge tone={doc.visibility === 'public' ? 'success' : 'slate'} icon={doc.visibility === 'public' ? Eye : Lock}>
                {doc.visibility === 'public' ? 'Public' : 'Admin Only'}
              </Badge>
              <Badge tone={STATUS_TONES[doc.verificationStatus] || 'slate'}>
                {doc.verificationStatus ? doc.verificationStatus.replace('_', ' ').toUpperCase() : 'PENDING'}
              </Badge>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">{doc.fileType}</span>
          </div>
        )}

        {/* Viewer Content */}
        {loading && (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading secure document preview...</p>
          </div>
        )}

        {error && (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-3 text-center p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setLoading(true);
                setError(null);
                proofAPI
                  .getSecurePreview(docId)
                  .then((res) => res.data?.success && setPreviewData(res.data))
                  .catch((err) => setError(err.response?.data?.message || 'Failed to load preview'))
                  .finally(() => setLoading(false));
              }}
            >
              Retry Loading
            </Button>
          </div>
        )}

        {!loading && !error && previewUrl && (
          <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=0`}
                title={title}
                className="w-full h-[65vh] rounded-xl bg-white"
              />
            ) : (
              <div className="max-h-[65vh] overflow-auto p-4 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt={title}
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
