// src/components/layout/Layout.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Check if current path is a public page (login, register, etc.)
  const isPublicPage = 
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname === '/forgot-password' || 
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/invitation/');
  
  // If it's a public page, render without sidebar
  if (isPublicPage) {
    return (
      <div className="app-container public">
        {!location.pathname.startsWith('/invitation/') && <Navbar />}
        <main className="main-content public">
          {children}
        </main>
      </div>
    );
  }

  // Otherwise, render with sidebar for authenticated pages
  return (
    <div className="app-container">
      <Navbar />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;