import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ShieldCheck,
  Shield,
  FileText,
  PieChart,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  Lock,
  ExternalLink,
  History,
  Building2,
  Calendar,
  DollarSign,
  Send,
  RefreshCw,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Badge, Button, Card, SkeletonRow } from '../ui';
import { campaignAPI, proofAPI, adminAPI } from '../../services/api';
import DocumentViewerModal from '../campaigns/DocumentViewerModal';
import AdminRequestInfoModal from './AdminRequestInfoModal';
import AdminVerifyCampaignModal from './AdminVerifyCampaignModal';
import AdminRejectCampaignModal from './AdminRejectCampaignModal';
import { AdminVerifyDocModal, AdminRejectDocModal } from './AdminDocumentActionModals';

const DOC_TYPE_LABELS = {
  hospital_estimate: 'Hospital Estimate / Quotation',
  medical_report: 'Medical Report / Diagnostic Scan',
  government_certificate: 'Government Certificate / 80G / 12A',
  project_proposal: 'Project Proposal / Plan',
  project_quotation: 'Vendor / Project Quotation',
  vendor_invoice: 'Vendor Invoice / Equipment Bill',
  beneficiary_proof: 'Beneficiary Proof / ID',
  authorization_letter: 'Authorization / NOC Letter',
  bank_statement: 'Bank Statement / Cancelled Cheque',
  site_photo: 'Site / Beneficiary Photo',
  other: 'Supporting Document',
};

