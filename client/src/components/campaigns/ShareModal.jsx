import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const WhatsappIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.5 14.4c-.3-.2-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.4-1.8-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.5-.4-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4 0-.1-.2-.2-.4-.3M12 22c-1.6 0-3.2-.4-4.6-1.2L3 22l1.3-4.3C3.5 16.2 3 14.2 3 12 3 6.5 7.5 2 12 2s9 4.5 9 10-4.5 10-9 10" />
  </svg>
);

const LinkedInIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.34 18.34V9.83H5.67v8.51zM7 8.67a1.56 1.56 0 1 0 0-3.11 1.56 1.56 0 0 0 0 3.11m11.34 9.67v-4.7c0-2.52-1.35-3.69-3.15-3.69a2.71 2.71 0 0 0-2.46 1.36v-1.16H10v8.19h2.67v-4.58c0-1.2.23-2.37 1.72-2.37 1.46 0 1.48 1.37 1.48 2.45v4.5z" />
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.5-6.9L4.4 22H1.3l8.1-9.2L1 2h7.3l5 6.4zm-1.2 18h1.7L7.4 4H5.6z" />
  </svg>
);

export default function ShareModal({ open, onClose, url, title, campaignId, onShare }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = `Help "${title}" on FundVision!`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    if (onShare) onShare();
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExternalShare = () => {
    if (onShare) onShare();
  };

  const channels = [
    {
      label: 'WhatsApp',
      icon: WhatsappIcon,
      bg: 'bg-green-500 hover:bg-green-600',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      label: 'LinkedIn',
      icon: LinkedInIcon,
      bg: 'bg-[#0A66C2] hover:bg-[#08529c]',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'Twitter / X',
      icon: XIcon,
      bg: 'bg-slate-900 hover:bg-black',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full sm:max-w-sm rounded-b-none sm:rounded-2xl p-5 sm:p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-800">Share this campaign</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Channel buttons */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {channels.map((c, i) => (
                <motion.a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleExternalShare}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-card transition-colors ${c.bg}`}>
                    <c.icon className="w-5 h-5" />
                  </span>
                  <span className="text-xs text-slate-600 font-medium">{c.label}</span>
                </motion.a>
              ))}
            </div>

            {/* Copy link row */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-slate-500 truncate outline-none min-w-0"
              />
              <button
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-primary text-white hover:bg-primary/90'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
