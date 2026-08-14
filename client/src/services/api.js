import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = JSON.parse(localStorage.getItem('fundvision-auth') || '{}')?.state || {};
        if (refreshToken) {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          original.headers['Authorization'] = `Bearer ${data.token}`;
          // Update store
          const stored = JSON.parse(localStorage.getItem('fundvision-auth') || '{}');
          if (stored.state) {
            stored.state.token = data.token;
            localStorage.setItem('fundvision-auth', JSON.stringify(stored));
          }
          return api(original);
        }
      } catch {
        localStorage.removeItem('fundvision-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getOne: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  addUpdate: (id, data) => api.post(`/campaigns/${id}/updates`, data),
  like: (id) => api.post(`/campaigns/${id}/like`),
  bookmark: (id) => api.post(`/campaigns/${id}/bookmark`),
  share: (id) => api.post(`/campaigns/${id}/share`),
  getMine: () => api.get('/campaigns/my-campaigns'),
  getStats: (id) => api.get(`/campaigns/${id}/stats`),
};

export const donationAPI = {
  createOrder: (data) => api.post('/donations/create-order', data),
  verifyPayment: (data) => api.post('/donations/verify-payment', data),
  getMyDonations: (params) => api.get('/donations/my-donations', { params }),
  getReceipt: (id) => api.get(`/donations/${id}/receipt`),
  getCampaignDonations: (id, params) => api.get(`/donations/campaign/${id}`, { params }),
  getLeaderboard: (params) => api.get('/donations/leaderboard', { params }),
};

export const orgAPI = {
  create: (data) => api.post('/organizations', data),
  getMe: () => api.get('/organizations/me'),
  update: (data) => api.put('/organizations/me', data),
  uploadDocs: (data) => api.post('/organizations/me/documents', data),
  getAnalytics: () => api.get('/organizations/me/analytics'),
  getOne: (id) => api.get(`/organizations/${id}`),
  getAll: (params) => api.get('/organizations', { params }),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  getPendingOrgs: () => api.get('/admin/organizations/pending'),
  verifyOrg: (id, data) => api.put(`/admin/organizations/${id}/verify`, data),
  getPendingCampaigns: () => api.get('/admin/campaigns/pending'),
  approveCampaign: (id, data) => api.put(`/admin/campaigns/${id}/approve`, data),
  featureCampaign: (id) => api.put(`/admin/campaigns/${id}/feature`),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle-status`),
};

export const aiAPI = {
  getSummary: (id) => api.post(`/ai/campaign-summary/${id}`),
  getTrustScore: (id) => api.get(`/ai/trust-score/${id}`),
  search: (query) => api.post('/ai/search', { query }),
  getRecommendations: () => api.get('/ai/recommendations'),
  getImpact: (donationId) => api.post('/ai/impact', { donationId }),
  chat: (message, history) => api.post('/ai/chat', { message, history }),
  checkFraud: (id) => api.post(`/ai/fraud-check/${id}`),
  getInsights: () => api.get('/ai/insights'),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
};

export const uploadAPI = {
  campaignImage: (formData) => api.post('/upload/campaign-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  profileImage: (formData) => api.post('/upload/profile-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  document: (formData) => api.post('/upload/document', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  multiple: (formData) => api.post('/upload/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const blockchainAPI = {
  getStatus: () => api.get('/blockchain/status'),
  verify: () => api.get('/blockchain/verify'),
  getBlocks: (params) => api.get('/blockchain/blocks', { params }),
  getBlock: (blockNumber) => api.get(`/blockchain/block/${blockNumber}`),
  getDonationRecord: (donationId) => api.get(`/blockchain/donation/${donationId}`),
  getMyVerified: () => api.get('/blockchain/my-verified'),
  getAdminStats: () => api.get('/blockchain/admin/stats'),
  getOrgStats: () => api.get('/blockchain/org/stats'),
  retrySync: (donationId) => api.post(`/blockchain/retry/${donationId}`),
};

export default api;
