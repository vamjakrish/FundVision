import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h3>
      {description && <p className="text-slate-500 text-sm mt-1.5 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-5">{actionLabel}</Button>
      )}
    </motion.div>
  );
}
