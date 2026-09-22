import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-gradient-brand text-white hover:shadow-glow',
  secondary: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-danger text-white hover:bg-red-600',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2',
};

/**
 * Shared Button primitive used across the app.
 * Usage: <Button variant="primary" size="md" loading={isSubmitting} icon={ArrowRight}>Continue</Button>
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, iconPosition = 'right', fullWidth = false, className = '', children, disabled, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap
        transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
        ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md}
        ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </motion.button>
  );
});

export default Button;
