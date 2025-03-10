// backend/controllers/giftItemController.js
const GiftItem = require('../models/giftItem');
const Event = require('../models/events');
const Guest = require('../models/guest');
const { emailService } = require('../services');

/**
 * Créer un nouvel élément de cadeau/objet
 * @route POST /api/events/:eventId/gifts
 * @access Private (organisateur)
 */
exports.createGiftItem = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Vérifier si l'événement existe et appartient à l'utilisateur
    const event = await Event.findOne({ _id: eventId, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Événement non trouvé ou vous n\'avez pas les droits nécessaires' 
      });
    }
    
    // Compter les éléments existants pour définir l'ordre
    const itemCount = await GiftItem.countDocuments({ eventId });
    
    // Créer le nouvel élément
    const giftItem = new GiftItem({
      ...req.body,
      eventId,
      order: itemCount + 1
    });
    
    await giftItem.save();
    
    res.status(201).json({
      success: true,
      data: giftItem
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Récupérer tous les éléments de cadeau pour un événement
 * @route GET /api/events/:eventId/gifts
 * @access Public (invités et organisateur)
 */
exports.getAllGiftItems = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guestId, status } = req.query;
    
    // Vérifier si l'événement existe
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Événement non trouvé'
      });
    }
    
    // Construire le filtre de base
    let filter = { eventId };
    
    // Ajouter un filtre par statut si spécifié
    if (status) {
      // Cette logique doit être implémentée dans une requête d'agrégation
      // car status est un champ virtuel
      // Pour simplifier, nous allons filtrer après la requête
    }
    
    // Récupérer les éléments
    let giftItems = await GiftItem.find(filter)
      .sort({ isEssential: -1, order: 1 }) // Trier par essentiel puis par ordre
      .populate({
        path: 'reservations.guestId',
        select: 'name email phone'
      });
    
    // Filtrer par statut si nécessaire
    if (status) {
      giftItems = giftItems.filter(item => item.status === status);
    }
    
    // Si un guestId est fourni, ajouter un champ pour indiquer si l'invité a réservé chaque cadeau
    if (guestId) {
      giftItems = giftItems.map(item => {
        const giftObj = item.toObject();
        giftObj.isReservedByCurrentGuest = item.isReservedByGuest(guestId);
        giftObj.currentGuestReservation = item.getGuestReservation(guestId);
        return giftObj;
      });
    }
    
    // Vérifier si l'utilisateur est l'organisateur
    const isOrganizer = event.userId.toString() === (req.user ? req.user.id : '');
    
    // Si ce n'est pas l'organisateur, limiter les informations des réservations
    if (!isOrganizer) {
      giftItems = giftItems.map(item => {
        const filteredItem = typeof item.toObject === 'function' ? item.toObject() : item;
        
        // Supprimer les informations détaillées des réservations pour les non-organisateurs
        if (filteredItem.reservations && filteredItem.reservations.length > 0) {
          filteredItem.reservations = filteredItem.reservations.map(res => ({
            quantity: res.quantity,
            // Conserver uniquement le prénom pour la confidentialité
            guestName: res.guestId ? res.guestId.name.split(' ')[0] : 'Un invité'
          }));
        }
        
        return filteredItem;
      });
    }
    
    res.status(200).json({
      success: true,
      count: giftItems.length,
      data: giftItems
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Récupérer un élément de cadeau spécifique
 * @route GET /api/events/:eventId/gifts/:giftId
 * @access Public (invités et organisateur)
 */
exports.getGiftItemById = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    const { guestId } = req.query;
    
    // Vérifier si l'élément existe et appartient à l'événement
    const giftItem = await GiftItem.findOne({ _id: giftId, eventId })
      .populate({
        path: 'reservations.guestId',
        select: 'name email phone'
      });
    
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur est l'organisateur
    const event = await Event.findById(eventId);
    const isOrganizer = event.userId.toString() === (req.user ? req.user.id : '');
    
    let result = giftItem.toObject();
    
    // Si un guestId est fourni, ajouter un champ pour indiquer si l'invité a réservé ce cadeau
    if (guestId) {
      result.isReservedByCurrentGuest = giftItem.isReservedByGuest(guestId);
      result.currentGuestReservation = giftItem.getGuestReservation(guestId);
    }
    
    // Si ce n'est pas l'organisateur, limiter les informations des réservations
    if (!isOrganizer) {
      if (result.reservations && result.reservations.length > 0) {
        result.reservations = result.reservations.map(res => ({
          quantity: res.quantity,
          // Conserver uniquement le prénom pour la confidentialité
          guestName: res.guestId ? res.guestId.name.split(' ')[0] : 'Un invité'
        }));
      }
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Mettre à jour un élément de cadeau
 * @route PUT /api/events/:eventId/gifts/:giftId
 * @access Private (organisateur)
 */
exports.updateGiftItem = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    
    // Vérifier si l'événement appartient à l'utilisateur
    const event = await Event.findOne({ _id: eventId, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Événement non trouvé ou vous n\'avez pas les droits nécessaires' 
      });
    }
    
    // Exclure certains champs de la mise à jour
    const { reservations, quantityReserved, ...updateData } = req.body;
    
    // Mettre à jour l'élément
    const giftItem = await GiftItem.findOneAndUpdate(
      { _id: giftId, eventId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: giftItem
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Supprimer un élément de cadeau
 * @route DELETE /api/events/:eventId/gifts/:giftId
 * @access Private (organisateur)
 */
exports.deleteGiftItem = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    
    // Vérifier si l'événement appartient à l'utilisateur
    const event = await Event.findOne({ _id: eventId, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Événement non trouvé ou vous n\'avez pas les droits nécessaires' 
      });
    }
    
    // Supprimer l'élément
    const giftItem = await GiftItem.findOneAndDelete({ _id: giftId, eventId });
    
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé'
      });
    }
    
    // Réorganiser les indices des éléments restants
    await GiftItem.updateMany(
      { 
        eventId, 
        order: { $gt: giftItem.order } 
      },
      { $inc: { order: -1 } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Élément supprimé avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Réserver un élément de cadeau
 * @route POST /api/events/:eventId/gifts/:giftId/assign
 * @access Public (invités identifiés)
 */
exports.assignGiftItem = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    const { guestId, quantity, message } = req.body;
    
    if (!guestId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres guestId et quantity sont requis'
      });
    }
    
    // Vérifier si l'invité existe et est associé à l'événement
    const guest = await Guest.findOne({ _id: guestId, eventId });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Invité non trouvé ou non associé à cet événement'
      });
    }
    
    // Vérifier si l'élément existe
    const giftItem = await GiftItem.findOne({ _id: giftId, eventId });
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé'
      });
    }
    
    // Vérifier si l'invité a déjà réservé cet élément
    const existingReservation = giftItem.getGuestReservation(guestId);
    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà réservé cet élément'
      });
    }
    
    // Vérifier si la quantité disponible est suffisante
    if (giftItem.quantityReserved + parseInt(quantity) > giftItem.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantité disponible insuffisante'
      });
    }
    
    // Ajouter la réservation
    giftItem.reservations.push({
      guestId,
      quantity: parseInt(quantity),
      message: message || ''
    });
    
    await giftItem.save();
    
    // Récupérer les informations de l'événement pour la notification
    const event = await Event.findById(eventId).populate('userId', 'email name');
    
    // Envoyer une notification à l'organisateur
    try {
      await emailService.sendGiftReservationNotification(
        event.userId.email,
        {
          eventName: event.name,
          guestName: guest.name,
          giftName: giftItem.name,
          quantity,
          message: message || 'Aucun message'
        }
      );
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de notification:', emailError);
      // Ne pas bloquer la réponse en cas d'échec de l'envoi d'email
    }
    
    res.status(200).json({
      success: true,
      message: 'Élément réservé avec succès',
      data: giftItem
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Annuler la réservation d'un élément de cadeau
 * @route POST /api/events/:eventId/gifts/:giftId/unassign
 * @access Public (invités identifiés)
 */
exports.unassignGiftItem = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    const { guestId } = req.body;
    
    if (!guestId) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre guestId est requis'
      });
    }
    
    // Vérifier si l'invité existe et est associé à l'événement
    const guest = await Guest.findOne({ _id: guestId, eventId });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Invité non trouvé ou non associé à cet événement'
      });
    }
    
    // Vérifier si l'élément existe
    const giftItem = await GiftItem.findOne({ _id: giftId, eventId });
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé'
      });
    }
    
    // Vérifier si l'invité a réservé cet élément
    const existingReservationIndex = giftItem.reservations.findIndex(
      reservation => reservation.guestId.toString() === guestId
    );
    
    if (existingReservationIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'avez pas réservé cet élément'
      });
    }
    
    // Supprimer la réservation
    giftItem.reservations.splice(existingReservationIndex, 1);
    
    await giftItem.save();
    
    // Récupérer les informations de l'événement pour la notification
    const event = await Event.findById(eventId).populate('userId', 'email name');
    
    // Envoyer une notification à l'organisateur
    try {
      await emailService.sendGiftCancellationNotification(
        event.userId.email,
        {
          eventName: event.name,
          guestName: guest.name,
          giftName: giftItem.name
        }
      );
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de notification:', emailError);
      // Ne pas bloquer la réponse en cas d'échec de l'envoi d'email
    }
    
    res.status(200).json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: giftItem
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Réorganiser l'ordre des éléments de cadeau
 * @route PUT /api/events/:eventId/gifts/reorder
 * @access Private (organisateur)
 */
