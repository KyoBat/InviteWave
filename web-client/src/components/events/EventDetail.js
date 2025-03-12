// src/components/events/EventDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { eventService } from '../../services';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import GiftManagement from '../gifts/GiftManagement';

const EventDetail = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventService.getEvent(id);
        setEvent(data);
      } catch (error) {
        setError('Failed to load event details');
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);
  
  const handleDelete = async () => {
    try {
      setLoading(true);
      await eventService.deleteEvent(id);
      navigate('/events');
    } catch (error) {
      setError('Failed to delete event');
      console.error('Error deleting event:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!event) {
    return <div className="not-found">Event not found</div>;
  }
  
  // Format date and time
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');
  
  // Assume organizer is current user (adapt according to your application logic)
  const isOrganizer = true;
  
  return (
    <div className="event-detail-container">
      <div className="event-detail-header">
        <h2>{event.name}</h2>
        
        <div className="event-actions">
          <Link to={`/events/${id}/edit`} className="edit-button">
            Edit Event
          </Link>
          <button 
            className="delete-button"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Event
          </button>
        </div>
      </div>
      
      <Tabs>
        <TabList>
          <Tab>Details</Tab>
          <Tab>Guests</Tab>
          <Tab>Invitations</Tab>
          <Tab>Gifts</Tab>
        </TabList>
        
        <TabPanel>
          <div className="event-detail-content">
            <div className="event-detail-main">
              <div className="event-cover">
                {event.coverImage ? (
                  <img src={event.coverImage} alt={event.name} />
                ) : (
                  <div className="event-no-image">
                    <span>{event.name.substring(0, 7).toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              <div className="event-info">
                <div className="event-info-item">
                  <i className="calendar-icon"></i>
                  <div>
                    <strong>Date</strong>
                    <p>{formattedDate}</p>
                  </div>
                </div>
                
                <div className="event-info-item">
                  <i className="clock-icon"></i>
                  <div>
                    <strong>Time</strong>
                    <p>{formattedTime}</p>
                  </div>
                </div>
                
                <div className="event-info-item">
                  <i className="location-icon"></i>
                  <div>
                    <strong>Location</strong>
                    <p>{event.location.address}</p>
                  </div>
                </div>
                
                {event.theme && (
                  <div className="event-info-item">
                    <i className="theme-icon"></i>
                    <div>
                      <strong>Theme</strong>
                      <p>{event.theme}</p>
                    </div>
                  </div>
                )}
                
                <div className="event-info-item">
                  <i className="status-icon"></i>
                  <div>
                    <strong>Status</strong>
                    <p>
                      <span className={`status-badge status-badge-${event.status}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {event.description && (
                <div className="event-description">
                  <h3>Description</h3>
                  <p>{event.description}</p>
                </div>
              )}
            </div>
            
            <div className="event-detail-sidebar">
              <div className="invitation-actions">
                <h3>Invitations</h3>
                <Link to={`/events/${id}/invitations`} className="button-primary">
                  Manage Invitations
                </Link>
                <Link to={`/events/${id}/guests`} className="button-secondary">
                  Manage Guests
                </Link>
              </div>
              
              <div className="quick-stats">
                <h3>Quick Stats</h3>
                <div className="stats-placeholder">
                  <p>Visit the invitations page for detailed statistics</p>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="guests-tab-content">
            <p>Guest tab content to be implemented</p>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="invitations-tab-content">
            <p>Invitations tab content to be implemented</p>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="event-detail-section">
            <h2>Gift List</h2>
          </div>
          <GiftManagement isOrganizer={isOrganizer} enableReordering={isOrganizer} eventId={id} />
        </TabPanel>
      </Tabs>
      
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Event</h3>
            <p>Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;