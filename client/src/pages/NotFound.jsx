import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-8xl mb-6"
        >😕</motion.div>
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Page Not Found</h2>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved. Let's get you back on track.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center gap-2 justify-center"><Home className="w-4 h-4" /> Go Home</Link>
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2 justify-center"><ArrowLeft className="w-4 h-4" /> Go Back</button>
        </div>
      </motion.div>
    </div>
  );
}
