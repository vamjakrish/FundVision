import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Crown, Medal, Award, Trophy } from 'lucide-react';
import { donationAPI } from '../../services/api';

const RANK_STYLES = {
  1: { icon: Crown, ring: 'ring-amber-400', bg: 'bg-gradient-to-br from-amber-300 to-amber-500', text: 'text-amber-600' },
  2: { icon: Medal, ring: 'ring-slate-300', bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-slate-500' },
  3: { icon: Award, ring: 'ring-orange-400', bg: 'bg-gradient-to-br from-orange-300 to-orange-500', text: 'text-orange-600' },
};

function RankBadge({ rank }) {
  const style = RANK_STYLES[rank];
  if (!style) {
    return <span className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-bold shrink-0">{rank}</span>;
  }
  const Icon = style.icon;
  return (
    <span className={`w-7 h-7 flex items-center justify-center rounded-full ${style.bg} text-white shrink-0 shadow-sm`}>
      <Icon className="w-3.5 h-3.5" />
    </span>
  );
}

export default function DonorLeaderboard({ period = 'all', limit = 10, className = '' }) {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period, limit],
    queryFn: () => donationAPI.getLeaderboard({ period, limit }).then(r => r.data),
  });

  const donors = data?.data || [];

  return (
    <div className={`card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Top Donors</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
        </div>
      ) : donors.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No donations yet — be the first!</p>
      ) : (
        <div className="space-y-2">
          {donors.map((d, i) => {
            const rank = i + 1;
            const style = RANK_STYLES[rank];
            return (
              <motion.div
                key={d.userId || i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-colors ${
                  style ? 'bg-gradient-to-r from-primary/5 to-secondary-500/5 ring-1 ' + style.ring : 'hover:bg-slate-50'
                }`}
              >
                <RankBadge rank={rank} />
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-xs ${style ? style.bg : 'bg-gradient-brand'}`}>
                  {d.avatar ? <img src={d.avatar} alt="" className="w-full h-full object-cover" /> : d.name?.[0] || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{d.name}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">{d.donationCount} donation{d.donationCount !== 1 ? 's' : ''}</p>
                </div>
                <span className={`font-bold text-xs sm:text-sm shrink-0 ${style ? style.text : 'text-slate-700'}`}>
                  ₹{d.totalDonated?.toLocaleString()}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
