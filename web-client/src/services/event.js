// src/services/event.js
import api from './api';

const eventService = {
  // Get all events
  getEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  
  // Get event by ID
  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  
  // Create event
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
  
  // Update event
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },
  
  // Delete event
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
  
  // Get event statistics
  getEventStats: async (id) => {
    const response = await api.get(`/events/${id}/stats`);
    return response.data;
  },
  
  // Upload event cover image
  uploadCoverImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/events/upload-cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }
};

export default eventService;