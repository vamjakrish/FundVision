import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard, CheckCheck } from 'lucide-react';
import useAuthStore from '../../context/authStore';
import { notificationAPI } from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Badge } from '../ui';
import Logo from '../common/Logo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll({ limit: 6 }).then(r => r.data),
    enabled: !!user,
    refetchInterval: 60000 // socket pushes real-time updates; this is just a safety-net refresh
  });

  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      try {
        await notificationAPI.markRead(n._id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch { /* noop */ }
    }
    setNotifOpen(false);
    if (n.data?.campaignId) navigate(`/campaigns/${n.data.campaignId}`);
    else navigate('/notifications');
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAllRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch { /* noop */ }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [navigate]);

  const handleLogout = () => { logout(); navigate('/'); setUserMenuOpen(false); setMobileOpen(false); };

  const navLinks = [
    { to: '/campaigns', label: 'Campaigns' },
    { to: '/ledger', label: 'Ledger' },
    { to: '/about', label: 'About' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass border-b border-slate-200/60 ${scrolled ? 'shadow-glass py-2' : 'py-3'}`}
      initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
    >
      <div className="section-container">
        <nav className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo variant="icon" height={34} className="sm:hidden" />
            <Logo variant="full" height={34} className="hidden sm:block nav-logo-text" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `nav-link px-3 py-2 rounded-lg text-sm ${isActive ? 'text-primary bg-primary/5 font-semibold' : ''}`}
              >{l.label}</NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2" ref={menuRef}>
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifOpen(p => !p); setUserMenuOpen(false); }}
                    className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-slate-600" />
                    {notifData?.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {notifData.unreadCount > 9 ? '9+' : notifData.unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 glass rounded-2xl shadow-card-hover overflow-hidden"
                      >
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                          {notifData?.unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                            </button>
                          )}
                        </div>
                        <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                          {notifData?.data?.length > 0 ? notifData.data.map(n => (
                            <button
                              key={n._id}
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                            >
                              <p className="text-sm font-medium text-slate-800 line-clamp-1">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </button>
                          )) : (
                            <p className="p-4 text-sm text-slate-400 text-center">No notifications</p>
                          )}
                        </div>
                        <Link
                          to="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="block text-center p-2.5 text-xs font-semibold text-primary hover:bg-slate-50 border-t border-slate-100"
                        >
                          View all notifications
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => { setUserMenuOpen(p => !p); setNotifOpen(false); }}
                    className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
                      {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-48 glass rounded-2xl shadow-card-hover overflow-hidden"
                      >
                        <div className="p-3 border-b border-slate-100">
                          <p className="font-semibold text-slate-800 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <Badge tone="primary" className="mt-1 capitalize">{user.role}</Badge>
                        </div>
                        <div className="p-1">
                          {[
                            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                            { to: '/profile', icon: User, label: 'Profile' },
                          ].map(item => (
                            <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">
                              <item.icon className="w-4 h-4" />{item.label}
                            </Link>
                          ))}
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 text-sm">
                            <LogOut className="w-4 h-4" />Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button variant="primary" size="sm">Get Started</Button></Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setMobileOpen(p => !p)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-3 space-y-1 border-t border-slate-200 mt-2">
                {navLinks.map(l => (
                  <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `block px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${isActive ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {l.label}
                  </NavLink>
                ))}
                {user ? (
                  <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/profile" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-secondary text-center text-sm py-2.5">Login</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-center text-sm py-2.5">Register</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}