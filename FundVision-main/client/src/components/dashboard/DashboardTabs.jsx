import { motion } from 'framer-motion';

/**
 * Horizontally scrollable, mobile-safe tab bar with a sliding active-pill
 * (CRED/Stripe-style) and optional count badges per tab.
 */
export default function DashboardTabs({ tabs, active, onChange, counts = {} }) {
  return (
    <div className="flex gap-1 mb-6 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-xl p-1 border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
      {tabs.map(tab => {
        const isActive = active === tab;
        const count = counts[tab];
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors duration-200 shrink-0
              ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {isActive && (
              <motion.span
                layoutId="dashboard-tab-pill"
                className="absolute inset-0 bg-gradient-brand rounded-lg shadow-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {tab}
              {count > 0 && (
                <span className={`w-5 h-5 text-[10px] font-bold rounded-full inline-flex items-center justify-center ${isActive ? 'bg-white/25 text-white' : 'bg-amber-400 text-white'}`}>
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
