import { useState } from 'react';
import { XCircle, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../ui';
import { adminAPI } from '../../services/api';

export default function AdminRejectCampaignModal({
  open,
  onClose,
  campaign,
  onSuccess,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campaign) return null;

  const handleReject = async (e) => {
    e.preventDefault();

    if (!reason || !reason.trim()) {
      toast.error('Please provide a reason for rejecting campaign verification');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAPI.verifyCampaignStatus(campaign._id, {
        status: 'rejected',
        note: reason.trim(),
      });

      if (res.data?.success) {
        toast.success('Campaign verification rejected');
        setReason('');
        onClose();
        onSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject campaign verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <XCircle className="w-5 h-5" />
          <span>Reject Campaign Verification</span>
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
            variant="danger"
            size="sm"
            onClick={handleReject}
            disabled={isSubmitting || !reason.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleReject} className="space-y-4 text-sm">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You are rejecting verification for{' '}
          <strong className="text-slate-900 dark:text-white font-bold">{campaign.title}</strong>.
          The organization will be notified with your feedback.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Rejection Reason / Explanation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explain why the campaign proof of trust could not be verified (e.g. Unverifiable beneficiary documents, fraudulent quotation detected)..."
            className="input-field text-xs resize-none"
            maxLength={1000}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
