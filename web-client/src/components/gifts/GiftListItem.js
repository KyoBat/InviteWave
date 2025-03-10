// web-client/src/components/gifts/GiftListItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faGift, faCheck } from '@fortawesome/free-solid-svg-icons';
import { assignGift, unassignGift, deleteGift } from '../../services/gift';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

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
      message: 'Êtes-vous sûr de vouloir supprimer ce cadeau ? Cette action est irréversible.',
      buttons: [
        {
          label: 'Oui, supprimer',
          onClick: handleDelete
        },
        {
          label: 'Annuler',
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
        alert('Erreur lors de la suppression du cadeau');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du cadeau:', err);
      alert(err.message || 'Une erreur est survenue');
    }
  };

  const handleQuickAssign = async () => {
    if (!guestId) {
      alert('Vous devez être connecté pour réserver un cadeau');
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
        alert('Erreur lors de la réservation du cadeau');
      }
    } catch (err) {
      console.error('Erreur lors de la réservation du cadeau:', err);
      alert(err.message || 'Une erreur est survenue');
    }
  };

  const handleQuickUnassign = async () => {
    try {
      const response = await unassignGift(eventId, giftId, guestId);
      if (response.data && response.data.success) {
        fetchGifts();
      } else {
        alert('Erreur lors de l\'annulation de la réservation');
      }
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la réservation:', err);
      alert(err.message || 'Une erreur est survenue');
    }
  };

  const renderGridView = () => {
    const isReserved = status === 'reserved';
    const isPartial = status === 'partially';
    
    return (
      <div className={`gift-card ${isReserved ? 'reserved' : ''} ${isPartial ? 'partially-reserved' : ''}`}>
        <div className="gift-card-image">
          {imageUrl ? (
            <img src={imageUrl} alt={name} />
          ) : (
            <div className="gift-card-no-image">
              <FontAwesomeIcon icon={faGift} />
            </div>
          )}
          <div className={`gift-status-badge status-${status}`}>
            {status === 'available' && 'Disponible'}
            {status === 'partially' && 'Partiellement réservé'}
            {status === 'reserved' && 'Réservé'}
            {isReservedByCurrentGuest && <FontAwesomeIcon icon={faCheck} style={{ marginLeft: '5px' }} />}
          </div>
        </div>
        <div className="gift-card-content">
          <h3>
            {isEssential && <span className="essential-tag">ESSENTIEL</span>}
            {name}
          </h3>
          <p className="gift-description">{description}</p>
          <div className="gift-quantity">
            <span className="gift-quantity-label">Quantité:</span>
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
                <Link to={`/events/${eventId}/gifts/${giftId}`} className="view-button">Voir</Link>
                <Link to={`/events/${eventId}/gifts/${giftId}/edit`} className="edit-button">Modifier</Link>
                <button onClick={confirmDelete} className="delete-button">Supprimer</button>
              </>
            ) : isPublic ? (
              isReserved ? (
                <button className="reserve-button" disabled style={{ opacity: 0.5 }}>
                  Déjà réservé
                </button>
              ) : isReservedByCurrentGuest ? (
                <button className="unreserve-button" onClick={() => onAssign(gift)}>
                  Modifier ma réservation
                </button>
              ) : (
                <button className="reserve-button" onClick={() => onAssign(gift)}>
                  Je l'apporte
                </button>
              )
            ) : (
              <>
                <Link to={`/events/${eventId}/gifts/${giftId}`} className="view-button">Voir</Link>
                {!isReserved && !isReservedByCurrentGuest && (
                  <button className="reserve-button" onClick={quantity === 1 ? handleQuickAssign : () => onAssign(gift)}>
                    Réserver
                  </button>
                )}
                {isReservedByCurrentGuest && (
                  <button className="unreserve-button" onClick={() => onAssign(gift)}>
                    Modifier
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
              <img src={imageUrl} alt={name} />
            ) : (
              <div className="gift-thumbnail-placeholder">
                <FontAwesomeIcon icon={faGift} />
              </div>
            )}
          </div>
        </td>
        <td>
          {isEssential && <span className="essential-tag">ESSENTIEL</span>}
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
            {status === 'available' && 'Disponible'}
            {status === 'partially' && 'Partiel'}
            {status === 'reserved' && 'Réservé'}
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
                  Voir
                </Link>
                {!gift.isReserved && (
                  <button 
                    className="action-button reserve-button"
                    onClick={handleQuickAssign}
                    disabled={status === 'reserved'}
                  >
                    Réserver
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
            <img src={imageUrl} alt={name} />
          ) : (
            <div className="gift-public-placeholder">
              <FontAwesomeIcon icon={faGift} />
            </div>
          )}
          {isReservedByCurrentGuest && (
            <div className="gift-status-badge status-available">
              Vous l'apportez <FontAwesomeIcon icon={faCheck} />
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
                Déjà réservé
              </button>
            ) : isReservedByCurrentGuest ? (
              <button 
                className="gift-public-button" 
                onClick={() => onAssign(gift)}
                style={{ backgroundColor: '#f44336', color: 'white' }}
              >
                Modifier
              </button>
            ) : (
              <button 
                className="gift-public-button" 
                onClick={() => onAssign(gift)}
                style={{ backgroundColor: '#4caf50', color: 'white' }}
              >
                Je l'apporte
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