import axios from 'axios';

// Base URL (from .env or fallback)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// =========================
// Request Interceptor (JWT)
// =========================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// Auth APIs
// =========================
export const authAPI = {
  // Uses "name" to match backend payload
  signup: (name, email, password) =>
    api.post('/auth/signup', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('token');
  },
};

// =========================
// Transaction APIs
// =========================
export const transactionAPI = {
  addTransaction: (amount, type, category, description, location) =>
    api.post('/transactions', {
      amount,
      type,
      category,
      description,
      location,
    }),

  getTransactions: () =>
    api.get('/transactions'),

  getHighRiskTransactions: () =>
    api.get('/transactions/high-risk'),

  getTrends: () =>
    api.get('/transactions/trends'),
};

// =========================
// Fraud APIs
// =========================
export const fraudAPI = {
  analyzeTransaction: (transactionId) =>
    api.post('/fraud/analyze', { transactionId }),

  getAlerts: () =>
    api.get('/fraud/alerts'),

  updateAlertStatus: (alertId, status) =>
    api.put(`/fraud/alerts/${alertId}`, { status }),

  getRiskProfile: () =>
    api.get('/fraud/risk-profile'),
};

// Export axios instance
export default api;
