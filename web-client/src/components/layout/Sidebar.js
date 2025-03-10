// src/components/layout/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Event Planner</h2>
      </div>

      <div className="sidebar-menu">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <i className="dashboard-icon"></i>
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/events" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <i className="events-icon"></i>
          <span>Events</span>
        </NavLink>
        
        <NavLink to="/guests" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <i className="guests-icon"></i>
          <span>Guests</span>
        </NavLink>
        
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <i className="profile-icon"></i>
          <span>Profile</span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;