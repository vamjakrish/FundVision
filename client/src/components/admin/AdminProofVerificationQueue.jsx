import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Building2,
  Eye,
  PieChart,
  RefreshCw,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, Badge, Button, SkeletonRow, EmptyState } from '../ui';
import AdminCampaignReviewModal from './AdminCampaignReviewModal';

const FILTER_OPTIONS = [
  { value: 'pending', label: 'Pending & Review' },
  { value: 'all', label: 'All Statuses' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'more_info_required', label: 'More Info Required' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const VERIFY_STATUS_CONFIG = {
  verified: { tone: 'success', label: 'Verified', icon: CheckCircle2 },
  pending: { tone: 'warning', label: 'Pending Review', icon: Clock },
  under_review: { tone: 'primary', label: 'Under Review', icon: Clock },
  more_info_required: { tone: 'warning', label: 'Action Required', icon: AlertTriangle },
  rejected: { tone: 'danger', label: 'Rejected', icon: XCircle },
  suspended: { tone: 'danger', label: 'Suspended', icon: XCircle },
  not_submitted: { tone: 'slate', label: 'Not Submitted', icon: HelpCircle },
};

export default function AdminProofVerificationQueue() {
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const {
    data: queueRes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-verification-queue', filterStatus, searchQuery],
    queryFn: () =>
      adminAPI
        .getVerificationQueue({
          status: filterStatus === 'pending' ? undefined : filterStatus,
          search: searchQuery.trim() || undefined,
        })
        .then((r) => r.data),
    staleTime: 30000,
  });

  const campaigns = queueRes?.data || [];

  return (
    <Card padding="p-5 sm:p-7" className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Campaign Proof of Trust Verification Queue ({campaigns.length})
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review supporting documents, fund utilization breakdowns, and verify campaign authenticity.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaign or NGO..."
              className="input-field !py-2 !pl-9 text-xs w-full"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            icon={RefreshCw}
            className="shrink-0"
            title="Refresh Queue"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilterStatus(opt.value)}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all ${
              filterStatus === opt.value
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Campaign Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : campaigns.length > 0 ? (
          campaigns.map((camp) => {
            const vStatus = camp.verificationStatus || 'not_submitted';
            const statusCfg = VERIFY_STATUS_CONFIG[vStatus] || VERIFY_STATUS_CONFIG.not_submitted;
            const StatusIcon = statusCfg.icon;

            const totalUtilization = (camp.fundUtilization || []).reduce(
              (sum, i) => sum + (Number(i.estimatedAmount) || 0),
              0
            );
            const goalAmount = Number(camp.goalAmount) || 0;
            const pct = goalAmount > 0 ? Math.round((totalUtilization / goalAmount) * 100) : 0;

            return (
              <div
                key={camp._id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/40 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                  {/* Left: Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-brand text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                      {camp.images?.[0]?.url ? (
                        <img src={camp.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        camp.title?.[0] || '📋'
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {camp.title}
                        </h4>
                        <Badge tone="primary">{camp.category}</Badge>
                        <Badge tone={statusCfg.tone} icon={StatusIcon}>
                          {statusCfg.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {camp.organization?.name || 'Organization'}
                          {camp.organization?.isVerified && (
                            <span className="text-green-600 font-bold" title="Verified NGO">✓</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>Goal: <strong>₹{goalAmount.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>
                          Plan: <strong>₹{totalUtilization.toLocaleString()}</strong> ({pct}%)
                        </span>
                        <span>•</span>
                        <span>{camp.fundUtilization?.length || 0} allocation items</span>
                      </div>

                      {camp.verificationFeedback && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40 line-clamp-2">
                          <strong>Latest Feedback:</strong> {camp.verificationFeedback}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Review Action */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedCampaignId(camp._id)}
                      icon={ShieldCheck}
                      iconPosition="left"
                    >
                      Review Evidence
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title="Verification Queue Clean"
            description={
              filterStatus === 'pending'
                ? 'No campaigns are currently waiting for proof verification review.'
                : 'No campaigns found matching the selected filter criteria.'
            }
          />
        )}
      </div>

      {/* Full Campaign Proof Review Modal */}
      {selectedCampaignId && (
        <AdminCampaignReviewModal
          campaignId={selectedCampaignId}
          open={!!selectedCampaignId}
          onClose={() => setSelectedCampaignId(null)}
          onRefreshQueue={refetch}
        />
      )}
    </Card>
  );
}