const VERIFY_STATUS_TONES = {
  verified: 'success',
  pending: 'warning',
  under_review: 'primary',
  more_info_required: 'warning',
  rejected: 'danger',
  suspended: 'danger',
  not_submitted: 'slate',
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AdminCampaignReviewModal({
  campaignId,
  open,
  onClose,
  onRefreshQueue,
}) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('proofs'); // 'proofs' | 'utilization' | 'history'

  // Modals state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [verifyDocTarget, setVerifyDocTarget] = useState(null);
  const [rejectDocTarget, setRejectDocTarget] = useState(null);
  const [requestInfoModalOpen, setRequestInfoModalOpen] = useState(false);
  const [verifyCampaignModalOpen, setVerifyCampaignModalOpen] = useState(false);
  const [rejectCampaignModalOpen, setRejectCampaignModalOpen] = useState(false);
  const [markingUnderReview, setMarkingUnderReview] = useState(false);

  // Fetch campaign details
  const {
    data: campRes,
    isLoading: campLoading,
    refetch: refetchCampaign,
  } = useQuery({
    queryKey: ['admin-campaign-review', campaignId],
    queryFn: () => campaignAPI.getOne(campaignId).then((r) => r.data),
    enabled: !!campaignId && open,
  });

  // Fetch campaign proof documents
  const {
    data: docsRes,
    isLoading: docsLoading,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['admin-campaign-docs', campaignId],
    queryFn: () => proofAPI.getProofs(campaignId).then((r) => r.data),
    enabled: !!campaignId && open,
  });

  const campaign = campRes?.data;
  const documents = docsRes?.data || [];

  const handleDocumentActionSuccess = () => {
    refetchDocs();
    refetchCampaign();
    onRefreshQueue?.();
    qc.invalidateQueries({ queryKey: ['admin-verification-queue'] });
  };

  const handleCampaignActionSuccess = () => {
    refetchCampaign();
    refetchDocs();
    onRefreshQueue?.();
    qc.invalidateQueries({ queryKey: ['admin-verification-queue'] });
  };

  const handleMarkUnderReview = async () => {
    if (!campaign) return;
    setMarkingUnderReview(true);
    try {
      const res = await adminAPI.verifyCampaignStatus(campaign._id, {
        status: 'under_review',
        note: 'Admin commenced active proof of trust verification review',
      });
      if (res.data?.success) {
        toast.success('Campaign marked as Under Review');
        refetchCampaign();
        onRefreshQueue?.();
        qc.invalidateQueries({ queryKey: ['admin-verification-queue'] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setMarkingUnderReview(false);
    }
  };

  if (!open) return null;

  const vStatus = campaign?.verificationStatus || 'not_submitted';
  const totalUtilization = (campaign?.fundUtilization || []).reduce(
    (sum, i) => sum + (Number(i.estimatedAmount) || 0),
    0
  );
  const goalAmount = Number(campaign?.goalAmount) || 0;
  const pct = goalAmount > 0 ? Math.round((totalUtilization / goalAmount) * 100) : 0;
  const isWithinTolerance = pct >= 85 && pct <= 115;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 max-w-[85%]">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <span className="truncate">Proof of Trust Review: {campaign?.title || 'Loading...'}</span>
        </div>
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2 text-xs">
          <span className="text-slate-400">Reviewing evidence as authorized Administrator</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Reviewer
          </Button>
        </div>
      }
    >
      {campLoading ? (
        <div className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Loading campaign details & proof documents...</p>
        </div>
      ) : !campaign ? (
        <div className="p-8 text-center text-slate-500">Campaign not found.</div>
      ) : (
        <div className="space-y-5">
          {/* Header Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="primary">{campaign.category}</Badge>
                  <Badge tone={VERIFY_STATUS_TONES[vStatus] || 'slate'}>
                    {vStatus.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Campaign Status: <strong className="text-slate-600 dark:text-slate-300 capitalize">{campaign.status}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                  {campaign.title}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Goal Amount</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  ₹{goalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Organization Info & Meta Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  {campaign.organization?.name || 'Organization'}
                  {campaign.organization?.isVerified && (
                    <span className="text-green-600 ml-1 font-bold" title="Verified NGO">✓</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Deadline: {campaign.deadline ? format(new Date(campaign.deadline), 'dd MMM yyyy') : 'No deadline'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <PieChart className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Plan: <strong>₹{totalUtilization.toLocaleString()}</strong> ({pct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for Campaign Verification */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Admin Verification Actions:
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {vStatus !== 'under_review' && vStatus !== 'verified' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkUnderReview}
                  disabled={markingUnderReview}
                  icon={Clock}
                  iconPosition="left"
                >
                  {markingUnderReview ? 'Updating...' : 'Mark Under Review'}
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRequestInfoModalOpen(true)}
                icon={HelpCircle}
                iconPosition="left"
                className="!text-amber-700 !bg-amber-50 hover:!bg-amber-100 dark:!bg-amber-950/40 dark:!text-amber-300"
              >
                Request More Info
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectCampaignModalOpen(true)}
                icon={XCircle}
                iconPosition="left"
                className="!border-red-200 !text-red-600 hover:!bg-red-50"
              >
                Reject Verification
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setVerifyCampaignModalOpen(true)}
                icon={CheckCircle2}
                iconPosition="left"
                className="!bg-green-600 hover:!bg-green-700"
              >
                Verify Campaign
              </Button>
            </div>
          </div>

          {/* Review Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('proofs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'proofs'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Proof Documents ({documents.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('utilization')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'utilization'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Fund Plan ({campaign.fundUtilization?.length || 0} items)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              Audit Trail ({campaign.verificationHistory?.length || 0})
            </button>
          </div>

          {/* TAB 1: Proof Documents */}
          {activeTab === 'proofs' && (
            <div className="space-y-3">
              {docsLoading ? (
                <div className="divide-y divide-slate-100">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      doc.verificationStatus === 'verified'
                        ? 'border-green-200 dark:border-green-900/40 bg-green-50/20'
                        : doc.verificationStatus === 'rejected'
                        ? 'border-red-200 dark:border-red-900/40 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                              {doc.title}
                            </h4>
                            <Badge tone="slate">
                              {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                            </Badge>
                            <Badge tone={doc.visibility === 'public' ? 'success' : 'slate'} icon={doc.visibility === 'public' ? Eye : Lock}>
                              {doc.visibility === 'public' ? 'Public' : 'Admin Only'}
                            </Badge>
                            <Badge tone={VERIFY_STATUS_TONES[doc.verificationStatus] || 'slate'}>
                              {doc.verificationStatus?.toUpperCase()}
                            </Badge>
                          </div>

                          {doc.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {doc.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                            <span>{formatBytes(doc.fileSizeBytes)}</span>
                            <span>•</span>
                            <span>{doc.fileType}</span>
                            <span>•</span>
                            <span>Uploaded {doc.createdAt ? format(new Date(doc.createdAt), 'dd MMM yyyy') : 'Recently'}</span>
                            {doc.verifiedBy && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Verified by {doc.verifiedBy.name || 'Admin'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons for this document */}
                      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewDoc({ id: doc._id, title: doc.title })}
                          icon={Eye}
                          iconPosition="left"
                        >
                          Preview
                        </Button>

                        {doc.verificationStatus !== 'verified' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setVerifyDocTarget(doc)}
                            icon={CheckCircle2}
                            iconPosition="left"
                            className="!bg-green-600 hover:!bg-green-700"
                          >
                            Verify
                          </Button>
                        )}

                        {doc.verificationStatus !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectDocTarget(doc)}
                            icon={XCircle}
                            iconPosition="left"
                            className="!border-red-200 !text-red-600 hover:!bg-red-50"
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Rejection Feedback Banner */}
                    {doc.verificationStatus === 'rejected' && doc.verificationNote && (
                      <div className="mt-2.5 p-2.5 bg-red-100/60 dark:bg-red-950/40 rounded-xl text-xs text-red-700 dark:text-red-300">
                        <span className="font-bold">Rejection Note:</span> {doc.verificationNote}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No proof documents uploaded</p>
                  <p className="text-xs text-slate-400 mt-1">The organization has not attached any proof documents to this campaign yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Fund Utilization Review */}
          {activeTab === 'utilization' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 flex-wrap ${
                isWithinTolerance ? 'bg-green-50/60 border-green-200 dark:bg-green-950/20 dark:border-green-900/40' : 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Allocation Health</span>
                    <Badge tone={isWithinTolerance ? 'success' : 'warning'}>
                      {isWithinTolerance ? 'Within Goal Tolerance (±15%)' : 'Goal Mismatch'}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    ₹{totalUtilization.toLocaleString()} planned of ₹{goalAmount.toLocaleString()} ({pct}%)
                  </div>
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  {campaign.fundUtilization?.length || 0} line items defined
                </span>
              </div>

              {campaign.fundUtilization && campaign.fundUtilization.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                      <tr>
                        <th className="p-3 text-left font-semibold">#</th>
                        <th className="p-3 text-left font-semibold">Purpose</th>
                        <th className="p-3 text-right font-semibold">Estimated Amount</th>
                        <th className="p-3 text-left font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {campaign.fundUtilization.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.purpose}</td>
                          <td className="p-3 text-right font-bold text-slate-900 dark:text-white">₹{Number(item.estimatedAmount).toLocaleString()}</td>
                          <td className="p-3 text-slate-500">{item.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <PieChart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No fund utilization items defined</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Audit Trail / History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {campaign.verificationHistory && campaign.verificationHistory.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {campaign.verificationHistory.map((event, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
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
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No historical verification events recorded yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Document Modal */}
      {previewDoc && (
        <DocumentViewerModal
          docId={previewDoc.id}
          fallbackTitle={previewDoc.title}
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Verify Single Document Modal */}
      {verifyDocTarget && (
        <AdminVerifyDocModal
          open={!!verifyDocTarget}
          document={verifyDocTarget}
          onClose={() => setVerifyDocTarget(null)}
          onSuccess={handleDocumentActionSuccess}
        />
      )}

      {/* Reject Single Document Modal */}
      {rejectDocTarget && (
        <AdminRejectDocModal
          open={!!rejectDocTarget}
          document={rejectDocTarget}
          onClose={() => setRejectDocTarget(null)}
          onSuccess={handleDocumentActionSuccess}
        />
      )}

      {/* Request Information Modal */}
      {requestInfoModalOpen && (
        <AdminRequestInfoModal
          open={requestInfoModalOpen}
          campaign={campaign}
          onClose={() => setRequestInfoModalOpen(false)}
          onSuccess={handleCampaignActionSuccess}
        />
      )}

      {/* Verify Campaign Modal */}
      {verifyCampaignModalOpen && (
        <AdminVerifyCampaignModal
          open={verifyCampaignModalOpen}
          campaign={campaign}
          documents={documents}
          onClose={() => setVerifyCampaignModalOpen(false)}
          onSuccess={handleCampaignActionSuccess}
        />
      )}

      {/* Reject Campaign Modal */}
      {rejectCampaignModalOpen && (
        <AdminRejectCampaignModal
          open={rejectCampaignModalOpen}
          campaign={campaign}
          onClose={() => setRejectCampaignModalOpen(false)}
          onSuccess={handleCampaignActionSuccess}
        />
      )}
    </Modal>
  );
}
