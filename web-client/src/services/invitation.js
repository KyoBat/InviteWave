// src/services/invitation.js
import api from './api';

const invitationService = {
  // Get all invitations for an event
  getEventInvitations: async (eventId) => {
    const response = await api.get(`/api/events/${eventId}/invitations`);
    return response.data;
  },
  
  // Create invitations for an event
  createInvitations: async (eventId, invitationData) => {
    const response = await api.post(`/api/events/${eventId}/invitations`, invitationData);
    return response.data;
  },
  
  // Send invitations
  sendInvitations: async (eventId, invitationIds) => {
    const response = await api.post(`/api/events/${eventId}/invitations/send`, { invitationIds });
    return response.data;
  },
   // Renvoyer une invitation spécifique
   resendInvitation: async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/resend`);
    return response.data;
  },
  // Get public invitation by code
  getInvitationByCode: async (code) => {
    const response = await api.get(`/api/invitations/${code}`);
    return response.data;
  },
  
  // Obtenir les statistiques d'invitation pour un événement
  getInvitationStats: async (eventId) => {
    const response = await api.get(`/events/${eventId}/invitations/stats`);
    return response.data;
  },
  // Respond to invitation
  respondToInvitation: async (code, responseData) => {
    const response = await api.put(`/api/invitations/${code}/respond`, responseData);
    return response.data;
  }
};

export default invitationService;