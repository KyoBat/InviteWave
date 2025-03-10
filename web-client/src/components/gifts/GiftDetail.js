// web-client/src/components/gifts/GiftDetail.js
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
        setError('Erreur lors de la récupération des données du cadeau');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de la récupération des données du cadeau:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    confirmAlert({
      title: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer ce cadeau ? Cette action est irréversible.',
      buttons: [
        {
          label: 'Oui, supprimer',
          onClick: async () => {
            try {
              const response = await deleteGift(eventId, giftId);
              if (response.data && response.data.success) {
                navigate(`/events/${eventId}/gifts`);
              } else {
                setError('Erreur lors de la suppression du cadeau');
              }
            } catch (err) {
              setError(err.message || 'Une erreur est survenue');
              console.error('Erreur lors de la suppression du cadeau:', err);
            }
          }
        },
        {
          label: 'Annuler',
          onClick: () => {}
        }
      ]
    });
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
        fetchGiftData();
      } else {
        setError('Erreur lors de la réservation du cadeau');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de la réservation du cadeau:', err);
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
        setError('Erreur lors de l\'annulation de la réservation');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de l\'annulation de la réservation:', err);
    }
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    fetchGiftData();
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error-message">Erreur: {error}</div>;
  if (!gift) return <div className="not-found">Cadeau non trouvé</div>;

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
          {isEssential && <span className="essential-tag">ESSENTIEL</span>}
          {name}
        </h2>
        
        <div className="gift-actions">
          <Link to={`/events/${eventId}/gifts`} className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} /> Retour à la liste
          </Link>
          
          {isOrganizer && (
            <>
              <Link to={`/events/${eventId}/gifts/${giftId}/edit`} className="edit-button">
                <FontAwesomeIcon icon={faEdit} /> Modifier
              </Link>
              <button onClick={handleDelete} className="delete-button">
                <FontAwesomeIcon icon={faTrash} /> Supprimer
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
            <p>{description || 'Aucune description disponible.'}</p>
          </div>
          
          <div className="gift-quantity-detail">
            <h4>Progression des réservations</h4>
            <div className="quantity-progress">
              <div 
                className="quantity-progress-bar" 
                style={{ width: `${reservationPercentage}%` }}
              ></div>
            </div>
            <div className="quantity-text">
              <span>{quantityReserved} réservé(s) sur {quantity} souhaité(s)</span>
              <span>{availableQuantity} disponible(s)</span>
            </div>
          </div>
          
          {(isOrganizer || reservations.length > 0) && (
            <div className="reserved-by">
              <h3>Réservé par :</h3>
              {reservations.length === 0 ? (
                <p className="no-reservations">Aucune réservation pour le moment</p>
              ) : (
                <table className="reservations-table">
                  <thead>
                    <tr>
                      <th>Invité</th>
                      <th>Quantité</th>
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
                            reservation.guestName || 'Un invité'
                          )}
                          {reservation.guestId && guestId && reservation.guestId._id === guestId && (
                            <span style={{ marginLeft: '5px', color: '#5c6bc0' }}>(Vous)</span>
                          )}
                        </td>
                        <td>{reservation.quantity}</td>
                        <td>
                          {reservation.message ? (
                            <span className="reservation-message">{reservation.message}</span>
                          ) : (
                            <em>Aucun message</em>
                          )}
                        </td>
                        <td>
                          {reservation.createdAt ? (
                            formatDate(reservation.createdAt)
                          ) : (
                            <em>Date inconnue</em>
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
            <h3>Informations</h3>
            <div className="gift-status-info">
              <p>
                <strong>Statut :</strong> 
                <span className={`status-${status}`}>
                  {status === 'available' && 'Disponible'}
                  {status === 'partially' && 'Partiellement réservé'}
                  {status === 'reserved' && 'Entièrement réservé'}
                </span>
              </p>
              <p>
                <strong>Quantité :</strong> {quantity}
              </p>
              <p>
                <strong>Réservé :</strong> {quantityReserved}
              </p>
              <p>
                <strong>Disponible :</strong> {availableQuantity}
              </p>
              <p>
                <strong>Essentiel :</strong> {isEssential ? 'Oui' : 'Non'}
              </p>
              {isOrganizer && (
                <>
                  <p>
                    <strong>Créé le :</strong> {formatDate(createdAt)}
                  </p>
                  <p>
                    <strong>Dernière modification :</strong> {formatDate(updatedAt)}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {!isOrganizer && guestId && (
            <div className="action-panel">
              <h3>Réservation</h3>
              {isReserved && !isReservedByCurrentGuest ? (
                <div className="unavailable-message">
                  <FontAwesomeIcon icon={faTimesCircle} size="2x" style={{ color: '#f44336' }} />
                  <p>Ce cadeau est déjà entièrement réservé.</p>
                </div>
              ) : isReservedByCurrentGuest ? (
                <div className="reserve-form">
                  <p>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#4caf50', marginRight: '8px' }} />
                    Vous avez réservé ce cadeau.
                  </p>
                  {currentGuestReservation && (
                    <p>Quantité : {currentGuestReservation.quantity}</p>
                  )}
                  <button 
                    className="full-width-button unreserve-button-large"
                    onClick={() => setShowAssignModal(true)}
                  >
                    Modifier ma réservation
                  </button>
                </div>
              ) : (
                <div className="reserve-form">
                  {quantity === 1 ? (
                    <button 
                      className="full-width-button reserve-button-large"
                      onClick={handleQuickAssign}
                    >
                      Je l'apporte
                    </button>
                  ) : (
                    <button 
                      className="full-width-button reserve-button-large"
                      onClick={() => setShowAssignModal(true)}
                    >
                      Je l'apporte
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