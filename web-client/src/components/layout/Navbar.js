// src/components/layout/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/dashboard">
            <span className="logo-text">Event Planner</span>
          </Link>
        </div>

        {currentUser ? (
          <div className="navbar-menu">
            <ul className="nav-links">
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link to="/events" className="nav-link">Events</Link>
              </li>
              <li className="nav-item">
                <Link to="/guests" className="nav-link">Guests</Link>
              </li>
            </ul>

            <div className="user-menu" onClick={toggleDropdown}>
              <div className="user-avatar">
                {currentUser.profilePicture ? (
                  <img src={currentUser.profilePicture} alt={currentUser.name} />
                ) : (
                  <span>{currentUser.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="user-name">{currentUser.name}</span>
              <i className="dropdown-icon"></i>

              {showDropdown && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                    Profile Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="login-button">Login</Link>
            <Link to="/register" className="register-button">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;