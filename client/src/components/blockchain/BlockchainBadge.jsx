import { ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * BlockchainBadge
 * Small inline indicator showing the ledger-sync state of a donation.
 * Links to the in-app blockchain explorer (/ledger) instead of an external
 * block explorer, since FundVision's ledger is a free, self-hosted chain.
 */
export default function BlockchainBadge({ blockchain, size = 'sm' }) {
  if (!blockchain) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (blockchain.isVerified && blockchain.transactionId) {
    return (
      <Link
        to={`/ledger?search=${encodeURIComponent(blockchain.transactionId)}`}
        className={`badge bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors ${sizeClasses}`}
        title={`View block #${blockchain.blockNumber} on the ledger`}
      >
        <ShieldCheck className={iconSize} />
        Blockchain Verified
      </Link>
    );
  }

  if (blockchain.syncStatus === 'failed') {
    return (
      <span className={`badge bg-red-50 text-red-600 border border-red-200 ${sizeClasses}`}>
        <ShieldAlert className={iconSize} />
        Sync Failed
      </span>
    );
  }

  return (
    <span className={`badge bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses}`}>
      <Clock className={iconSize} />
      Verifying...
    </span>
  );
}
