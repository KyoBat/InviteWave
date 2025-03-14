// web-client/src/services/gift.js
import api from './api';
import config from '../config';

/**
 * Get all gift items for an event (simplified version)
 * @param {string} eventId - Event ID
 * @returns {Promise} - Promise with response data
 */
export const getGiftItems = async (eventId) => {
  console.log(`API Call: GET /events/${eventId}/gifts`);
  return await api.get(`/events/${eventId}/gifts`);
};

/**
 * Get all gift items for an event with additional parameters
 * @param {string} eventId - Event ID
 * @param {Object} params - Query parameters (status, guestId)
 * @returns {Promise} - Promise with response data
 */
export const getAllGifts = async (eventId, params = {}) => {
  const url = `/events/${eventId}/gifts`;
  console.log('Sending request to:', url);
  console.log('URL GetALLgift:', { params } );
  return await api.get(`/events/${eventId}/gifts`, { params });
};

/**
 * Get a specific gift item
 * @param {string} eventId - Event ID
 * @param {string} giftId - Gift ID
 * @param {Object} params - Query parameters (guestId)
 * @returns {Promise} - Promise with response data
 */
export const getGiftById = async (eventId, giftId, params = {}) => {
  return api.get(`/events/${eventId}/gifts/${giftId}`, { params });
};

/**
 * Create a new gift item
 * @param {string} eventId - Event ID
 * @param {Object} giftData - Gift data
 * @returns {Promise} - Promise with response data
 */
//export const createGift = async (eventId, giftData) => {
//  console.log(`Sending request to: /events/${eventId}/gifts`);
//  console.log('URL complète:', `${config.apiUrl}/events/${eventId}/gifts`);
//  return api.post(`/events/${eventId}/gifts`, giftData);
//}

/*export const createGift = async (eventId, giftData) => {
  const url = `/events/${eventId}/gifts`;
  console.log('Sending request to:', url);
  console.log('URL pzrtirll:', config.apiUrl );
  console.log('URL complète:', config.apiUrl + url);
  return api.post(url, giftData);
};*/

export const createGift = async (eventId, formData) => {
  return api.post(`/events/${eventId}/gifts`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important pour les fichiers
    },
  });
};
/**
 * Update an existing gift item
 * @param {string} eventId - Event ID
 * @param {string} giftId - Gift ID
 * @param {Object} giftData - Updated gift data
 * @returns {Promise} - Promise with response data
 */
/*export const updateGift = async (eventId, giftId, giftData) => {
  return api.put(`/events/${eventId}/gifts/${giftId}`, giftData);
};*/

export const updateGift = async (eventId, giftId, formData) => {
  return api.put(`/events/${eventId}/gifts/${giftId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important pour les fichiers
    },
  });
};

/**
 * Delete a gift item
 * @param {string} eventId - Event ID
 * @param {string} giftId - Gift ID
 * @returns {Promise} - Promise with response data
 */
export const deleteGift = async (eventId, giftId) => {
  return api.delete(`/events/${eventId}/gifts/${giftId}`);
};

/**
 * Reserve a gift item
 * @param {string} eventId - Event ID
 * @param {string} giftId - Gift ID
 * @param {Object} assignData - Reservation data {guestId, quantity, message}
 * @returns {Promise} - Promise with response data
 */
export const assignGift = async (eventId, giftId, assignData) => {
  return api.post(`/events/${eventId}/gifts/${giftId}/assign`, assignData);
};

/**
 * Cancel a gift item reservation
 * @param {string} eventId - Event ID
 * @param {string} giftId - Gift ID
 * @param {string} guestId - Guest ID
 * @returns {Promise} - Promise with response data
 */
export const unassignGift = async (eventId, giftId, guestId) => {
  return api.post(`/events/${eventId}/gifts/${giftId}/unassign`, { guestId });
};

/**
 * Reorder gift items
 * @param {string} eventId - Event ID
 * @param {Array} items - Array of objects {id, order}
 * @returns {Promise} - Promise with response data
 */
export const reorderGifts = async (eventId, items) => {
  return api.put(`/events/${eventId}/gifts/reorder`, { items });
};

/**
 * Get a guest's reservations
 * @param {string} eventId - Event ID
 * @param {string} guestId - Guest ID
 * @returns {Promise} - Promise with response data
 */
export const getGuestReservations = async (eventId, guestId) => {
  return api.get(`/events/${eventId}/gifts/reservations/${guestId}`);
};

export const uploadImage = async (eventId, file) => {
  const formData = new FormData();
  formData.append('image', file);

  return api.post(`/events/${eventId}/gifts/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export default {
  getGiftItems,
  getAllGifts,
  getGiftById,
  createGift,
  updateGift,
  deleteGift,
  assignGift,
  unassignGift,
  reorderGifts,
  getGuestReservations,
  uploadImage
};