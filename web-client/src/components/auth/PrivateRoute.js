// src/components/auth/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default PrivateRoute;