// src/services/api.js
import axios from 'axios';
import config from '../config';
import authService from './auth';

// Create Axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  // BUG FIX: Timeout pour éviter les requêtes infinies
  timeout: 10000
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Si les données sont FormData, supprimez l'en-tête Content-Type
    // pour qu'axios définisse automatiquement le bon type avec boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${config.apiUrl}/auth/refresh-token`, {
          refreshToken
        });

        // Store new tokens
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        authService.setTokens(accessToken, newRefreshToken);

        // Retry original request
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    // BUG FIX: Message d'erreur amélioré
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    error.displayMessage = errorMessage;
    return Promise.reject(error);
  }
);

export default api;