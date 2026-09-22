import { useState } from 'react';
import { CheckCircle2, ShieldCheck, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Badge } from '../ui';
import { adminAPI } from '../../services/api';

export default function AdminVerifyCampaignModal({
  open,
  onClose,
  campaign,
  documents = [],
  onSuccess,
}) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campaign) return null;

  const verifiedCount = documents.filter((d) => d.verificationStatus === 'verified').length;
  const pendingCount = documents.filter((d) => d.verificationStatus === 'pending').length;
  const rejectedCount = documents.filter((d) => d.verificationStatus === 'rejected').length;

  const totalUtilization = (campaign.fundUtilization || []).reduce(
    (sum, i) => sum + (Number(i.estimatedAmount) || 0),
    0
  );
  const goalAmount = Number(campaign.goalAmount) || 0;
  const pct = goalAmount > 0 ? Math.round((totalUtilization / goalAmount) * 100) : 0;

  const handleVerify = async () => {
    setIsSubmitting(true);
    try {
      const res = await adminAPI.verifyCampaignStatus(campaign._id, {
        status: 'verified',
        note: note.trim() || 'Campaign and proof documents verified by Administrator',
      });

      if (res.data?.success) {
        toast.success('Campaign verified successfully! 🎉');
        setNote('');
        onClose();
        onSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <ShieldCheck className="w-5 h-5" />
          <span>Verify Campaign Proof of Trust</span>
        </div>
      }
      size="md"
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
            onClick={handleVerify}
            disabled={isSubmitting}
            className="flex-1 !bg-green-600 hover:!bg-green-700"
            icon={CheckCircle2}
            iconPosition="left"
          >
            {isSubmitting ? 'Verifying...' : 'Confirm Verification'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Campaign to Verify
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
            {campaign.title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            By {campaign.organization?.name || 'Organization'}
          </p>
        </div>

        {/* Document Stats Breakdown */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
            Proof Document Status
          </span>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge tone="success">{verifiedCount} Verified</Badge>
            <Badge tone="warning">{pendingCount} Pending</Badge>
            {rejectedCount > 0 && <Badge tone="danger">{rejectedCount} Rejected</Badge>}
            <span className="text-slate-400">({documents.length} total)</span>
          </div>

          {(pendingCount > 0 || rejectedCount > 0) && (
            <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Note: Some individual documents are still unverified or rejected.
              </span>
            </div>
          )}
        </div>

        {/* Fund Plan Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
            Fund Utilization Breakdown
          </span>
          <div className="flex items-center justify-between text-xs">
            <span>
              ₹{totalUtilization.toLocaleString()} of ₹{goalAmount.toLocaleString()} ({pct}%)
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {campaign.fundUtilization?.length || 0} allocation items
            </span>
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Verification Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. All hospital quotations and tax certificates verified against official records."
            className="input-field text-xs resize-none"
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  );
}
