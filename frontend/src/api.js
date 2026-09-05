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

// Quotation endpoints (Customer)
export const quotationAPI = {
  getQuotations: () => api.get('/customer/quotations'),
  getQuotation: (quotationId) => api.get(`/customer/quotations/${quotationId}`),
  requestDiscount: (quotationId, data) => api.post(`/customer/quotations/${quotationId}/discount-request`, data),
  acceptQuotation: (quotationId) => api.post(`/customer/quotations/${quotationId}/accept`)
};

// Salesperson Auth endpoints
export const salespersonAuthAPI = {
  register: (data) => api.post('/auth/salesperson/register', data),
  login: (data) => api.post('/auth/salesperson/login', data),
  logout: () => api.post('/auth/salesperson/logout')
};

// Salesperson endpoints
export const salespersonAPI = {
  getDashboard: () => api.get('/salesperson/dashboard'),
  getRequests: () => api.get('/salesperson/requests'),
  getRequest: (requestId) => api.get(`/salesperson/requests/${requestId}`),
  createQuotation: (requestId, data) => api.post(`/salesperson/requests/${requestId}/quotation`, data),
  getQuotations: () => api.get('/salesperson/quotations'),
  getQuotation: (quotationId) => api.get(`/salesperson/quotations/${quotationId}`),
  sendQuotation: (quotationId) => api.post(`/salesperson/quotations/${quotationId}/send`),
  updateQuotation: (quotationId, data) => api.patch(`/salesperson/quotations/${quotationId}`, data),
  getDiscountRequests: () => api.get('/salesperson/discount-requests'),
  approveDiscount: (requestId, data) => api.post(`/salesperson/discount-requests/${requestId}/approve`, data),
  rejectDiscount: (requestId, data) => api.post(`/salesperson/discount-requests/${requestId}/reject`, data),
  counterOfferDiscount: (requestId, data) => api.post(`/salesperson/discount-requests/${requestId}/counter-offer`, data)
};

// Manager Auth endpoints
export const managerAuthAPI = {
  register: (data) => api.post('/auth/manager/register', data),
  login: (data) => api.post('/auth/manager/login', data),
  logout: () => api.post('/auth/manager/logout')
};

// Manager endpoints (to be implemented)
export const managerAPI = {
  getDashboard: () => api.get('/manager/dashboard'),
  getApprovalRequests: () => api.get('/manager/approval-requests'),
  getApprovalRequest: (requestId) => api.get(`/manager/approval-requests/${requestId}`),
  approveDis count: (requestId, data) => api.post(`/manager/discount-requests/${requestId}/approve`, data),
  rejectDiscount: (requestId, data) => api.post(`/manager/discount-requests/${requestId}/reject`, data)
};

export default api;
