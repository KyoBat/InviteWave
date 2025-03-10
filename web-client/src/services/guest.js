// src/services/guest.js
import api from './api';

const guestService = {
  // Get all guests
  getGuests: async () => {
    const response = await api.get('/guests');
    return response.data;
  },
  
  // Get guest by ID
  getGuest: async (id) => {
    const response = await api.get(`/guests/${id}`);
    return response.data;
  },
  
  // Create guest
  createGuest: async (guestData) => {
    const response = await api.post('/guests', guestData);
    return response.data;
  },
  
  // Update guest
  updateGuest: async (id, guestData) => {
    const response = await api.put(`/guests/${id}`, guestData);
    return response.data;
  },
  
  // Delete guest
  deleteGuest: async (id) => {
    const response = await api.delete(`/guests/${id}`);
    return response.data;
  },
  
  // Import guests
  importGuests: async (guests) => {
    const response = await api.post('/guests/import', { guests });
    return response.data;
  }
};

export default guestService;