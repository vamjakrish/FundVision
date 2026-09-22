import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';
import Confetti from '../common/Confetti';

export default function MilestoneTracker({ milestones = [], raisedAmount = 0, goalAmount = 0 }) {
  const [celebrate, setCelebrate] = useState(false);
  const prevAchievedCount = useRef(null);

  const sorted = [...(milestones || [])].sort((a, b) => a.amount - b.amount);
  const achievedCount = sorted.filter(m => m.achieved || raisedAmount >= m.amount).length;

  useEffect(() => {
    if (prevAchievedCount.current !== null && achievedCount > prevAchievedCount.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1600);
      return () => clearTimeout(t);
    }
    prevAchievedCount.current = achievedCount;
  }, [achievedCount]);

  if (!sorted.length) return null;

  return (
    <div className="card p-4 sm:p-5 relative overflow-hidden">
      <Confetti show={celebrate} />
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Milestones</h3>
        <span className="ml-auto text-xs text-slate-400">{achievedCount}/{sorted.length} unlocked</span>
      </div>

      <div className="relative pl-1">
        {/* Connector line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />
        <div className="space-y-5">
          {sorted.map((m, i) => {
            const achieved = m.achieved || raisedAmount >= m.amount;
            const pct = goalAmount > 0 ? Math.min(100, Math.round((m.amount / goalAmount) * 100)) : 0;
            const segProgress = m.amount > 0 ? Math.min(100, Math.round((raisedAmount / m.amount) * 100)) : 0;

            return (
              <div key={i} className="relative flex gap-3 items-start">
                <motion.div
                  initial={false}
                  animate={achieved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                    achieved ? 'bg-gradient-brand border-transparent text-white' : 'bg-white border-slate-200 text-slate-300'
                  }`}
                >
                  {achieved ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                </motion.div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className={`text-sm font-semibold ${achieved ? 'text-slate-800' : 'text-slate-500'}`}>
                      {m.title || `₹${m.amount?.toLocaleString()} Goal`}
                    </p>
                    <span className={`badge text-[10px] ${achieved ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                      ₹{m.amount?.toLocaleString()} · {pct}%
                    </span>
                  </div>
                  {m.description && <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>}
                  {!achieved && (
                    <div className="progress-bar mt-2 h-1.5">
                      <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${segProgress}%` }} transition={{ duration: 0.8 }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
