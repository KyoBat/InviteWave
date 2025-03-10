// src/components/events/EventList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services';
import EventCard from './EventCard';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getEvents();
        setEvents(data);
      } catch (error) {
        setError('Failed to load events. Please try again later.');
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="event-list-container">
      <div className="event-list-header">
        <h2>Your Events</h2>
        <Link to="/events/create" className="create-button">
          Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>You don't have any events yet.</p>
          <Link to="/events/create" className="create-link">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;