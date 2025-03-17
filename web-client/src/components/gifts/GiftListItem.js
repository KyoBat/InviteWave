// web-client/src/components/gifts/GiftListItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faGift, faCheck } from '@fortawesome/free-solid-svg-icons';
import { assignGift, unassignGift, deleteGift } from '../../services/gift';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import config from '../../config';
const GiftListItem = ({ 
  gift, 
  isOrganizer, 
  guestId, 
  onAssign, 
  isPublic = false,
  viewMode = 'grid',
  fetchGifts
}) => {
  const {
    _id: giftId,
    name,
    description,
    imageUrl,
    quantity,
    quantityReserved,
    isEssential,
    status,
    reservationPercentage,
    eventId,
    isReservedByCurrentGuest,
    currentGuestReservation
  } = gift;

  const confirmDelete = () => {
    confirmAlert({
      title: 'Confirmation',
      message: 'Are you sure you want to delete this gift? This action cannot be undone.',
      buttons: [
        {
          label: 'Yes, delete',
          onClick: handleDelete
        },
        {
          label: 'Cancel',
          onClick: () => {}
        }
      ]
    });
  };

  const handleDelete = async () => {
    try {
      const response = await deleteGift(eventId, giftId);
      if (response.data && response.data.success) {
        fetchGifts();
      } else {
        alert('Error deleting gift');
      }
    } catch (err) {
      console.error('Error deleting gift:', err);
      alert(err.message || 'An error occurred');
    }
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
        fetchGifts();
      } else {
        alert('Error reserving gift');
      }
    } catch (err) {
      console.error('Error reserving gift:', err);
      alert(err.message || 'An error occurred');
    }
  };

  const handleQuickUnassign = async () => {
    try {
      const response = await unassignGift(eventId, giftId, guestId);
      if (response.data && response.data.success) {
        fetchGifts();
      } else {
        alert('Error canceling reservation');
      }
    } catch (err) {
      console.error('Error canceling reservation:', err);
      alert(err.message || 'An error occurred');
    }
  };

  const imageUrlPath = imageUrl => {
    // Éviter les chemins en double comme /uploads//uploads/...
    if (imageUrl?.startsWith('/uploads/')) {
      return `${config.urlImage}${imageUrl}`;
    } else {
      return `${config.urlImage}/uploads/${imageUrl}`;
    }
  };
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // Supprimer les doubles slashes
    return `${config.urlImage}/uploads/${imageUrl.replace(/^\/uploads\//, '')}`;
  };

  const getCorrectImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // Construire l'URL complète en évitant les doubles slashes
    // Si imageUrl contient déjà la partie complète de l'URL
    if (imageUrl.includes('http://') || imageUrl.includes('https://')) {
      return imageUrl;
    }
    
    // Supprimer tout préfixe /uploads/ existant et tout slash au début
    const cleanImageName = imageUrl.replace(/^\/?(uploads\/)?/, '');
    
    // Construire l'URL complète

    return `${config.urlImage}/uploads/${cleanImageName}`;
  };
  const renderGridView = () => {
    const isReserved = status === 'reserved';
    const isPartial = status === 'partially';
    return (
      <div className={`gift-card ${isReserved ? 'reserved' : ''} ${isPartial ? 'partially-reserved' : ''}`}>
        <div className="gift-card-image">
          {imageUrl ? (
            
            <img src={getCorrectImageUrl(imageUrl)} alt={name} />
          ) : (
            <div className="gift-card-no-image">
              <FontAwesomeIcon icon={faGift} />
            </div>
          )}
          <div className={`gift-status-badge status-${status}`}>
            {status === 'available' && 'Available'}
            {status === 'partially' && 'Partially Reserved'}
            {status === 'reserved' && 'Reserved'}
            {isReservedByCurrentGuest && <FontAwesomeIcon icon={faCheck} style={{ marginLeft: '5px' }} />}
          </div>
        </div>
        <div className="gift-card-content">
          <h3>
            {isEssential && <span className="essential-tag">ESSENTIAL</span>}
            {name}
          </h3>
          <p className="gift-description">{description}</p>
          <div className="gift-quantity">
            <span className="gift-quantity-label">Quantity:</span>
            <div className="gift-quantity-progress">
              <div 
                className="gift-quantity-bar" 
                style={{ width: `${reservationPercentage}%` }}
              ></div>
            </div>
            <span className="gift-quantity-text">{quantityReserved}/{quantity}</span>
          </div>
          <div className="gift-card-actions">
            {isOrganizer ? (
              <>
                <Link to={`/events/${eventId}/gifts/${giftId}`} className="view-button">View</Link>
                <Link to={`/events/${eventId}/gifts/${giftId}/edit`} className="edit-button">Edit</Link>
                <button onClick={confirmDelete} className="delete-button">Delete</button>
              </>
            ) : isPublic ? (
              isReserved ? (
                <button className="reserve-button" disabled style={{ opacity: 0.5 }}>
                  Already Reserved
                </button>
              ) : isReservedByCurrentGuest ? (
                <button className="unreserve-button" onClick={() => onAssign(gift)}>
                  Modify My Reservation
                </button>
              ) : (
                <button className="reserve-button" onClick={() => onAssign(gift)}>
                  I'll Bring It
                </button>
              )
            ) : (
              <>
                <Link to={`/events/${eventId}/gifts/${giftId}`} className="view-button">View</Link>
                {!isReserved && !isReservedByCurrentGuest && (
                  <button className="reserve-button" onClick={quantity === 1 ? handleQuickAssign : () => onAssign(gift)}>
                    Reserve
                  </button>
                )}
                {isReservedByCurrentGuest && (
                  <button className="unreserve-button" onClick={() => onAssign(gift)}>
                    Modify
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const rowClass = status === 'reserved' ? 'reserved' : '';

    return (
      <tr className={rowClass}>
        <td>
          <div className="gift-thumbnail">
            {imageUrl ? (
              <img src={getCorrectImageUrl(imageUrl)} alt={name} />
            ) : (
              <div className="gift-thumbnail-placeholder">
                <FontAwesomeIcon icon={faGift} />
              </div>
            )}
          </div>
        </td>
        <td>
          {isEssential && <span className="essential-tag">ESSENTIAL</span>}
          <span className="gift-name">{name}</span>
        </td>
        <td>
          <span className="gift-description">{description && description.length > 50 ? `${description.substring(0, 50)}...` : description}</span>
        </td>
        <td>
          <span className="gift-quantity">{quantityReserved}/{quantity}</span>
        </td>
        <td>
          <span className={`status-badge status-badge-${status}`}>
            {status === 'available' && 'Available'}
            {status === 'partially' && 'Partial'}
            {status === 'reserved' && 'Reserved'}
          </span>
        </td>
        <td>
          <div className="gift-actions">
            {isOrganizer ? (
              <>
                <Link to={`/events/${eventId}/gifts/${giftId}/edit`} className="action-button edit-button">
                  <FontAwesomeIcon icon={faEdit} />
                </Link>
                <button onClick={confirmDelete} className="action-button delete-button">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            ) : (
              <>
                <Link to={`/events/${eventId}/gifts/${giftId}`} className="action-button view-button">
                  View
                </Link>
                {!gift.isReserved && (
                  <button 
                    className="action-button reserve-button"
                    onClick={handleQuickAssign}
                    disabled={status === 'reserved'}
                  >
                    Reserve
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderPublicView = () => {
    const isReserved = status === 'reserved';
    
    return (
      <div className={`gift-public-card ${isReserved ? 'reserved' : ''}`}>
        <div className="gift-public-image">
          {imageUrl ? (
            <img src={getCorrectImageUrl(imageUrl)} alt={name} />
          ) : (
            <div className="gift-public-placeholder">
              <FontAwesomeIcon icon={faGift} />
            </div>
          )}
          {isReservedByCurrentGuest && (
            <div className="gift-status-badge status-available">
              You're bringing this <FontAwesomeIcon icon={faCheck} />
            </div>
          )}
        </div>
        <div className="gift-public-content">
          <h4>{name}</h4>
          <div className="gift-public-progress">
            <div className="gift-public-progress-bar">
              <div 
                className="gift-public-progress-fill" 
                style={{ width: `${reservationPercentage}%` }}
              ></div>
            </div>
            <div className="gift-public-progress-text">{quantityReserved}/{quantity}</div>
          </div>
          <div className="gift-public-actions">
            {isReserved && !isReservedByCurrentGuest ? (
              <button className="gift-public-button" disabled style={{ backgroundColor: '#e0e0e0', color: '#666' }}>
                Already Reserved
              </button>
            ) : isReservedByCurrentGuest ? (
              <button 
                className="gift-public-button" 
                onClick={() => onAssign(gift)}
                style={{ backgroundColor: '#f44336', color: 'white' }}
              >
                Modify
              </button>
            ) : (
              <button 
                className="gift-public-button" 
                onClick={() => onAssign(gift)}
                style={{ backgroundColor: '#4caf50', color: 'white' }}
              >
                I'll Bring It
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isPublic) {
    return renderPublicView();
  }
  return viewMode === 'grid' ? renderGridView() : renderListView();
};

export default GiftListItem;