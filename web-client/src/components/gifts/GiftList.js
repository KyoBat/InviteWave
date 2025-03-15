// web-client/src/components/gifts/GiftList.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftItems } from '../../services/gift';
import GiftListItem from './GiftListItem';
import GiftAssignmentModal from './GiftAssignmentModal';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faThLarge, faPlus } from '@fortawesome/free-solid-svg-icons';

const GiftList = ({ isOrganizer = false, providedEventId = null, guestId = null, isPublic = false }) => {
  const { eventId: urlEventId } = useParams();
  const effectiveEventId = providedEventId || urlEventId;

  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [myReservations, setMyReservations] = useState([]);

  // Define fetchGifts outside useEffect to reuse it
  const fetchGifts = async () => {
    console.log('fetchGifts called with:', {
      providedEventId, 
      urlEventId, 
      effectiveEventId: providedEventId || urlEventId,
      isPublic
    });
    
    const effectiveId = providedEventId || urlEventId;
    
    if (!effectiveId) {
      console.error('No event ID found', {
        providedEventId, 
        urlEventId
      });
      
      // Si nous sommes en mode public, essayons de continuer avec des données fictives ou un message
      if (isPublic) {
        console.log('Public mode detected, showing placeholder message instead of error');
        setGifts([]);
        setError('La liste de cadeaux n\'est pas disponible pour le moment.');
      } else {
        setError('Missing event ID');
      }
      
      setLoading(false);
      return;
    }
  
    try {
      setLoading(true);
      console.log('Fetching gifts for event:', effectiveId);
      const response = await getGiftItems(effectiveId);
      console.log('Gift items response:', response);
      
      // Vérifier la structure de la réponse
      if (response && response.data && Array.isArray(response.data.data)) {
        setGifts(response.data.data);
        
        // Extract current guest's reservations
        if (guestId && response.data.data.length > 0) {
          console.log('Processing reservations for guest:', guestId);
          const reservations = response.data.data
            .filter(gift => gift.isReservedByCurrentGuest)
            .map(gift => ({
              giftId: gift._id,
              giftName: gift.name,
              quantity: gift.currentGuestReservation ? gift.currentGuestReservation.quantity : 0,
            }));
          console.log('Extracted reservations:', reservations);
          setMyReservations(reservations);
        }
      } else {
        // Si la structure n'est pas comme attendue, gérer proprement
        console.warn('Unexpected API response structure:', response);
        setGifts([]);
        if (isPublic) {
          setError('Aucun cadeau n\'est disponible pour le moment.');
        } else {
          setError('Unexpected API response format');
        }
      }
  
      setError(null);
    } catch (err) {
      console.error('Error retrieving gifts:', err);
      
      // Message d'erreur plus convivial en mode public
      if (isPublic) {
        setError('La liste de cadeaux n\'est pas disponible pour le moment.');
      } else {
        setError('Error retrieving gifts: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Use fetchGifts in useEffect
  useEffect(() => {
    fetchGifts();
  }, [effectiveEventId, guestId, statusFilter]);

  const handleAssign = (gift) => {
    setSelectedGift(gift);
    setShowAssignModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    // Refresh list after reservation
    fetchGifts();
  };

  const renderGiftGrid = () => {
    if (gifts.length === 0) {
      return (
        <div className="no-gifts">
          <p>No gifts are available at this time.</p>
          {isOrganizer && (
            <Link to={`/events/${effectiveEventId}/gifts/create`} className="create-link">
              Add a gift
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
          <p>No gifts are available at this time.</p>
          {isOrganizer && (
            <Link to={`/events/${effectiveEventId}/gifts/create`} className="create-link">
              Add a gift
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
              <th>Name</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Status</th>
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
        <h3>My Reservations</h3>
        {myReservations.length === 0 ? (
          <p className="no-reservations-message">You haven't reserved any gifts yet.</p>
        ) : (
          <ul className="my-reservations-list">
            {myReservations.map(reservation => (
              <li key={reservation.giftId} className="my-reservation-item">
                <span className="item-name">{reservation.giftName}</span>
                <span className="item-quantity">Quantity: {reservation.quantity}</span>
                <span 
                  className="unreserve-link"
                  onClick={() => {
                    const gift = gifts.find(g => g._id === reservation.giftId);
                    if (gift) handleAssign(gift);
                  }}
                >
                  Modify
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">Loading gift list...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="gift-list-container">
      {!isPublic && (
        <div className="gift-list-header">
          <h2>Gift List</h2>
          {isOrganizer && (
            <Link to={`/events/${effectiveEventId}/gifts/create`} className="create-button">
              <FontAwesomeIcon icon={faPlus} />&nbsp;Add Gift
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
            aria-label="Filter by status"
          >
            <option value="">All Gifts</option>
            <option value="available">Available</option>
            <option value="partially">Partially Reserved</option>
            <option value="reserved">Fully Reserved</option>
          </select>

          {isOrganizer && (
            <div className="view-toggle">
              <button
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
              <button
                className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>
          )}
        </div>
      )}

      {isPublic && (
        <div className="gift-public-header">
          <h3>Gift List</h3>
          <p>If you'd like to give us a gift, here are some ideas. Click "I'll bring it" to reserve an item.</p>
          <div className="gift-list-instructions">
            <p>Greyed out items are already reserved by other guests.</p>
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
          eventId={effectiveEventId}
          guestId={guestId}
          onClose={() => setShowAssignModal(false)}
          onComplete={handleAssignmentComplete}
        />
      )}
    </div>
  );
};

export default GiftList;