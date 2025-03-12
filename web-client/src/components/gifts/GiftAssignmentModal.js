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
      
      // Calculate available quantity
      const reserved = gift.quantityReserved || 0;
      const total = gift.quantity || 0;
      let available = total - reserved;
      
      // If the guest has already reserved, add their quantity to available
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
        throw new Error('Guest ID required for reservation');
      }
      
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      
      if (quantity > availableQuantity) {
        throw new Error('Requested quantity exceeds available quantity');
      }
      
      const assignData = {
        guestId,
        quantity: parseInt(quantity),
        message
      };
      
      // If the guest has already reserved, cancel their reservation first
      if (isReservedByCurrentGuest) {
        await unassignGift(eventId, gift._id, guestId);
      }
      
      const response = await assignGift(eventId, gift._id, assignData);
      
      if (response.data && response.data.success) {
        if (onComplete) onComplete();
      } else {
        throw new Error('Error during reservation');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error during reservation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!guestId) {
        throw new Error('Guest ID required to cancel reservation');
      }
      
      const response = await unassignGift(eventId, gift._id, guestId);
      
      if (response.data && response.data.success) {
        if (onComplete) onComplete();
      } else {
        throw new Error('Error canceling reservation');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error canceling reservation:', err);
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
          <h3>Reserve a Gift</h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="gift-header">
            <h3>{gift.name}</h3>
            <p className="gift-status">
              {isReservedByCurrentGuest ? (
                <span>You have already reserved this gift</span>
              ) : isFullyReserved ? (
                <span>This gift is already fully reserved</span>
              ) : (
                <span>
                  {gift.quantityReserved}/{gift.quantity} already reserved
                  {gift.quantityReserved > 0 && (
                    <> by {gift.reservations ? gift.reservations.length : 0} person(s)</>
                  )}
                </span>
              )}
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {isFullyReserved ? (
            <div className="unavailable-message">
              <FontAwesomeIcon icon={faGift} size="2x" />
              <p>This gift is already fully reserved.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {gift.quantity > 1 && (
                <div className="quantity-select">
                  <label htmlFor="quantity">How many would you like to bring?</label>
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
                  <p className="form-note">Maximum available: {maxQuantity}</p>
                </div>
              )}
              
              <div className="message-input">
                <label htmlFor="message">Message (optional)</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="E.g., I'll bring it wrapped."
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
                  Cancel
                </button>
                
                {isReservedByCurrentGuest && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={handleUnassign}
                    disabled={loading}
                  >
                    {loading ? 'Canceling...' : 'Cancel my reservation'}
                  </button>
                )}
                
                <button
                  type="submit"
                  className="confirm-button"
                  disabled={loading || quantity < 1 || quantity > maxQuantity}
                >
                  {loading ? (
                    'Processing...'
                  ) : isReservedByCurrentGuest ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Update
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Confirm
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