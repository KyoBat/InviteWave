// web-client/src/components/gifts/GiftAssignmentModal.js
import React, { useState, useEffect } from 'react';
import { assignGift, unassignGift } from '../../services/gift';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck, faGift } from '@fortawesome/free-solid-svg-icons';

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
      setIsReservedByCurrentGuest(gift.isReservedByCurrentGuest || false);
      setCurrentReservation(gift.currentGuestReservation || null);
      
      // Calculer la quantité disponible
      const reserved = gift.quantityReserved || 0;
      const total = gift.quantity || 0;
      let available = total - reserved;
      
      // Si l'invité a déjà réservé, ajouter sa quantité aux disponibles
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
      if (!guestId) {
        throw new Error('ID d\'invité requis pour la réservation');
      }
      
      if (quantity < 1) {
        throw new Error('La quantité doit être au moins 1');
      }
      
      if (quantity > availableQuantity) {
        throw new Error('Quantité demandée supérieure à la quantité disponible');
      }
      
      const assignData = {
        guestId,
        quantity: parseInt(quantity),
        message
      };
      
      // Si l'invité a déjà réservé, annuler d'abord sa réservation
      if (isReservedByCurrentGuest) {
        await unassignGift(eventId, gift._id, guestId);
      }
      
      const response = await assignGift(eventId, gift._id, assignData);
      
      if (response.data && response.data.success) {
        if (onComplete) onComplete();
      } else {
        throw new Error('Erreur lors de la réservation');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de la réservation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!guestId) {
        throw new Error('ID d\'invité requis pour annuler la réservation');
      }
      
      const response = await unassignGift(eventId, gift._id, guestId);
      
      if (response.data && response.data.success) {
        if (onComplete) onComplete();
      } else {
        throw new Error('Erreur lors de l\'annulation de la réservation');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de l\'annulation de la réservation:', err);
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
          <h3>Réserver un cadeau</h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="gift-header">
            <h3>{gift.name}</h3>
            <p className="gift-status">
              {isReservedByCurrentGuest ? (
                <span>Vous avez déjà réservé ce cadeau</span>
              ) : isFullyReserved ? (
                <span>Ce cadeau est déjà entièrement réservé</span>
              ) : (
                <span>
                  {gift.quantityReserved}/{gift.quantity} déjà réservé(s)
                  {gift.quantityReserved > 0 && (
                    <> par {gift.reservations ? gift.reservations.length : 0} personne(s)</>
                  )}
                </span>
              )}
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {isFullyReserved ? (
            <div className="unavailable-message">
              <FontAwesomeIcon icon={faGift} size="2x" />
              <p>Ce cadeau est déjà entièrement réservé.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {gift.quantity > 1 && (
                <div className="quantity-select">
                  <label htmlFor="quantity">Combien souhaitez-vous en apporter ?</label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    disabled={loading}
                    required
                  />
                  <p className="form-note">Maximum disponible: {maxQuantity}</p>
                </div>
              )}
              
              <div className="message-input">
                <label htmlFor="message">Message (optionnel)</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Je l'apporterai emballé."
                  disabled={loading}
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
                    {loading ? 'Annulation...' : 'Annuler ma réservation'}
                  </button>
                )}
                
                <button
                  type="submit"
                  className="confirm-button"
                  disabled={loading || quantity < 1 || quantity > maxQuantity}
                >
                  {loading ? (
                    'Traitement...'
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