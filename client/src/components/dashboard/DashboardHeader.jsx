import { motion } from 'framer-motion';

/**
 * Glassmorphism gradient banner used at the top of every dashboard.
 * Keeps a consistent "premium SaaS" first impression across Admin/Donor/Org.
 */
export default function DashboardHeader({ eyebrow, title, subtitle, action, badges }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="relative rounded-2xl sm:rounded-3xl bg-gradient-brand overflow-hidden p-5 sm:p-8 mb-5 sm:mb-8"
    >
      <div className="absolute top-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-white/10 rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full translate-y-16 -translate-x-16 pointer-events-none" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-white/70 text-xs sm:text-sm font-medium mb-1.5">{eyebrow}</p>}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-white/80 text-sm mt-1.5 max-w-xl">{subtitle}</p>}
          {badges && <div className="flex flex-wrap gap-2 mt-3">{badges}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}
