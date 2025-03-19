// web-client/src/components/gifts/GiftListItem.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faGift, faCheck, faStar } from '@fortawesome/free-solid-svg-icons';
import { assignGift, unassignGift, deleteGift } from '../../services/gift';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import config from '../../config';
import GiftAssignmentModal from './GiftAssignmentModal';

const GiftListItem = ({ 
  gift, 
  isOrganizer, 
  guestId, 
  onAssign, 
  isPublic = false,
  viewMode = 'grid',
  fetchGifts,
  dragHandleProps = {}
}) => {
  const [showModal, setShowModal] = useState(false);
  
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

  // Gestion de la modal (si onAssign n'est pas fourni)
  const handleOpenModal = () => {
    if (onAssign) {
      onAssign(gift);
    } else {
      setShowModal(true);
    }
  };
  
  const handleCloseModal = () => setShowModal(false);
  
  const handleReservationComplete = () => {
    setShowModal(false);
    if (fetchGifts) {
      fetchGifts();
    }
  };

  const getCorrectImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // Si l'URL est déjà complète, la retourner directement
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
      <div className={`gift-card ${isReserved ? 'reserved' : ''} ${isPartial ? 'partially-reserved' : ''}`} {...dragHandleProps}>
        <div className="gift-card-image">
          {imageUrl ? (
            <img src={getCorrectImageUrl(imageUrl)} alt={name} className="gift-image" />
          ) : (
            <div className="gift-card-no-image">
              <FontAwesomeIcon icon={faGift} size="2x" />
            </div>
          )}
          <div className={`gift-status-badge status-${status}`}>
            {status === 'available' && 'Available'}
            {status === 'partially' && 'Partially Reserved'}
            {status === 'reserved' && 'Reserved'}
            {isReservedByCurrentGuest && <FontAwesomeIcon icon={faCheck} style={{ marginLeft: '5px' }} />}
          </div>
          
          {isEssential && (
            <div className="gift-essential-tag">
              <FontAwesomeIcon icon={faStar} /> ESSENTIAL
            </div>
          )}
        </div>
        <div className="gift-card-content">
          <h3 className="gift-name">
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
                <button className="unreserve-button" onClick={handleOpenModal}>
                  Modify My Reservation
                </button>
              ) : (
                <button className="reserve-button" onClick={handleOpenModal}>
                  I'll Bring It
                </button>
              )
            ) : (
              <>
                <Link to={`/events/${eventId}/gifts/${giftId}`} className="view-button">View</Link>
                {!isReserved && !isReservedByCurrentGuest && (
                  <button className="reserve-button" onClick={quantity === 1 ? handleQuickAssign : handleOpenModal}>
                    Reserve
                  </button>
                )}
                {isReservedByCurrentGuest && (
                  <button className="unreserve-button" onClick={handleOpenModal}>
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
          {isEssential && <span className="essential-tag"><FontAwesomeIcon icon={faStar} /> ESSENTIAL</span>}
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
                {status !== 'reserved' && !isReservedByCurrentGuest && (
                  <button 
                    className="action-button reserve-button"
                    onClick={handleQuickAssign}
                    disabled={status === 'reserved'}
                  >
                    Reserve
                  </button>
                )}
                {isReservedByCurrentGuest && (
                  <button 
                    className="action-button modify-button"
                    onClick={handleOpenModal}
                  >
                    <FontAwesomeIcon icon={faCheck} />
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
            <img src={getCorrectImageUrl(imageUrl)} alt={name} className="gift-image" />
          ) : (
            <div className="gift-public-placeholder">
              <FontAwesomeIcon icon={faGift} size="2x" />
            </div>
          )}
          
          {isReservedByCurrentGuest && (
            <div className="gift-status-badge status-available">
              You're bringing this <FontAwesomeIcon icon={faCheck} />
            </div>
          )}
          
          {isEssential && (
            <div className="gift-essential-tag">
              <FontAwesomeIcon icon={faStar} /> ESSENTIAL
            </div>
          )}
        </div>
        
        <div className="gift-public-content">
          <h4 className="gift-name">{name}</h4>
          
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
                onClick={handleOpenModal}
                style={{ backgroundColor: '#f44336', color: 'white' }}
              >
                Modify
              </button>
            ) : (
              <button 
                className="gift-public-button" 
                onClick={handleOpenModal}
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

  // Rendu conditionnel selon le mode d'affichage
  let renderedContent;
  if (isPublic) {
    renderedContent = renderPublicView();
  } else {
    renderedContent = viewMode === 'grid' ? renderGridView() : renderListView();
  }

  // Ajout de la modal de réservation si nécessaire (seulement si onAssign n'est pas fourni)
  return (
    <>
      {renderedContent}
      
      {showModal && !onAssign && (
        <GiftAssignmentModal
          gift={gift}
          eventId={eventId}
          guestId={guestId}
          onClose={handleCloseModal}
          onComplete={handleReservationComplete}
        />
      )}
    </>
  );
};

export default GiftListItem;