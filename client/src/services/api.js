import axios from 'axios';

// client/src/services/api.js
const api = axios.create({
  // Altere esta linha para:
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080', // Ou apenas 'http://localhost:8080' se não usar REACT_APP_API_URL
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o token expirou e não é uma tentativa de renovação
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;

      try {
        // Tentar renovar o token
        const response = await api.post('/auth/refresh');
        const { token } = response.data;
        
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Repetir a requisição original
        return api(originalRequest);
      } catch (refreshError) {
        // Se não conseguir renovar, redirecionar para login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// APIs específicas
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  loginEmployee: (credentials) => api.post('/auth/login-employee', credentials),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getDepartments: () => api.get('/users/departments'),
  getSupervisors: () => api.get('/users/supervisors'),
  getTeam: (supervisorId) => api.get(`/users/team/${supervisorId}`),
};

export const epiTypesAPI = {
  getAll: (params) => api.get('/epi-types', { params }),
  getById: (id) => api.get(`/epi-types/${id}`),
  create: (epiTypeData) => api.post('/epi-types', epiTypeData),
  update: (id, epiTypeData) => api.put(`/epi-types/${id}`, epiTypeData),
  delete: (id) => api.delete(`/epi-types/${id}`),
  getCategories: () => api.get('/epi-types/categories'),
  getExpiringSoon: () => api.get('/epi-types/expiring-soon'),
  getExpired: () => api.get('/epi-types/expired'),
};

export const checklistsAPI = {
  getAll: (params) => api.get('/checklists', { params }),
  getAvailable: () => api.get('/checklists/available'),
  getById: (id) => api.get(`/checklists/${id}`),
  create: (checklistData) => api.post('/checklists', checklistData),
  update: (id, checklistData) => api.put(`/checklists/${id}`, checklistData),
  delete: (id) => api.delete(`/checklists/${id}`),
  approve: (id, notes) => api.post(`/checklists/${id}/approve`, { notes }),
  getTypes: () => api.get('/checklists/types'),
};

export const executionsAPI = {
  getAll: (params) => api.get('/executions', { params }),
  getById: (id) => api.get(`/executions/${id}`),
  create: (executionData) => api.post('/executions', executionData),
  update: (id, executionData) => api.put(`/executions/${id}`, executionData),
  delete: (id) => api.delete(`/executions/${id}`),
  complete: (id, data) => api.post(`/executions/${id}/complete`, data),
  approve: (id, data) => api.post(`/executions/${id}/approve`, data),
  reject: (id, data) => api.post(`/executions/${id}/reject`, data),
  getMyExecutions: (params) => api.get('/executions/my', { params }),
  getTeamExecutions: (params) => api.get('/executions/team', { params }),
};

export const anomaliesAPI = {
  getAll: (params) => api.get('/anomalies', { params }),
  getById: (id) => api.get(`/anomalies/${id}`),
  create: (anomalyData) => api.post('/anomalies', anomalyData),
  update: (id, anomalyData) => api.put(`/anomalies/${id}`, anomalyData),
  delete: (id) => api.delete(`/anomalies/${id}`),
  addAction: (id, actionData) => api.post(`/anomalies/${id}/actions`, actionData),
  resolve: (id, resolutionData) => api.post(`/anomalies/${id}/resolve`, resolutionData),
  close: (id) => api.post(`/anomalies/${id}/close`),
  getMyAnomalies: (params) => api.get('/anomalies/my', { params }),
  getTeamAnomalies: (params) => api.get('/anomalies/team', { params }),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getCompliance: (params) => api.get('/reports/compliance', { params }),
  getAnomalies: (params) => api.get('/reports/anomalies', { params }),
  getExecutions: (params) => api.get('/reports/executions', { params }),
  getEpiStatus: (params) => api.get('/reports/epi-status', { params }),
  exportData: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

export const uploadAPI = {
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/upload/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api; 