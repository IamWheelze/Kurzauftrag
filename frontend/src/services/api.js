import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const authAPI = {
  googleLogin: () => `${API_URL}/api/auth/google`,
  getMe: () => api.get('/api/auth/me'),
};

export const tasksAPI = {
  getAll: (params) => api.get('/api/tasks', { params }),
  getOne: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post('/api/tasks', data),
  accept: (id) => api.post(`/api/tasks/${id}/accept`),
  complete: (id) => api.post(`/api/tasks/${id}/complete`),
  delete: (id) => api.delete(`/api/tasks/${id}`),
};

export const elderlyAPI = {
  getAll: (params) => api.get('/api/elderly', { params }),
  create: (data) => api.post('/api/elderly', data),
  accept: (id) => api.post(`/api/elderly/${id}/accept`),
  checkIn: (id) => api.post(`/api/elderly/${id}/checkin`),
};

export const forumAPI = {
  getPosts: (params) => api.get('/api/forum/posts', { params }),
  getPost: (id) => api.get(`/api/forum/posts/${id}`),
  createPost: (data) => api.post('/api/forum/posts', data),
  addComment: (postId, data) => api.post(`/api/forum/posts/${postId}/comments`, data),
  likePost: (id) => api.post(`/api/forum/posts/${id}/like`),
};

export const donationsAPI = {
  getAll: (params) => api.get('/api/donations', { params }),
  create: (data) => api.post('/api/donations', data),
  claim: (id) => api.post(`/api/donations/${id}/claim`),
  delete: (id) => api.delete(`/api/donations/${id}`),
};

export const jobsAPI = {
  getAll: (params) => api.get('/api/jobs', { params }),
  create: (data) => api.post('/api/jobs', data),
  apply: (id) => api.post(`/api/jobs/${id}/apply`),
  complete: (id) => api.post(`/api/jobs/${id}/complete`),
};

export const businessesAPI = {
  getAll: (params) => api.get('/api/businesses', { params }),
  create: (data) => api.post('/api/businesses', data),
  update: (id, data) => api.put(`/api/businesses/${id}`, data),
};

export const creditsAPI = {
  getBalance: () => api.get('/api/credits/balance'),
  getTransactions: () => api.get('/api/credits/transactions'),
  transfer: (data) => api.post('/api/credits/transfer', data),
  getLeaderboard: () => api.get('/api/credits/leaderboard'),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/api/notifications', { params }),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/api/notifications/unread/count'),
};

export const calendarAPI = {
  getEvents: (params) => api.get('/api/calendar/events', { params }),
  getHolidays: (params) => api.get('/api/calendar/holidays', { params }),
  getUpcomingHolidays: (params) => api.get('/api/calendar/holidays/upcoming', { params }),
  syncGoogle: () => api.post('/api/calendar/sync/google'),
  createEvent: (data) => api.post('/api/calendar/events', data),
};

export const ratingsAPI = {
  getUserRatings: (userId) => api.get(`/api/ratings/user/${userId}`),
  create: (data) => api.post('/api/ratings', data),
  markHelpful: (id) => api.post(`/api/ratings/${id}/helpful`),
};

export const feedbackAPI = {
  submit: (data) => api.post('/api/feedback', data),
  getMyFeedback: () => api.get('/api/feedback/my-feedback'),
};

export default api;
