import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Radio } from 'lucide-react';
import { getSocket } from '../../services/socket';

const MAX_ITEMS = 8;

export default function LiveDonationFeed({ className = '', maxItems = MAX_ITEMS, compact = false }) {
  const [feed, setFeed] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDonation = (data) => {
      setFeed((prev) => [{ ...data, _key: `${data.id || Date.now()}-${Math.random()}` }, ...prev].slice(0, maxItems));
    };

    setConnected(socket.connected);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('live_donation', handleDonation);

    return () => {
      socket.off('live_donation', handleDonation);
    };
  }, [maxItems]);

  return (
    <div className={`card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Radio className={`w-4 h-4 ${connected ? 'text-green-500' : 'text-slate-300'}`} />
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Live Donations</h3>
        <span className={`ml-auto flex items-center gap-1.5 text-[10px] font-medium ${connected ? 'text-green-600' : 'text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      <div className={`space-y-2 ${compact ? 'max-h-72' : 'max-h-96'} overflow-y-auto no-scrollbar`}>
        <AnimatePresence initial={false}>
          {feed.length === 0 ? (
            <motion.p key="empty" className="text-xs text-slate-400 text-center py-8">
              Waiting for new donations to roll in…
            </motion.p>
          ) : (
            feed.map((item) => (
              <motion.div
                key={item._key}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <Link
                  to={item.campaignId ? `/campaigns/${item.campaignId}` : '#'}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white shrink-0">
                    <Heart className="w-4 h-4 fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-slate-700 truncate">
                      <span className="font-semibold text-slate-900">{item.donorName || 'Anonymous'}</span> donated{' '}
                      <span className="font-bold text-primary">₹{item.amount?.toLocaleString()}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">to {item.campaignTitle}</p>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
