// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService, userService } from '../services';

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const user = await userService.getProfile();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    setError(null);
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      // BUG FIX: Détection et affichage améliorés des erreurs
      const errorMessage = error.response?.data?.message || 
                           error.displayMessage || 
                           'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register
  const register = async (userData) => {
    setError(null);
    try {
      const user = await authService.register(userData);
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // Logout
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Update user
  const updateUser = (user) => {
    setCurrentUser(user);
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;