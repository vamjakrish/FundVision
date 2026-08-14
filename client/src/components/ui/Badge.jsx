const TONES = {
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  secondary: 'bg-secondary-50 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

/**
 * Small pill badge. Pass an `icon` (lucide component) for an icon+label badge.
 */
export default function Badge({ tone = 'slate', icon: Icon, className = '', children }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.slate} ${className}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
