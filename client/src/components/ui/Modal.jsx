import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Mobile-safe modal: scrolls internally on small screens, never overflows viewport,
 * locks body scroll while open, closes on backdrop click or Escape.
 */
export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${widths[size] || widths.md} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-card-hover
              max-h-[90vh] flex flex-col overflow-hidden`}
          >
            {title && (
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate pr-4">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
