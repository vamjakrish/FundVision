import { io } from 'socket.io-client';

let socket = null;

const rawSocketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'https://fundvision-8d1c.onrender.com');

export const SOCKET_URL = rawSocketUrl.replace(/\/+$/, '');

export const initSocket = (token) => {
  if (socket) {
    if (token) {
      socket.auth = { token };
    }
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    withCredentials: true,
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    try {
      const stored = JSON.parse(localStorage.getItem('fundvision-auth') || '{}');
      const token = stored?.state?.token;
      return initSocket(token);
    } catch {
      return initSocket();
    }
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCampaign = (campaignId) => socket?.emit('join_campaign', campaignId);
export const leaveCampaign = (campaignId) => socket?.emit('leave_campaign', campaignId);
