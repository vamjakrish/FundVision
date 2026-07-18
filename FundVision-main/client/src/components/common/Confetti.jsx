import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#22C55E', '#EF4444', '#34D399'];

export default function Confetti({ show, count = 36 }) {
  const pieces = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 320,
    rotate: Math.random() * 540 - 270,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 6,
    delay: Math.random() * 0.25,
    shape: Math.random() > 0.5 ? '50%' : '2px',
  })), [count, show]);

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/3"
              style={{ width: p.size, height: p.size, background: p.color, borderRadius: p.shape }}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, x: p.x, y: 220 + Math.random() * 80, rotate: p.rotate }}
              transition={{ duration: 1.4, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
