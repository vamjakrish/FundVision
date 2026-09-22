import { useState } from 'react';
import { format } from 'date-fns';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Send,
  History,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Modal, Card } from '../ui';
import { proofAPI } from '../../services/api';

const STATUS_THEMES = {
  not_submitted: {
    tone: 'slate',
    title: 'Not Submitted for Verification',
    description: 'Upload your supporting proof documents and fund breakdown, then submit your campaign for review.',
    icon: HelpCircle,
    bgClass: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
    iconClass: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  },
  pending: {
    tone: 'warning',
    title: 'Verification Pending',
    description: 'Your campaign has been submitted and is in the queue for administrator verification.',
    icon: Clock,
    bgClass: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
    iconClass: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50',
  },
  under_review: {
    tone: 'primary',
    title: 'Under Review',
    description: 'Our Trust & Safety team is actively reviewing your campaign and submitted proof documents.',
    icon: Clock,
    bgClass: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40',
    iconClass: 'text-primary bg-primary-50 dark:bg-primary-950/50',
  },
  more_info_required: {
    tone: 'warning',
    title: 'Additional Information Required',
    description: 'The review team needs additional documents or clarification before this campaign can be verified.',
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800',
    iconClass: 'text-amber-600 bg-amber-100 dark:bg-amber-900/60',
  },
  verified: {
    tone: 'success',
    title: 'Campaign Verified',
    description: 'This campaign has been fully verified and is awarded the FundVision Proof of Trust badge.',
    icon: CheckCircle2,
    bgClass: 'bg-green-50/70 dark:bg-green-950/20 border-green-200 dark:border-green-900/40',
    iconClass: 'text-green-600 bg-green-100 dark:bg-green-900/50',
  },
  rejected: {
    tone: 'danger',
    title: 'Verification Rejected',
    description: 'The campaign verification was rejected based on the documents or information provided.',
    icon: XCircle,
    bgClass: 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40',
    iconClass: 'text-red-600 bg-red-100 dark:bg-red-900/50',
  },
  suspended: {
    tone: 'danger',
    title: 'Verification Suspended',
    description: 'Verification is temporarily suspended pending internal investigation.',
    icon: AlertCircle,
    bgClass: 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40',
    iconClass: 'text-red-600 bg-red-100 dark:bg-red-900/50',
  },
};

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

export default function CampaignVerificationStatusCard({
  campaign,
  onUploadRequestedDoc,
  onResubmitSuccess,
  hasProofDocuments = false,
  hasFundUtilization = false,
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmitNote, setResubmitNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campaign) return null;

  const currentStatus = campaign.verificationStatus || 'not_submitted';
  const theme = STATUS_THEMES[currentStatus] || STATUS_THEMES.not_submitted;
  const StatusIcon = theme.icon;

  const history = campaign.verificationHistory || [];
  const latestHistory = history[history.length - 1];
  const requestedTypes = latestHistory?.requestedTypes || [];

  const canSubmit = ['not_submitted', 'more_info_required', 'rejected'].includes(currentStatus);

  const handleResubmit = async () => {
    if (!hasProofDocuments && !hasFundUtilization) {
      toast.error('Please upload at least one proof document or fund breakdown before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await proofAPI.submitVerification(campaign._id, {
        note: resubmitNote.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(
          currentStatus === 'more_info_required'
            ? 'Campaign resubmitted for verification review! 🚀'
            : 'Campaign submitted for verification review! 🚀'
        );
        setResubmitModalOpen(false);
        setResubmitNote('');
        onResubmitSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Verification Banner Card */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${theme.bgClass} transition-all`}>
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${theme.iconClass}`}>
              <StatusIcon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  {theme.title}
                </h3>
                <Badge tone={theme.tone}>
                  {currentStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {theme.description}
              </p>

              {/* Admin feedback message if present */}
              {campaign.verificationFeedback && (
                <div className="mt-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Latest Reviewer Note:
                  </span>
                  <p className="leading-relaxed">{campaign.verificationFeedback}</p>
                </div>
              )}

              {/* Requested Document Types Tags */}
              {currentStatus === 'more_info_required' && requestedTypes.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Specifically Requested Documents:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {requestedTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onUploadRequestedDoc?.(type)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-medium hover:bg-amber-200 transition-colors"
                      >
                        <FileUp className="w-3 h-3" /> {DOC_TYPE_LABELS[type] || type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {canSubmit && (
            <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0 flex sm:flex-col justify-end gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setResubmitModalOpen(true)}
                icon={Send}
                iconPosition="left"
                className="w-full sm:w-auto"
              >
                {currentStatus === 'more_info_required'
                  ? 'Resubmit for Review'
                  : currentStatus === 'rejected'
                  ? 'Resubmit Application'
                  : 'Submit for Verification'}
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Toggle for Audit History */}
        {history.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              {history.length} verification event{history.length > 1 ? 's' : ''} recorded
            </span>

            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
            >
              {showHistory ? (
                <>
                  Hide History <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  View Audit History <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Verification History Timeline (Collapsible) */}
      {showHistory && history.length > 0 && (
        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <History className="w-4 h-4 text-primary" /> Verification Audit History
          </h4>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {history.map((event, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
                <div className="text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                      {event.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {event.actionAt ? format(new Date(event.actionAt), 'dd MMM yyyy, hh:mm a') : 'Recently'}
                    </span>
                  </div>

                  {event.note && (
                    <p className="text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      {event.note}
                    </p>
                  )}

                  {event.requestedTypes && event.requestedTypes.length > 0 && (
                    <div className="mt-1 text-slate-500">
                      Requested: {event.requestedTypes.map((t) => DOC_TYPE_LABELS[t] || t).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resubmission Modal */}
      {resubmitModalOpen && (
        <Modal
          open={resubmitModalOpen}
          onClose={() => setResubmitModalOpen(false)}
          title={
            currentStatus === 'more_info_required'
              ? 'Resubmit Campaign for Review'
              : 'Submit Campaign for Verification'
          }
          size="md"
          footer={
            <div className="flex gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setResubmitModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResubmit}
                disabled={isSubmitting}
                className="flex-1"
                icon={Send}
                iconPosition="left"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Your campaign and supporting documents will be queued for review by the FundVision Trust & Safety Team.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Note for Reviewers (Optional)
              </label>
              <textarea
                value={resubmitNote}
                onChange={(e) => setResubmitNote(e.target.value)}
                rows={3}
                placeholder="Explain any new documents uploaded or changes made in response to previous feedback..."
                className="input-field text-xs resize-none"
                maxLength={500}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
