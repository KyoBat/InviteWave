// src/components/gifts/GiftDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGiftById, assignGift, unassignGift, deleteGift } from '../../services/gift';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faGift, 
  faArrowLeft, 
  faCheckCircle, 
  faTimesCircle,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import GiftAssignmentModal from './GiftAssignmentModal';
import { formatDate } from '../../utils/dateUtils';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const GiftDetail = ({ guestId, isOrganizer = false }) => {
  const { eventId, giftId } = useParams();
  const navigate = useNavigate();
  
  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchGiftData();
  }, [eventId, giftId, guestId]);

  const fetchGiftData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (guestId) {
        params.guestId = guestId;
      }
      
      const response = await getGiftById(eventId, giftId, params);
      if (response.data && response.data.success) {
        setGift(response.data.data);
      } else {
        setError('Error retrieving gift data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error retrieving gift data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    confirmAlert({
      title: 'Confirmation',
      message: 'Are you sure you want to delete this gift? This action cannot be undone.',
      buttons: [
        {
          label: 'Yes, delete',
          onClick: async () => {
            try {
              const response = await deleteGift(eventId, giftId);
              if (response.data && response.data.success) {
                navigate(`/events/${eventId}/gifts`);
              } else {
                setError('Error deleting gift');
              }
            } catch (err) {
              setError(err.message || 'An error occurred');
              console.error('Error deleting gift:', err);
            }
          }
        },
        {
          label: 'Cancel',
          onClick: () => {}
        }
      ]
    });
  };

  const handleQuickAssign = async () => {
    if (!guestId) {
      alert('You must be logged in to reserve a gift');
      return;
    }

    try {
      const assignData = {
        guestId,
        quantity: 1,
        message: ''
      };
      const response = await assignGift(eventId, giftId, assignData);
      if (response.data && response.data.success) {
        fetchGiftData();
      } else {
        setError('Error reserving gift');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error reserving gift:', err);
    }
  };

  const handleQuickUnassign = async () => {
    if (!guestId) {
      return;
    }

    try {
      const response = await unassignGift(eventId, giftId, guestId);
      if (response.data && response.data.success) {
        fetchGiftData();
      } else {
        setError('Error canceling reservation');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error canceling reservation:', err);
    }
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    fetchGiftData();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!gift) return <div className="not-found">Gift not found</div>;

  const {
    name,
    description,
    imageUrl,
    quantity,
    quantityReserved,
    isEssential,
    status,
    reservationPercentage,
    reservations = [],
    createdAt,
    updatedAt,
    isReservedByCurrentGuest,
    currentGuestReservation
  } = gift;

  const isReserved = status === 'reserved';
  const isPartiallyReserved = status === 'partially';
  const isAvailable = status === 'available';
  const availableQuantity = quantity - quantityReserved;

  return (
    <div className="gift-detail-container">
      <div className="gift-detail-header">
        <h2>
          {isEssential && <span className="essential-tag">ESSENTIAL</span>}
          {name}
        </h2>
        
        <div className="gift-actions">
          <Link to={`/events/${eventId}/gifts`} className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to list
          </Link>
          
          {isOrganizer && (
            <>
              <Link to={`/events/${eventId}/gifts/${giftId}/edit`} className="edit-button">
                <FontAwesomeIcon icon={faEdit} /> Edit
              </Link>
              <button onClick={handleDelete} className="delete-button">
                <FontAwesomeIcon icon={faTrash} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="gift-detail-content">
        <div className="gift-detail-main">
          <div className="gift-image">
            {imageUrl ? (
              <img src={imageUrl} alt={name} />
            ) : (
              <div className="gift-no-image">
                <FontAwesomeIcon icon={faGift} />
              </div>
            )}
          </div>
          
          <div className="gift-info">
            <h3>Description</h3>
            <p>{description || 'No description available.'}</p>
          </div>
          
          <div className="gift-quantity-detail">
            <h4>Reservation Progress</h4>
            <div className="quantity-progress">
              <div 
                className="quantity-progress-bar" 
                style={{ width: `${reservationPercentage}%` }}
              ></div>
            </div>
            <div className="quantity-text">
              <span>{quantityReserved} reserved out of {quantity} needed</span>
              <span>{availableQuantity} available</span>
            </div>
          </div>
          
          {(isOrganizer || reservations.length > 0) && (
            <div className="reserved-by">
              <h3>Reserved by:</h3>
              {reservations.length === 0 ? (
                <p className="no-reservations">No reservations yet</p>
              ) : (
                <table className="reservations-table">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Quantity</th>
                      <th>Message</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation, index) => (
                      <tr key={index}>
                        <td>
                          {isOrganizer && reservation.guestId ? (
                            reservation.guestId.name
                          ) : (
                            reservation.guestName || 'A guest'
                          )}
                          {reservation.guestId && guestId && reservation.guestId._id === guestId && (
                            <span style={{ marginLeft: '5px', color: '#5c6bc0' }}>(You)</span>
                          )}
                        </td>
                        <td>{reservation.quantity}</td>
                        <td>
                          {reservation.message ? (
                            <span className="reservation-message">{reservation.message}</span>
                          ) : (
                            <em>No message</em>
                          )}
                        </td>
                        <td>
                          {reservation.createdAt ? (
                            formatDate(reservation.createdAt)
                          ) : (
                            <em>Unknown date</em>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        
        <div className="gift-detail-sidebar">
          <div className="action-panel">
            <h3>Information</h3>
            <div className="gift-status-info">
              <p>
                <strong>Status:</strong> 
                <span className={`status-${status}`}>
                  {status === 'available' && 'Available'}
                  {status === 'partially' && 'Partially Reserved'}
                  {status === 'reserved' && 'Fully Reserved'}
                </span>
              </p>
              <p>
                <strong>Quantity:</strong> {quantity}
              </p>
              <p>
                <strong>Reserved:</strong> {quantityReserved}
              </p>
              <p>
                <strong>Available:</strong> {availableQuantity}
              </p>
              <p>
                <strong>Essential:</strong> {isEssential ? 'Yes' : 'No'}
              </p>
              {isOrganizer && (
                <>
                  <p>
                    <strong>Created:</strong> {formatDate(createdAt)}
                  </p>
                  <p>
                    <strong>Last updated:</strong> {formatDate(updatedAt)}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {!isOrganizer && guestId && (
            <div className="action-panel">
              <h3>Reservation</h3>
              {isReserved && !isReservedByCurrentGuest ? (
                <div className="unavailable-message">
                  <FontAwesomeIcon icon={faTimesCircle} size="2x" style={{ color: '#f44336' }} />
                  <p>This gift is already fully reserved.</p>
                </div>
              ) : isReservedByCurrentGuest ? (
                <div className="reserve-form">
                  <p>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#4caf50', marginRight: '8px' }} />
                    You have reserved this gift.
                  </p>
                  {currentGuestReservation && (
                    <p>Quantity: {currentGuestReservation.quantity}</p>
                  )}
                  <button 
                    className="full-width-button unreserve-button-large"
                    onClick={() => setShowAssignModal(true)}
                  >
                    Modify my reservation
                  </button>
                </div>
              ) : (
                <div className="reserve-form">
                  {quantity === 1 ? (
                    <button 
                      className="full-width-button reserve-button-large"
                      onClick={handleQuickAssign}
                    >
                      I'll bring it
                    </button>
                  ) : (
                    <button 
                      className="full-width-button reserve-button-large"
                      onClick={() => setShowAssignModal(true)}
                    >
                      I'll bring it
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showAssignModal && (
        <GiftAssignmentModal
          gift={gift}
          eventId={eventId}
          guestId={guestId}
          onClose={() => setShowAssignModal(false)}
          onComplete={handleAssignmentComplete}
        />
      )}
    </div>
  );
};

export default GiftDetail;