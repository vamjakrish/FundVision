import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell, Check, CheckCheck, Trash2, Gift, Megaphone, ShieldCheck,
  Target, Trophy, AlertTriangle, UserPlus, Star, Info
} from 'lucide-react';
import { notificationAPI } from '../services/api';
import { Container, Button, EmptyState, SkeletonRow } from '../components/ui';

const ICONS = {
  donation_received: Gift,
  campaign_approved: ShieldCheck,
  campaign_rejected: AlertTriangle,
  campaign_update: Megaphone,
  milestone_reached: Target,
  organization_verified: ShieldCheck,
  new_donor: UserPlus,
  campaign_expiring: AlertTriangle,
  fraud_alert: AlertTriangle,
  system_message: Info,
  goal_reached: Trophy,
  new_follower: UserPlus,
  campaign_featured: Star,
};

const TONES = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-amber-100 text-amber-600',
  urgent: 'bg-red-100 text-red-600',
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all | unread

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'full'],
    queryFn: () => notificationAPI.getAll({ limit: 100 }).then(r => r.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'full'] });
  };

  const markRead = async (id) => {
    try { await notificationAPI.markRead(id); invalidate(); } catch { /* noop */ }
  };

  const markAllRead = async () => {
    try { await notificationAPI.markAllRead(); invalidate(); toast.success('All notifications marked as read'); }
    catch { toast.error('Could not update notifications'); }
  };

  const removeOne = async (id) => {
    try { await notificationAPI.delete(id); invalidate(); }
    catch { toast.error('Could not delete notification'); }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
    try { await notificationAPI.clearAll(); invalidate(); toast.success('Notifications cleared'); }
    catch { toast.error('Could not clear notifications'); }
  };

  const list = (data?.data || []).filter(n => filter === 'all' || !n.isRead);

  return (
    <Container className="pt-28 pb-16 sm:pt-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Notifications</h1>
            <p className="text-sm text-slate-500">{data?.unreadCount || 0} unread</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={!data?.unreadCount}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={!list.length} className="text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Clear all
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['all', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-1">{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : list.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="No notifications to show right now." />
        ) : (
          list.map((n, i) => {
            const Icon = ICONS[n.type] || Info;
            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className={`flex items-start gap-3 p-4 hover:bg-slate-50/80 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TONES[n.priority] || TONES.medium}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                    {n.data?.campaignId && (
                      <Link to={`/campaigns/${n.data.campaignId}`} className="text-xs font-semibold text-primary hover:underline">
                        View campaign
                      </Link>
                    )}
                    {!n.isRead && (
                      <button onClick={() => markRead(n._id)} className="text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark read
                      </button>
                    )}
                    <button onClick={() => removeOne(n._id)} className="text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1 ml-auto">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Container>
  );
}
