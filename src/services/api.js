import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Error getting token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.log('Network error - backend may be offline');
      error.message = 'No se puede conectar al servidor. Verifica tu conexión.';
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (e) {
        console.log('Error clearing auth:', e);
      }
      // Navigation will be handled by the auth state change
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh'),
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (userId) => api.get(`/users/${userId}`),
  create: (data) => api.post('/users', data),
  update: (userId, data) => api.put(`/users/${userId}`, data),
  delete: (userId) => api.delete(`/users/${userId}`),
  resetPassword: (userId, data) => api.put(`/users/${userId}/reset-password`, data),
};

// Accounts API
export const accountsAPI = {
  getAll: (params) => api.get('/accounts', { params }),
  getById: (accountId) => api.get(`/accounts/${accountId}`),
  create: (data) => api.post('/accounts', data),
  update: (accountId, data) => api.put(`/accounts/${accountId}`, data),
  delete: (accountId) => api.delete(`/accounts/${accountId}`),
  inviteUser: (accountId, data) => api.post(`/accounts/${accountId}/members`, data),
  updateMemberRole: (accountId, userId, data) => api.put(`/accounts/${accountId}/members/${userId}`, data),
  removeMember: (accountId, userId) => api.delete(`/accounts/${accountId}/members/${userId}`),
};

// Movements API
export const movementsAPI = {
  getAll: (accountId, params) => api.get(`/accounts/${accountId}/movements`, { params }),
  getById: (accountId, movementId) => api.get(`/accounts/${accountId}/movements/${movementId}`),
  create: (accountId, data) => api.post(`/accounts/${accountId}/movements`, data),
  update: (accountId, movementId, data) => api.put(`/accounts/${accountId}/movements/${movementId}`, data),
  delete: (accountId, movementId) => api.delete(`/accounts/${accountId}/movements/${movementId}`),
  confirm: (accountId, movementId) => api.put(`/accounts/${accountId}/movements/${movementId}/confirm`),
  bulkCreate: (accountId, data) => api.post(`/accounts/${accountId}/movements/bulk`, data),
};

// Categories API
export const categoriesAPI = {
  getAll: (accountId, params) => api.get(`/accounts/${accountId}/categories`, { params }),
  create: (accountId, data) => api.post(`/accounts/${accountId}/categories`, data),
  update: (accountId, categoryId, data) => api.put(`/accounts/${accountId}/categories/${categoryId}`, data),
  delete: (accountId, categoryId) => api.delete(`/accounts/${accountId}/categories/${categoryId}`),
  getGlobal: (params) => api.get('/categories/global', { params }),
  createGlobal: (data) => api.post('/categories/global', data),
  updateGlobal: (categoryId, data) => api.put(`/categories/global/${categoryId}`, data),
  deleteGlobal: (categoryId) => api.delete(`/categories/global/${categoryId}`),
};

// Tags API
export const tagsAPI = {
  getAll: (accountId) => api.get(`/accounts/${accountId}/tags`),
  getById: (accountId, tagId) => api.get(`/accounts/${accountId}/tags/${tagId}`),
  create: (accountId, data) => api.post(`/accounts/${accountId}/tags`, data),
  update: (accountId, tagId, data) => api.put(`/accounts/${accountId}/tags/${tagId}`, data),
  delete: (accountId, tagId) => api.delete(`/accounts/${accountId}/tags/${tagId}`),
  getMovements: (accountId, tagId) => api.get(`/accounts/${accountId}/tags/${tagId}/movements`),
};

