import { motion } from 'framer-motion';
import Logo from './Logo';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow overflow-hidden"
        >
          <Logo variant="icon" height={64} />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="gradient-text font-semibold text-lg"
        >FundVision</motion.p>
      </div>
    </div>
  );
}
