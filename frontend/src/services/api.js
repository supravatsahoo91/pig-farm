import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, fullName) => api.post('/auth/register', { email, password, fullName }),
  logout: () => api.post('/auth/logout'),
};

export const pigsAPI = {
  getAll: (page = 1, limit = 50, filters = {}) =>
    api.get('/pigs', { params: { page, limit, ...filters } }),
  getById: (rfidId) => api.get(`/pigs/${rfidId}`),
  getGenealogy: (rfidId) => api.get(`/pigs/${rfidId}/genealogy`),
  create: (pigData) => api.post('/pigs', pigData),
  update: (rfidId, updates) => api.patch(`/pigs/${rfidId}`, updates),
  delete: (rfidId) => api.delete(`/pigs/${rfidId}`),
};

export const breedingAPI = {
  recordBreeding: (data) => api.post('/breeding', data),
  getHistory: (pigId) => api.get(`/breeding/${pigId}`),
  getOffspring: (pigId) => api.get(`/breeding/${pigId}/offspring`),
  getAncestors: (pigId) => api.get(`/breeding/${pigId}/ancestors`),
};

export const vaccinationAPI = {
  getSchedules: () => api.get('/vaccinations/schedules'),
  getHistory: (pigId) => api.get(`/vaccinations/${pigId}`),
  recordVaccination: (data) => api.post('/vaccinations', data),
  updateVaccination: (vaccinationId, updates) => api.patch(`/vaccinations/${vaccinationId}`, updates),
  getOverdue: () => api.get('/vaccinations/report/overdue'),
};

export const treatmentAPI = {
  getHistory: (pigId) => api.get(`/treatments/${pigId}`),
  recordTreatment: (data) => api.post('/treatments', data),
  updateTreatment: (treatmentId, updates) => api.patch(`/treatments/${treatmentId}`, updates),
  getActive: () => api.get('/treatments/report/active'),
};

export const weightAPI = {
  getHistory: (pigId) => api.get(`/weights/${pigId}/history`),
  getTrend: (pigId) => api.get(`/weights/${pigId}/trend`),
  recordWeight: (data) => api.post('/weights', data),
  bulkRecordWeights: (weights) => api.post('/weights/bulk', { weights }),
};

export const salesAPI = {
  recordSale: (data) => api.post('/sales', data),
  getAll: (page = 1, limit = 50, filters = {}) =>
    api.get('/sales', { params: { page, limit, ...filters } }),
  getSummary: (filters = {}) => api.get('/sales/report/summary', { params: filters }),
};

export const reportsAPI = {
  getVaccinationStatus: () => api.get('/reports/vaccination-status'),
  getGenealogy: () => api.get('/reports/genealogy'),
  getSalesSummary: (filters = {}) => api.get('/reports/sales-summary', { params: filters }),
  getHealthOverview: () => api.get('/reports/health-overview'),
  getWeightAnalysis: () => api.get('/reports/weight-analysis'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getProfile: () => api.get('/users/me/profile'),
  create: (userData) => api.post('/users', userData),
  update: (userId, updates) => api.patch(`/users/${userId}`, updates),
  changePassword: (userId, passwords) => api.post(`/users/${userId}/change-password`, passwords),
  delete: (userId) => api.delete(`/users/${userId}`),
};

export default api;
