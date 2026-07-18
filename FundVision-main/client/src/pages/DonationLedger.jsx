import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, Search, Layers, TrendingUp, Lock,
  ChevronLeft, ChevronRight, Hash, Clock, Boxes, X, Copy, Check, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { blockchainAPI } from '../services/api';

function CopyableHash({ value, label }) {
  const [copied, setCopied] = useState(false);
  const short = value ? `${value.slice(0, 10)}...${value.slice(-8)}` : '—';

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title={value}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500 hover:text-primary transition-colors group"
    >
      {label && <span className="text-slate-400 font-sans">{label}:</span>}
      <span>{short}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}

export default function DonationLedger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState(null);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const { data: statusRes, isLoading: statusLoading } = useQuery({
    queryKey: ['blockchain-status'],
    queryFn: () => blockchainAPI.getStatus().then(r => r.data),
    refetchInterval: 20000,
  });

  const { data: blocksRes, isLoading: blocksLoading } = useQuery({
    queryKey: ['ledger-blocks', page, debouncedSearch],
    queryFn: () => blockchainAPI.getBlocks({ page, limit: 10, search: debouncedSearch }).then(r => r.data),
    keepPreviousData: true,
  });

  const status = statusRes;
  const blocks = blocksRes?.data || [];
  const pagination = blocksRes?.pagination;

  // If arriving with ?search=TX-xxxx, auto-open that block once loaded
  useEffect(() => {
    const tx = searchParams.get('search');
    if (tx && blocks.length === 1) {
      setSelectedBlock(blocks[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (val) setSearchParams({ search: val });
    else setSearchParams({});
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="section-container py-10 sm:py-16 relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium mb-4">
              <Layers className="w-4 h-4" /> FundVision Donation Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">Blockchain Explorer</h1>
            <p className="text-white/85 max-w-2xl">
              Every donation is permanently chained into an immutable, SHA-256 secured ledger the moment
              it's confirmed. No wallet, no crypto, no gas fees — just complete transparency, free for
              everyone to verify.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-5 sm:mt-8">
            <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5">
              <Boxes className="w-5 h-5 text-white mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">
                {statusLoading ? '—' : status?.totalBlocks ?? 0}
              </p>
              <p className="text-white/70 text-sm">Total Blocks</p>
            </div>
            <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-5">
              <TrendingUp className="w-5 h-5 text-white mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">
                {statusLoading ? '—' : `₹${(status?.totalAmount || 0).toLocaleString()}`}
              </p>
              <p className="text-white/70 text-sm">Total Verified</p>
            </div>
            <div className="glass rounded-2xl p-5 col-span-2 md:col-span-1">
              <Lock className="w-5 h-5 text-white mb-2" />
              <div className="flex items-center gap-2">
                {statusLoading ? (
                  <p className="text-xl sm:text-2xl font-bold text-white">—</p>
                ) : status?.chainValid ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    <p className="text-xl sm:text-2xl font-bold text-white">Valid</p>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-300" />
                    <p className="text-xl sm:text-2xl font-bold text-white">Corrupted</p>
                  </>
                )}
              </div>
              <p className="text-white/70 text-sm">
                {status?.chainValid === false ? `Block #${status.corruptedBlock} flagged` : 'Chain Status'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-container py-6 sm:py-10">
        {status?.chainValid === false && (
          <div className="card p-5 mb-6 border border-red-200 bg-red-50/60 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              Chain integrity check failed at block <span className="font-mono font-semibold">#{status.corruptedBlock}</span>.
              Donation records from this point may have been tampered with.
            </p>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Blocks</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search TX ID, hash, donation or campaign ID..."
              className="input-field pl-9 py-2.5 text-sm"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Blocks table/list */}
        {blocksLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : blocks.length === 0 ? (
          <div className="card p-10 text-center">
            <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No blocks found{search ? ' matching your search' : ' yet'}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((b, i) => (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedBlock(b)}
                className="card p-5 cursor-pointer hover:shadow-lg hover:border-primary/30 border border-transparent transition-all duration-200"
              >
                <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Hash className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">Block #{b.blockNumber}</span>
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.campaignId?.title || 'Campaign'} · {format(new Date(b.timestamp), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="text-right hidden xs:block">
                      <p className="font-bold text-slate-800">₹{b.amount.toLocaleString()}</p>
                      <CopyableHash value={b.transactionId} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Block detail modal */}
      <AnimatePresence>
        {selectedBlock && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedBlock(null)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">Block #{selectedBlock.blockNumber}</h3>
                    <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(selectedBlock.timestamp), 'MMM d, yyyy · h:mm:ss a')}
                  </p>
                </div>
                <button onClick={() => setSelectedBlock(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3">
                <DetailRow label="Transaction ID" value={selectedBlock.transactionId} mono copyable />
                <DetailRow label="Campaign" value={selectedBlock.campaignId?.title || selectedBlock.campaignId?._id || selectedBlock.campaignId} />
                <DetailRow label="Donor" value={selectedBlock.isAnonymous ? 'Anonymous' : (selectedBlock.donorId?.name || 'Registered Donor')} />
                <DetailRow label="Amount" value={`₹${selectedBlock.amount.toLocaleString()}`} highlight />
                <div className="h-px bg-slate-100 my-2" />
                <DetailRow label="Previous Hash" value={selectedBlock.previousHash} mono copyable small />
                <DetailRow label="Current Hash" value={selectedBlock.currentHash} mono copyable small />
              </div>

              <div className="mt-5 p-4 rounded-xl bg-slate-50 text-xs text-slate-500 leading-relaxed">
                This block's hash is mathematically derived from its data plus the previous block's
                hash. Altering any historical donation record would invalidate every subsequent hash —
                making tampering instantly detectable.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value, mono, copyable, highlight, small }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`
            ${mono ? 'font-mono' : ''}
            ${small ? 'text-xs' : 'text-sm'}
            ${highlight ? 'font-bold text-primary text-base' : 'text-slate-700'}
            truncate text-right
          `}
          title={value}
        >
          {mono && value ? `${value.slice(0, 16)}...${value.slice(-12)}` : value}
        </span>
        {copyable && (
          <button onClick={handleCopy} className="shrink-0 text-slate-400 hover:text-primary transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
