// src/components/layout/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventService, guestService } from '../../services';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentGuests, setRecentGuests] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalGuests: 0,
    pendingInvitations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch events
        const events = await eventService.getEvents();
        
        // Get upcoming events (events with date in the future)
        const now = new Date();
        const upcoming = events
          .filter(event => new Date(event.date) > now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3); // Get only 3 upcoming events
        
        setUpcomingEvents(upcoming);
        
        // Fetch guests
        const guests = await guestService.getGuests();
        
        // Get 5 most recent guests
        const recent = [...guests]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        setRecentGuests(recent);
        
        // Calculate stats
        setStats({
          totalEvents: events.length,
          upcomingEvents: events.filter(event => new Date(event.date) > now).length,
          totalGuests: guests.length,
          pendingInvitations: 0 // This would require additional API call
        });
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name || 'User'}!</h1>
        <p>Here's what's happening with your events</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon events-icon"></div>
          <div className="stat-content">
            <h3>Total Events</h3>
            <p className="stat-value">{stats.totalEvents}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon upcoming-icon"></div>
          <div className="stat-content">
            <h3>Upcoming Events</h3>
            <p className="stat-value">{stats.upcomingEvents}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon guests-icon"></div>
          <div className="stat-content">
            <h3>Total Guests</h3>
            <p className="stat-value">{stats.totalGuests}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon invitations-icon"></div>
          <div className="stat-content">
            <h3>Pending Invitations</h3>
            <p className="stat-value">{stats.pendingInvitations}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section upcoming-events">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="view-all-link">View All</Link>
          </div>
          
          <div className="section-content">
            {upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming events</p>
                <Link to="/events/create" className="create-link">Create an event</Link>
              </div>
            ) : (
              <div className="events-grid">
                {upcomingEvents.map(event => (
                  <div key={event._id} className="event-card">
                    <div className="event-card-content">
                      <h3>{event.name}</h3>
                      <p className="event-date">{new Date(event.date).toLocaleDateString()}</p>
                      <p className="event-location">{event.location.address}</p>
                      <Link to={`/events/${event._id}`} className="view-event-link">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-section recent-guests">
          <div className="section-header">
            <h2>Recent Guests</h2>
            <Link to="/guests" className="view-all-link">View All</Link>
          </div>
          
          <div className="section-content">
            {recentGuests.length === 0 ? (
              <div className="empty-state">
                <p>No guests added yet</p>
                <Link to="/guests/create" className="create-link">Add guests</Link>
              </div>
            ) : (
              <div className="recent-guests-list">
                <table className="guests-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGuests.map(guest => (
                      <tr key={guest._id} className="guest-row">
                        <td>{guest.name}</td>
                        <td>{guest.email || '-'}</td>
                        <td>{guest.phone || '-'}</td>
                        <td>
                          <span className={`category-badge category-${guest.category}`}>
                            {guest.category.charAt(0).toUpperCase() + guest.category.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/events/create" className="action-button create-event">
          Create Event
        </Link>
        
        <Link to="/guests/create" className="action-button add-guest">
          Add Guest
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;