import { useState } from 'react';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button } from '../ui';
import { adminAPI } from '../../services/api';

export function AdminVerifyDocModal({ open, onClose, document: doc, onSuccess }) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!doc) return null;

  const handleVerify = async () => {
    setIsSubmitting(true);
    try {
      const res = await adminAPI.verifyDocument(doc._id, {
        status: 'verified',
        note: note.trim() || 'Document verified by Admin',
      });

      if (res.data?.success) {
        toast.success('Document marked as verified! ✓');
        setNote('');
        onClose();
        onSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify document');
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
          <CheckCircle2 className="w-5 h-5" />
          <span>Verify Document</span>
        </div>
      }
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleVerify}
            disabled={isSubmitting}
            className="flex-1 !bg-green-600 hover:!bg-green-700"
          >
            {isSubmitting ? 'Verifying...' : 'Confirm Verify'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>
          Mark document <strong className="text-slate-900 dark:text-white font-bold">{doc.title}</strong> as verified?
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Admin Note (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Hospital seal and signature validated"
            className="input-field text-xs"
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  );
}

export function AdminRejectDocModal({ open, onClose, document: doc, onSuccess }) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!doc) return null;

  const handleReject = async (e) => {
    e?.preventDefault();

    if (!note || !note.trim()) {
      toast.error('Please provide a reason for rejecting this document');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAPI.verifyDocument(doc._id, {
        status: 'rejected',
        note: note.trim(),
      });

      if (res.data?.success) {
        toast.success('Document marked as rejected');
        setNote('');
        onClose();
        onSuccess?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject document');
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
          <span>Reject Document</span>
        </div>
      }
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleReject}
            disabled={isSubmitting || !note.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleReject} className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>
          Rejecting <strong className="text-slate-900 dark:text-white font-bold">{doc.title}</strong>.
          The organization will be able to see this reason.
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Rejection Reason *
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Estimate document is blurry / illegible or missing doctor's signature..."
            className="input-field text-xs resize-none"
            maxLength={1000}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