exports.reorderGiftItems = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Les données items doivent être un tableau d\'objets {id, order}'
      });
    }
    
    // Vérifier si l'événement appartient à l'utilisateur
    const event = await Event.findOne({ _id: eventId, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Événement non trouvé ou vous n\'avez pas les droits nécessaires' 
      });
    }
    
    // Mettre à jour l'ordre de chaque élément
    const updatePromises = items.map(item => {
      return GiftItem.updateOne(
        { _id: item.id, eventId },
        { order: item.order }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'Ordre des éléments mis à jour avec succès'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtenir les réservations d'un invité
 * @route GET /api/events/:eventId/gifts/reservations/:guestId
 * @access Public (invité concerné)
 */
exports.getGuestReservations = async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    
    // Vérifier si l'invité existe et est associé à l'événement
    const guest = await Guest.findOne({ _id: guestId, eventId });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Invité non trouvé ou non associé à cet événement'
      });
    }
    
    // Trouver tous les éléments réservés par cet invité
    const giftItems = await GiftItem.find({
      eventId,
      'reservations.guestId': guestId
    });
    
    // Formater la réponse
    const reservations = giftItems.map(item => {
      const reservation = item.getGuestReservation(guestId);
      return {
        giftId: item._id,
        giftName: item.name,
        quantity: reservation.quantity,
        message: reservation.message,
        createdAt: reservation.createdAt,
        totalQuantity: item.quantity,
        quantityReserved: item.quantityReserved,
        imageUrl: item.imageUrl
      };
    });
    
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};