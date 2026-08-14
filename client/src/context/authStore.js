import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      token: null,
      refreshToken: null,
      isLoading: false,

      setAuth: ({ user, organization, token, refreshToken }) => {
        set({ user, organization, token: token || get().token, refreshToken: refreshToken || get().refreshToken });
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      updateUser: (userData) => set(state => ({ user: { ...state.user, ...userData } })),
      updateOrg: (orgData) => set(state => ({ organization: { ...state.organization, ...orgData } })),

      logout: () => {
        set({ user: null, organization: null, token: null, refreshToken: null });
        delete api.defaults.headers.common['Authorization'];
      },

      initialize: () => {
        const { token } = get();
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin: () => get().user?.role === 'admin',
      isOrganization: () => get().user?.role === 'organization',
      isDonor: () => get().user?.role === 'donor',
    }),
    {
      name: 'fundvision-auth',
      partialize: (state) => ({ user: state.user, organization: state.organization, token: state.token, refreshToken: state.refreshToken })
    }
  )
);

export default useAuthStore;