// Documents API
export const documentsAPI = {
  getAll: (accountId, movementId) => api.get(`/accounts/${accountId}/movements/${movementId}/documents`),
  upload: (accountId, movementId, formData) =>
    api.post(`/accounts/${accountId}/movements/${movementId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMultiple: (accountId, movementId, formData) =>
    api.post(`/accounts/${accountId}/movements/${movementId}/documents/multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (accountId, movementId, documentId) =>
    api.delete(`/accounts/${accountId}/movements/${movementId}/documents/${documentId}`),
  download: (documentId) => api.get(`/documents/${documentId}/download`, { responseType: 'blob' }),
};

// Tasks API
export const tasksAPI = {
  // Global tasks (user's own tasks)
  getAll: (params) => api.get('/tasks', { params }),
  getSummary: () => api.get('/tasks/summary'),
  getByList: () => api.get('/tasks/by-list'),
  getById: (taskId) => api.get(`/tasks/${taskId}`),
  create: (data) => api.post('/tasks', data),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  updateStatus: (taskId, data) => api.put(`/tasks/${taskId}/status`, data),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
  // Account-scoped tasks
  getByAccount: (accountId, params) => api.get(`/accounts/${accountId}/tasks`, { params }),
  createForAccount: (accountId, data) => api.post(`/accounts/${accountId}/tasks`, data),
  updateForAccount: (accountId, taskId, data) => api.put(`/accounts/${accountId}/tasks/${taskId}`, data),
  deleteForAccount: (accountId, taskId) => api.delete(`/accounts/${accountId}/tasks/${taskId}`),
};

// Calendar Events API
export const eventsAPI = {
  // Global events (user's own events)
  getAll: (params) => api.get('/events', { params }),
  getUpcoming: (limit) => api.get('/events/upcoming', { params: { limit } }),
  getByDateRange: (fecha_inicio, fecha_fin) =>
    api.get('/events/range', { params: { fecha_inicio, fecha_fin } }),
  getById: (eventId) => api.get(`/events/${eventId}`),
  create: (data) => api.post('/events', data),
  update: (eventId, data) => api.put(`/events/${eventId}`, data),
  delete: (eventId) => api.delete(`/events/${eventId}`),
  createPaymentEvent: (accountId, data) => api.post(`/accounts/${accountId}/payment-events`, data),
  // Account-scoped events
  getByAccount: (accountId, params) => api.get(`/accounts/${accountId}/events`, { params }),
  createForAccount: (accountId, data) => api.post(`/accounts/${accountId}/events`, data),
  updateForAccount: (accountId, eventId, data) => api.put(`/accounts/${accountId}/events/${eventId}`, data),
  deleteForAccount: (accountId, eventId) => api.delete(`/accounts/${accountId}/events/${eventId}`),
};

// Reminders API
export const remindersAPI = {
  // Event-based reminders
  getAll: (eventId) => api.get(`/events/${eventId}/reminders`),
  add: (eventId, data) => api.post(`/events/${eventId}/reminders`, data),
  update: (eventId, reminderId, data) => api.put(`/events/${eventId}/reminders/${reminderId}`, data),
  delete: (eventId, reminderId) => api.delete(`/events/${eventId}/reminders/${reminderId}`),
  // Account-scoped reminders
  getByAccount: (accountId) => api.get(`/accounts/${accountId}/reminders`),
  createForAccount: (accountId, data) => api.post(`/accounts/${accountId}/reminders`, data),
  deleteForAccount: (accountId, reminderId) => api.delete(`/accounts/${accountId}/reminders/${reminderId}`),
  // Get all user reminders (for alarm system)
  getAllUserReminders: () => api.get('/reminders'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (notificationId) => api.delete(`/notifications/${notificationId}`),
  clearAll: () => api.delete('/notifications'),
};

// User Preferences API
export const preferencesAPI = {
  get: () => api.get('/preferences'),
  update: (data) => api.put('/preferences', data),
  getSounds: () => api.get('/preferences/sounds'),
  uploadSound: (formData) => api.post('/preferences/sounds/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteSound: (soundId) => api.delete(`/preferences/sounds/${soundId}`),
};

// Reports API
export const reportsAPI = {
  getTotals: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/totals`, { params }),
  getTotalsByPeriod: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/totals`, { params }),
  getExpensesByCategory: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/expenses-by-category`, { params }),
  getIncomeByCategory: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/income-by-category`, { params }),
  comparePeriods: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/compare-periods`, { params }),
  getTopCategories: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/top-categories`, { params }),
  getIncomeVsExpenses: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/income-vs-expenses`, { params }),
  getNetIncome: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/net-income`, { params }),
  getSpendingByProvider: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/spending-by-provider`, { params }),
  getMonthlyTrends: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/monthly-trends`, { params }),
  getDashboard: (accountId) => api.get(`/accounts/${accountId}/reports/dashboard`),
  getMostExpensiveMonth: (accountId, params) =>
    api.get(`/accounts/${accountId}/reports/most-expensive-month`, { params }),
  getAllAccountsSummary: () => api.get('/admin/reports/all-accounts'),
};

export default api;
