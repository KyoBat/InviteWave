// src/services/auth.js
import api from './api';
import config from '../config';

const authService = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens
    authService.setTokens(accessToken, refreshToken);
    
    return user;
  },
  
  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens
    authService.setTokens(accessToken, refreshToken);
    
    return user;
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.refreshTokenKey);
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!authService.getToken();
  },
  
  // Get token from storage
  getToken: () => {
    return localStorage.getItem(config.tokenKey);
  },
  
  // Get refresh token from storage
  getRefreshToken: () => {
    return localStorage.getItem(config.refreshTokenKey);
  },
  
  // Set tokens in storage
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(config.tokenKey, accessToken);
    localStorage.setItem(config.refreshTokenKey, refreshToken);
  },
  
  // Forgot password
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },
  
  // Reset password
  resetPassword: async (token, newPassword) => {
    return await api.post('/auth/reset-password', { token, newPassword });
  }
};

export default authService;