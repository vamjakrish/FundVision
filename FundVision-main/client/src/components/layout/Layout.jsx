import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import AIChatbot from '../ai/AIChatbot';
import useAuthStore from '../../context/authStore';
import useNotificationSocket from '../../hooks/useNotificationSocket';

export default function Layout() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  useNotificationSocket();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  const noChatbot = ['/login', '/register', '/forgot-password'].includes(pathname);
  const noFooter = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!noFooter && <Footer />}
      {!noChatbot && <AIChatbot />}
    </div>
  );
}
