import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import { getSocket } from '../services/socket';
import useAuthStore from '../context/authStore';

/**
 * Subscribes to the `new_notification` socket event for the logged-in user
 * and keeps the ['notifications'] react-query cache fresh in real time.
 * Mount this once near the root of the authenticated app (Layout).
 */
export default function useNotificationSocket() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.custom((t) => (
        <div
          className={`flex items-start gap-3 max-w-sm w-full bg-white shadow-card-hover rounded-2xl p-3.5 border border-slate-100 transition-opacity ${t.visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{notification.title}</p>
            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notification.message}</p>
          </div>
        </div>
      ), { duration: 4500 });
    };

    socket.on('new_notification', handleNewNotification);
    return () => socket.off('new_notification', handleNewNotification);
  }, [user, queryClient]);
}
