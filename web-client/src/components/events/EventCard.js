// src/components/events/EventCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const EventCard = ({ event }) => {
  // Format date and time
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, 'MMMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge-active';
      case 'completed':
        return 'status-badge-completed';
      case 'cancelled':
        return 'status-badge-cancelled';
      default:
        return 'status-badge-active';
    }
  };

  return (
    <div className={`event-card ${event.status === 'completed' ? 'event-completed' : ''}`}>
      <div className="event-card-cover">
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.name} />
        ) : (
          <div className="event-card-no-image">
            <span>{event.name.substring(0, 7).toUpperCase()}</span>
          </div>
        )}
        <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>
      </div>

      <div className="event-card-content">
        <h3>{event.name}</h3>
        
        <div className="event-card-details">
          <div className="event-card-date">
            <i className="calendar-icon"></i>
            <span>{formattedDate}</span>
          </div>
          
          <div className="event-card-time">
            <i className="clock-icon"></i>
            <span>{formattedTime}</span>
          </div>
          
          <div className="event-card-location">
            <i className="location-icon"></i>
            <span>{event.location.address}</span>
          </div>
        </div>

        <div className="event-card-actions">
          <Link to={`/events/${event._id}`} className="view-button">
            View Event
          </Link>
          <Link to={`/events/${event._id}/invitations`} className="invitations-button">
            Invitations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;