// src/components/gifts/GiftAssignmentModal.js
import React, { useState, useEffect } from 'react';
import { assignGift, unassignGift } from '../../services/gift';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck, faGift, faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';

const GiftAssignmentModal = ({ gift, eventId, guestId, onClose, onComplete }) => {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReservedByCurrentGuest, setIsReservedByCurrentGuest] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [availableQuantity, setAvailableQuantity] = useState(0);

  useEffect(() => {
    if (gift) {
      // Déterminer si ce cadeau est déjà réservé par l'invité actuel
      setIsReservedByCurrentGuest(gift.isReservedByCurrentGuest || false);
      setCurrentReservation(gift.currentGuestReservation || null);
      
      // Calculer la quantité disponible
      const reserved = gift.quantityReserved || 0;
      const total = gift.quantity || 0;
      let available = total - reserved;
      
      // Si l'invité a déjà réservé, ajouter sa quantité au disponible
      if (gift.currentGuestReservation) {
        available += gift.currentGuestReservation.quantity;
        setQuantity(gift.currentGuestReservation.quantity);
        setMessage(gift.currentGuestReservation.message || '');
      }
      
      setAvailableQuantity(available);
    }
  }, [gift]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validation de l'ID invité
      if (!guestId || guestId === 'undefined' || guestId === 'null') {
        throw new Error('Identification invité nécessaire pour la réservation');
      }
      
      if (quantity < 1) {
        throw new Error('La quantité doit être d\'au moins 1');
      }
      
      if (quantity > availableQuantity) {
        throw new Error('La quantité demandée dépasse la quantité disponible');
      }
      
      const assignData = {
        guestId,
        quantity: parseInt(quantity),
        message
      };
      
      // Si l'invité a déjà réservé, annuler sa réservation d'abord
      if (isReservedByCurrentGuest) {
        await unassignGift(eventId, gift._id, guestId);
      }
      
      const response = await assignGift(eventId, gift._id, assignData);
      
      if (response.data && response.data.success) {
        if (onComplete) onComplete();
      } else {
        throw new Error(response.data?.message || 'Erreur lors de la réservation');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUnassign = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!guestId || guestId === 'undefined' || guestId === 'null') {
        throw new Error('Identification invité nécessaire pour annuler la réservation');
      }
      
      const response = await unassignGift(eventId, gift._id, guestId);
      
      if (response.data && response.data.success) {
        if (onComplete) onComplete();
      } else {
        throw new Error(response.data?.message || 'Erreur lors de l\'annulation');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (!gift) return null;

  const isFullyReserved = gift.status === 'reserved' && !isReservedByCurrentGuest;
  const maxQuantity = Math.min(gift.quantity, availableQuantity);

  return (
    <div className="modal-overlay">
      <div className="modal-content gift-assignment-modal">
        <div className="modal-header">
          <h3>
            <FontAwesomeIcon icon={faGift} className="gift-icon" />
            {isReservedByCurrentGuest ? 'Modifier votre réservation' : 'Réserver un cadeau'}
          </h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="gift-header">
            <h3 className="gift-title">{gift.name}</h3>
            
            {gift.description && (
              <p className="gift-description">{gift.description}</p>
            )}
            
            <div className="gift-status-container">
              <div className={`gift-status ${isFullyReserved ? 'fully-reserved' : isReservedByCurrentGuest ? 'your-reservation' : ''}`}>
                {isReservedByCurrentGuest ? (
                  <span className="status-message">
                    <FontAwesomeIcon icon={faCheck} className="status-icon" />
                    Vous avez déjà réservé ce cadeau
                  </span>
                ) : isFullyReserved ? (
                  <span className="status-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="status-icon" />
                    Ce cadeau est déjà entièrement réservé
                  </span>
                ) : (
                  <span className="status-message">
                    <span className="reservation-count">{gift.quantityReserved}/{gift.quantity}</span> déjà réservé
                    {gift.quantityReserved > 0 && (
                      <> par {gift.reservations ? gift.reservations.length : 0} personne(s)</>
                    )}
                  </span>
                )}
              </div>
              
              {gift.isEssential && (
                <div className="gift-tag essential-tag">Essentiel</div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="error-alert">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{error}</span>
            </div>
          )}
          
          {!guestId ? (
            <div className="guest-id-error">
              <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="error-icon" />
              <p>Impossible de vous identifier comme invité. Cette identification est nécessaire pour réserver des cadeaux.</p>
              <p>Veuillez rafraîchir la page ou contacter l'organisateur de l'événement.</p>
            </div>
          ) : isFullyReserved ? (
            <div className="unavailable-message">
              <FontAwesomeIcon icon={faGift} size="2x" className="gift-icon" />
              <p>Ce cadeau est déjà entièrement réservé.</p>
              <p className="suggestion">Découvrez d'autres cadeaux disponibles dans la liste.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="reservation-form">
              {gift.quantity > 1 && (
                <div className="form-group quantity-select">
                  <label htmlFor="quantity">Combien souhaitez-vous en apporter ?</label>
                  <div className="quantity-input-container">
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      disabled={loading}
                      required
                    />
                    <span className="quantity-max">Maximum disponible : {maxQuantity}</span>
                  </div>
                </div>
              )}
              
              <div className="form-group message-input">
                <label htmlFor="message">Message (optionnel)</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex : Je l'apporterai emballé."
                  disabled={loading}
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-button"
                  onClick={onClose}
                  disabled={loading}
                >
                  Annuler
                </button>
                
                {isReservedByCurrentGuest && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={handleUnassign}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin /> Annulation...
                      </>
                    ) : (
                      'Annuler ma réservation'
                    )}
                  </button>
                )}
                
                <button
                  type="submit"
                  className="confirm-button"
                  disabled={loading || quantity < 1 || quantity > maxQuantity}
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Traitement...
                    </>
                  ) : isReservedByCurrentGuest ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Mettre à jour
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Confirmer
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftAssignmentModal;