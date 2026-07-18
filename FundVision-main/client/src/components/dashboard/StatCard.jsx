import { motion } from 'framer-motion';

/**
 * Premium analytics stat tile used across Admin/Donor/Org dashboards.
 * variant 'glass' renders on dark/gradient backgrounds; 'light' on white page backgrounds.
 */
export default function StatCard({ icon: Icon, label, value, color = 'text-primary', bg = 'bg-primary-50', delay = 0, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0"
    >
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-slate-500 text-xs sm:text-sm truncate">{label}</p>
          {trend && <span className={`text-[10px] font-semibold shrink-0 ${trend.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>{trend}</span>}
        </div>
      </div>
    </motion.div>
  );
}
