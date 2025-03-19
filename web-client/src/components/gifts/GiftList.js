import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGiftItems } from '../../services/gift';
import GiftListItem from './GiftListItem';
import GiftAssignmentModal from './GiftAssignmentModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faThLarge, faPlus, faSort } from '@fortawesome/free-solid-svg-icons';

const GiftList = ({ isOrganizer = false, providedEventId = null, guestId = null, isPublic = false, onReorderClick }) => {
  const { eventId: urlEventId } = useParams();
  const effectiveEventId = providedEventId || urlEventId;
  const navigate = useNavigate();

  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [myReservations, setMyReservations] = useState([]);
  const [filteredGifts, setFilteredGifts] = useState([]);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  // Fonction pour appliquer le filtre
  const applyFilter = (gifts, filter) => {
    if (!filter) return gifts;
    return gifts.filter(gift => gift.status === filter);
  };

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
        setFilteredGifts([]);
        setError('La liste de cadeaux n\'est pas disponible pour le moment.');
      } else {
        setError('Missing event ID');
      }
      
      setLoading(false);
      setInitialLoadAttempted(true);
      return;
    }
  
    try {
      setLoading(true);
      console.log('Fetching gifts for event:', effectiveId);
      const response = await getGiftItems(effectiveId);
      console.log('Gift items response:', response);
      
      // Vérifier la structure de la réponse
      if (response && response.data && Array.isArray(response.data.data)) {
        const giftsData = response.data.data;
        setGifts(giftsData);
        
        // Appliquer le filtre immédiatement
        setFilteredGifts(applyFilter(giftsData, statusFilter));
        
        // Extract current guest's reservations
        if (guestId && giftsData.length > 0) {
          console.log('Processing reservations for guest:', guestId);
          const reservations = giftsData
            .filter(gift => gift.isReservedByCurrentGuest)
            .map(gift => ({
              giftId: gift._id,
              giftName: gift.name,
              quantity: gift.currentGuestReservation ? gift.currentGuestReservation.quantity : 0,
            }));
          console.log('Extracted reservations:', reservations);
          setMyReservations(reservations);
        }
        setError(null);
      } else {
        // Si la structure n'est pas comme attendue, gérer proprement
        console.warn('Unexpected API response structure:', response);
        setGifts([]);
        setFilteredGifts([]);
        if (isPublic) {
          setError('Aucun cadeau n\'est disponible pour le moment.');
        } else {
          // Ne pas considérer une liste vide comme une erreur
          setError(null);
        }
      }
    } catch (err) {
      console.error('Error retrieving gifts:', err);
      
      // Ne pas afficher d'erreur pour une liste vide
      if (err.response && err.response.status === 404) {
        setGifts([]);
        setFilteredGifts([]);
        setError(null);
      } else {
        // Message d'erreur plus convivial en mode public
        if (isPublic) {
          setError('La liste de cadeaux n\'est pas disponible pour le moment.');
        } else {
          setError('Error retrieving gifts: ' + (err.message || 'Unknown error'));
        }
      }
    } finally {
      setLoading(false);
      setInitialLoadAttempted(true);
    }
  };

  // Charger les cadeaux au montage du composant
  useEffect(() => {
    fetchGifts();
  }, [effectiveEventId, guestId]);

  // Appliquer le filtre quand statusFilter change
  useEffect(() => {
    setFilteredGifts(applyFilter(gifts, statusFilter));
  }, [statusFilter, gifts]);

  const handleAssign = (gift) => {
    setSelectedGift(gift);
    setShowAssignModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    // Refresh list after reservation
    fetchGifts();
  };

  const handleAddGift = () => {
    // Use navigate to ensure proper routing context is maintained
    navigate(`/events/${effectiveEventId}/gifts/create`, {
      state: { returnToEvent: true }
    });
  };

  const handleReorderClick = () => {
    if (onReorderClick && typeof onReorderClick === 'function') {
      onReorderClick();
    }
  };

  const renderGiftGrid = () => {
    if (filteredGifts.length === 0) {
      return (
        <div className="no-gifts">
          <p>No gifts found matching the current filter.</p>
          {isOrganizer && (
            <button onClick={handleAddGift} className="create-link">
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
              Add a gift
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="gifts-grid">
        {filteredGifts.map(gift => (
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
    if (filteredGifts.length === 0) {
      return (
        <div className="no-gifts">
          <p>No gifts found matching the current filter.</p>
          {isOrganizer && (
            <button onClick={handleAddGift} className="create-link">
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
              Add a gift
            </button>
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
            {filteredGifts.map(gift => (
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

  // Afficher un état de chargement uniquement lors du chargement initial
  if (loading && !initialLoadAttempted) return <div className="loading">Loading gift list...</div>;
  
  // Afficher les erreurs seulement si ce n'est pas lié à une liste vide
  if (error) return <div className="error-message">Error: {error}</div>;

  // S'il n'y a pas de cadeaux et que la liste a été chargée avec succès
  if (gifts.length === 0 && initialLoadAttempted && !error) {
    return (
      <div className="gift-list-container">
        {/* Affichage des boutons d'action sans titre */}
        {!isPublic && isOrganizer && (
          <div className="gift-actions-bar" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: '20px' 
          }}>
            <button 
              onClick={handleAddGift} 
              className="gift-action-button add-gift-button"
              style={{
                backgroundColor: '#5c6bc0',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: 'pointer',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
              Add Gift
            </button>
          </div>
        )}

        <div className="no-gifts" style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <p>No gifts found. {isOrganizer && 'Create your first gift!'}</p>
          {isOrganizer && (
            <button 
              onClick={handleAddGift} 
              className="create-link" 
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#5c6bc0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
              Add a gift
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="gift-list-container">
      {/* Affichage des boutons d'action sans titre */}
      {!isPublic && isOrganizer && (
        <div className="gift-actions-bar">
          <button 
            onClick={handleAddGift} 
            className="gift-action-button add-gift-button"
          >
            <FontAwesomeIcon icon={faPlus} className="button-icon" />
            Add Gift
          </button>
          
          {onReorderClick && gifts.length > 0 && (
            <button 
              onClick={handleReorderClick}
              className="gift-action-button reorder-gift-button"
            >
              <FontAwesomeIcon icon={faSort} className="button-icon" />
              Reorder Gifts
            </button>
          )}
        </div>
      )}

      {/* Barre de filtres */}
      {!isPublic && gifts.length > 0 && (
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

      {/* En-tête pour mode public */}
      {isPublic && (
        <div className="gift-public-header">
          <h3>Gift List</h3>
          <p>If you'd like to give us a gift, here are some ideas. Click "I'll bring it" to reserve an item.</p>
          <div className="gift-list-instructions">
            <p>Greyed out items are already reserved by other guests.</p>
          </div>
        </div>
      )}

      {/* Affichage des cadeaux selon le mode (public, grid ou list) */}
      {isPublic ? (
        <div className="gift-public-grid">
          {filteredGifts.map(gift => (
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