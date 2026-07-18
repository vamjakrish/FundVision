import { forwardRef } from 'react';

/**
 * Shared Input primitive with optional icon, label and error message.
 * Forward-ref so it works with react-hook-form's register().
 */
export const Input = forwardRef(function Input({ label, error, icon: Icon, className = '', containerClassName = '', ...props }, ref) {
  return (
    <div className={containerClassName}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
        <input
          ref={ref}
          className={`input-field ${Icon ? 'pl-11' : ''} ${error ? 'border-red-400 focus:ring-red-200' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className = '', containerClassName = '', ...props }, ref) {
  return (
    <div className={containerClassName}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <textarea
        ref={ref}
        className={`input-field resize-none ${error ? 'border-red-400 focus:ring-red-200' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, className = '', containerClassName = '', children, ...props }, ref) {
  return (
    <div className={containerClassName}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <select
        ref={ref}
        className={`input-field ${error ? 'border-red-400 focus:ring-red-200' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});
