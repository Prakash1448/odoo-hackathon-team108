import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('customer');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout')
};

// Customer endpoints
export const customerAPI = {
  getDashboard: () => api.get('/customer/dashboard'),
  getProfile: () => api.get('/customer/profile'),
  getRequests: () => api.get('/customer/requests'),
  createRequest: (data) => api.post('/customer/requests', data),
  getRequest: (requestId) => api.get(`/customer/requests/${requestId}`)
};

// Quotation endpoints
export const quotationAPI = {
  getQuotations: () => api.get('/quotations'),
  getQuotation: (quotationId) => api.get(`/quotations/${quotationId}`),
  requestDiscount: (quotationId, data) => api.post(`/quotations/${quotationId}/discount-request`, data),
  acceptQuotation: (quotationId) => api.post(`/quotations/${quotationId}/accept`)
};

export default api;
