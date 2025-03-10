// web-client/src/components/gifts/GiftList.js
import React, { useState, useEffect } from 'react';
import { getAllGifts } from '../../services/gift';
import GiftListItem from './GiftListItem';
import GiftAssignmentModal from './GiftAssignmentModal';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faThLarge, faPlus, faFilter } from '@fortawesome/free-solid-svg-icons';

const GiftList = ({ eventId, guestId, isOrganizer = false, isPublic = false }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [myReservations, setMyReservations] = useState([]);

  useEffect(() => {
    fetchGifts();
  }, [eventId, guestId, statusFilter]);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (guestId) params.guestId = guestId;

      const response = await getAllGifts(eventId, params);
      if (response.data && response.data.success) {
        setGifts(response.data.data);
        
        // Extraire les réservations de l'invité actuel
        if (guestId) {
          const reservations = response.data.data
            .filter(gift => gift.isReservedByCurrentGuest)
            .map(gift => ({
              giftId: gift._id,
              giftName: gift.name,
              quantity: gift.currentGuestReservation ? gift.currentGuestReservation.quantity : 0
            }));
          setMyReservations(reservations);
        }
      } else {
        setError('Erreur lors de la récupération des cadeaux');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de la récupération des cadeaux:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (gift) => {
    setSelectedGift(gift);
    setShowAssignModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    fetchGifts(); // Rafraîchir la liste après réservation
  };

  const renderGiftGrid = () => {
    if (gifts.length === 0) {
      return (
        <div className="no-gifts">
          <p>Aucun cadeau n'est disponible pour le moment.</p>
          {isOrganizer && (
            <Link to={`/events/${eventId}/gifts/create`} className="create-link">
              Ajouter un cadeau
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="gifts-grid">
        {gifts.map(gift => (
          <GiftListItem
            key={gift._id}
            gift={gift}
            isOrganizer={isOrganizer}
            guestId={guestId}
            onAssign={() => handleAssign(gift)}
            isPublic={isPublic}
            viewMode="grid"
            fetchGifts={fetchGifts}
          />
        ))}
      </div>
    );
  };

  const renderGiftTable = () => {
    if (gifts.length === 0) {
      return (
        <div className="no-gifts">
          <p>Aucun cadeau n'est disponible pour le moment.</p>
          {isOrganizer && (
            <Link to={`/events/${eventId}/gifts/create`} className="create-link">
              Ajouter un cadeau
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="gifts-table-container">
        <table className="gifts-table">
          <thead>
            <tr>
              <th></th>
              <th>Nom</th>
              <th>Description</th>
              <th>Quantité</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map(gift => (
              <GiftListItem
                key={gift._id}
                gift={gift}
                isOrganizer={isOrganizer}
                guestId={guestId}
                onAssign={() => handleAssign(gift)}
                isPublic={isPublic}
                viewMode="list"
                fetchGifts={fetchGifts}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMyReservations = () => {
    if (!guestId || myReservations.length === 0) return null;

    return (
      <div className="my-reservations">
        <h3>Mes réservations</h3>
        {myReservations.length === 0 ? (
          <p className="no-reservations-message">Vous n'avez pas encore réservé de cadeau.</p>
        ) : (
          <ul className="my-reservations-list">
            {myReservations.map(reservation => (
              <li key={reservation.giftId} className="my-reservation-item">
                <span className="item-name">{reservation.giftName}</span>
                <span className="item-quantity">Quantité: {reservation.quantity}</span>
                <span 
                  className="unreserve-link"
                  onClick={() => {
                    const gift = gifts.find(g => g._id === reservation.giftId);
                    if (gift) handleAssign(gift);
                  }}
                >
                  Modifier
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">Chargement de la liste de cadeaux...</div>;
  if (error) return <div className="error-message">Erreur: {error}</div>;

  return (
    <div className="gift-list-container">
      {!isPublic && (
        <div className="gift-list-header">
          <h2>Liste de cadeaux</h2>
          {isOrganizer && (
            <Link to={`/events/${eventId}/gifts/create`} className="create-button">
              <FontAwesomeIcon icon={faPlus} />&nbsp;Ajouter un cadeau
            </Link>
          )}
        </div>
      )}

      {!isPublic && (
        <div className="gift-list-filters">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les cadeaux</option>
            <option value="available">Disponibles</option>
            <option value="partially">Partiellement réservés</option>
            <option value="reserved">Entièrement réservés</option>
          </select>

          {isOrganizer && (
            <div className="view-toggle">
              <button
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Affichage en grille"
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
              <button
                className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="Affichage en liste"
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>
          )}
        </div>
      )}

      {isPublic && (
        <div className="gift-public-header">
          <h3>Liste de cadeaux</h3>
          <p>Si vous souhaitez nous offrir un cadeau, voici quelques idées. Cliquez sur "Je l'apporte" pour réserver un cadeau.</p>
          <div className="gift-list-instructions">
            <p>Les éléments grisés sont déjà réservés par d'autres invités.</p>
          </div>
        </div>
      )}

      {isPublic ? (
        <div className="gift-public-grid">
          {gifts.map(gift => (
            <GiftListItem
              key={gift._id}
              gift={gift}
              isOrganizer={false}
              guestId={guestId}
              onAssign={() => handleAssign(gift)}
              isPublic={true}
              viewMode="grid"
              fetchGifts={fetchGifts}
            />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        renderGiftGrid()
      ) : (
        renderGiftTable()
      )}

      {renderMyReservations()}

      {showAssignModal && selectedGift && (
        <GiftAssignmentModal
          gift={selectedGift}
          eventId={eventId}
          guestId={guestId}
          onClose={() => setShowAssignModal(false)}
          onComplete={handleAssignmentComplete}
        />
      )}
    </div>
  );
};

export default GiftList;