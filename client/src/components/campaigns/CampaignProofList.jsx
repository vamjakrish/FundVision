import { useState } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Lock,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Modal } from '../ui';
import DocumentViewerModal from './DocumentViewerModal';
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

const STATUS_CONFIG = {
  verified: { tone: 'success', label: 'Verified', icon: CheckCircle2 },
  pending: { tone: 'warning', label: 'Pending Review', icon: Clock },
  rejected: { tone: 'danger', label: 'Rejected', icon: AlertCircle },
  superseded: { tone: 'slate', label: 'Superseded', icon: Clock },
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function CampaignProofList({
  documents = [],
  campaignId,
  onDocumentDeleted,
  onRefresh,
  readOnly = false,
}) {
  const [previewDoc, setPreviewDoc] = useState(null); // { id, title }
  const [deleteDoc, setDeleteDoc] = useState(null); // document object to delete
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteDoc || !campaignId) return;

    setIsDeleting(true);
    try {
      const res = await proofAPI.deleteProof(campaignId, deleteDoc._id);
      if (res.data?.success) {
        toast.success('Document deleted successfully');
        setDeleteDoc(null);
        onDocumentDeleted?.(deleteDoc._id);
        onRefresh?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
        <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
          No proof documents uploaded yet
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Upload authentic estimates, medical certificates, or project plans to verify this campaign and build donor trust.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const statusCfg = STATUS_CONFIG[doc.verificationStatus] || STATUS_CONFIG.pending;
        const StatusIcon = statusCfg.icon;
        const formattedDate = doc.createdAt
          ? format(new Date(doc.createdAt), 'dd MMM yyyy')
          : 'Recently';

        return (
          <div
            key={doc._id}
            className={`p-4 rounded-2xl border transition-all ${
              doc.verificationStatus === 'rejected'
                ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10'
                : doc.verificationStatus === 'verified'
                ? 'border-green-200 dark:border-green-900/50 bg-green-50/20 dark:bg-green-950/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
              {/* Left Details */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    doc.verificationStatus === 'verified'
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                      : doc.verificationStatus === 'rejected'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : 'bg-primary-50 text-primary dark:bg-primary-950/60 dark:text-primary-300'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {doc.title}
                    </h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                    <span>Uploaded {formattedDate}</span>
                    <span>•</span>
                    <span>{formatBytes(doc.fileSizeBytes)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      {doc.visibility === 'public' ? (
                        <>
                          <Eye className="w-3 h-3 text-green-500" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-500" /> Admin Only
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Status & Actions */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <Badge tone={statusCfg.tone} icon={StatusIcon}>
                  {statusCfg.label}
                </Badge>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewDoc({ id: doc._id, title: doc.title })}
                    icon={Eye}
                    iconPosition="left"
                  >
                    Preview
                  </Button>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setDeleteDoc(doc)}
                      disabled={doc.verificationStatus === 'verified'}
                      title={
                        doc.verificationStatus === 'verified'
                          ? 'Verified documents cannot be deleted'
                          : 'Delete document'
                      }
                      className={`p-1.5 rounded-lg transition-colors ${
                        doc.verificationStatus === 'verified'
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Feedback Box */}
            {doc.verificationStatus === 'rejected' && doc.verificationNote && (
              <div className="mt-3 p-3 bg-red-100/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Admin Rejection Feedback:</span>
                  <p className="mt-0.5">{doc.verificationNote}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Secure Document Viewer Modal */}
      {previewDoc && (
        <DocumentViewerModal
          docId={previewDoc.id}
          fallbackTitle={previewDoc.title}
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <Modal
          open={!!deleteDoc}
          onClose={() => setDeleteDoc(null)}
          title="Delete Proof Document"
          size="sm"
          footer={
            <div className="flex gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteDoc(null)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          }
        >
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Are you sure you want to delete{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{deleteDoc.title}</strong>?
            </p>
            <p className="text-xs text-slate-400">
              This action cannot be undone. The file will be permanently removed from storage.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
