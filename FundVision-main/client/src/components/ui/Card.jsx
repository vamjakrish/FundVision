import { motion } from 'framer-motion';

/**
 * Shared Card primitive.
 * variant: 'default' | 'glass' | 'flat' | 'gradient'
 * hover: enables lift-on-hover micro-interaction
 */
export default function Card({ variant = 'default', hover = false, padding = 'p-5 sm:p-6', className = '', children, ...props }) {
  const base = {
    default: 'bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-card',
    glass: 'glass rounded-2xl',
    flat: 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800',
    gradient: 'bg-gradient-brand text-white rounded-2xl shadow-card',
  }[variant];

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`${base} ${padding} hover:shadow-card-hover transition-shadow duration-300 overflow-hidden ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${base} ${padding} overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
}
