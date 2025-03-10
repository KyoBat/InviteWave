// web-client/src/services/gift.js
import api from './api';

/**
 * Obtenir tous les cadeaux pour un événement
 * @param {string} eventId - ID de l'événement
 * @param {Object} params - Paramètres de requête (status, guestId)
 * @returns {Promise} - Promise avec les données de réponse
 */
export const getAllGifts = async (eventId, params = {}) => {
  return api.get(`/events/${eventId}/gifts`, { params });
};

/**
 * Obtenir un cadeau spécifique
 * @param {string} eventId - ID de l'événement
 * @param {string} giftId - ID du cadeau
 * @param {Object} params - Paramètres de requête (guestId)
 * @returns {Promise} - Promise avec les données de réponse
 */
export const getGiftById = async (eventId, giftId, params = {}) => {
  return api.get(`/events/${eventId}/gifts/${giftId}`, { params });
};

/**
 * Créer un nouveau cadeau
 * @param {string} eventId - ID de l'événement
 * @param {Object} giftData - Données du cadeau
 * @returns {Promise} - Promise avec les données de réponse
 */
export const createGift = async (eventId, giftData) => {
  return api.post(`/events/${eventId}/gifts`, giftData);
};

/**
 * Mettre à jour un cadeau existant
 * @param {string} eventId - ID de l'événement
 * @param {string} giftId - ID du cadeau
 * @param {Object} giftData - Données mises à jour du cadeau
 * @returns {Promise} - Promise avec les données de réponse
 */
export const updateGift = async (eventId, giftId, giftData) => {
  return api.put(`/events/${eventId}/gifts/${giftId}`, giftData);
};

/**
 * Supprimer un cadeau
 * @param {string} eventId - ID de l'événement
 * @param {string} giftId - ID du cadeau
 * @returns {Promise} - Promise avec les données de réponse
 */
export const deleteGift = async (eventId, giftId) => {
  return api.delete(`/events/${eventId}/gifts/${giftId}`);
};

/**
 * Réserver un cadeau
 * @param {string} eventId - ID de l'événement
 * @param {string} giftId - ID du cadeau
 * @param {Object} assignData - Données de réservation {guestId, quantity, message}
 * @returns {Promise} - Promise avec les données de réponse
 */
export const assignGift = async (eventId, giftId, assignData) => {
  return api.post(`/events/${eventId}/gifts/${giftId}/assign`, assignData);
};

/**
 * Annuler la réservation d'un cadeau
 * @param {string} eventId - ID de l'événement
 * @param {string} giftId - ID du cadeau
 * @param {string} guestId - ID de l'invité
 * @returns {Promise} - Promise avec les données de réponse
 */
export const unassignGift = async (eventId, giftId, guestId) => {
  return api.post(`/events/${eventId}/gifts/${giftId}/unassign`, { guestId });
};

/**
 * Réorganiser les cadeaux
 * @param {string} eventId - ID de l'événement
 * @param {Array} items - Tableau d'objets {id, order}
 * @returns {Promise} - Promise avec les données de réponse
 */
export const reorderGifts = async (eventId, items) => {
  return api.put(`/events/${eventId}/gifts/reorder`, { items });
};

/**
 * Obtenir les réservations d'un invité
 * @param {string} eventId - ID de l'événement
 * @param {string} guestId - ID de l'invité
 * @returns {Promise} - Promise avec les données de réponse
 */
export const getGuestReservations = async (eventId, guestId) => {
  return api.get(`/events/${eventId}/gifts/reservations/${guestId}`);
};

export default {
  getAllGifts,
  getGiftById,
  createGift,
  updateGift,
  deleteGift,
  assignGift,
  unassignGift,
  reorderGifts,
  getGuestReservations
};

export const getGiftItems = (eventId) => {
  return api.get(`/api/events/${eventId}/gifts`); // Ajoutez /api si nécessaire
};