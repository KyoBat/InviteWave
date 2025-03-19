// web-client/src/components/gifts/GiftManagement.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllGifts, reorderGifts } from '../../services/gift';
import GiftList from './GiftList';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLines, faSave, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

const generateReorderedGifts = (gifts) => {
  return gifts.map((gift, index) => ({
    id: gift._id,
    order: gift.order || index + 1,
    name: gift.name,
    isEssential: gift.isEssential,
    status: gift.status,
  }));
};

const GiftManagement = ({ eventId, guestId, isOrganizer = true, enableReordering = true }) => {
  const params = useParams();
  const effectiveEventId = eventId || params.eventId;
  const navigate = useNavigate();
  
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedGifts, setReorderedGifts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  const fetchGifts = async () => {
    if (!effectiveEventId) {
      setError("Missing event ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = guestId ? { guestId } : {};
      const response = await getAllGifts(effectiveEventId, params);
      if (response.data?.success) {
        setGifts(response.data.data);
        setReorderedGifts(generateReorderedGifts(response.data.data));
      } else {
        // Ne pas considérer une liste vide comme une erreur
        if (response.data?.data && response.data.data.length === 0) {
          setGifts([]);
          setReorderedGifts([]);
          setError(null);
        } else {
          setError("Error retrieving gifts");
        }
      }
    } catch (err) {
      // Ne pas afficher d'erreur pour une liste vide ou un nouvel événement
      if (err.response && err.response.status === 404) {
        setGifts([]);
        setReorderedGifts([]);
        setError(null);
      } else {
        setError(err.message || "An error occurred");
        console.error("Error retrieving gifts:", err);
      }
    } finally {
      setLoading(false);
      setInitialLoadAttempted(true);
    }
  };

  useEffect(() => {
    if (effectiveEventId) {
      fetchGifts();
    } else {
      setError("Missing event ID");
      setLoading(false);
      setInitialLoadAttempted(true);
    }
  }, [effectiveEventId, guestId]);

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;

    const items = [...reorderedGifts];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setReorderedGifts(items.map((item, index) => ({ ...item, order: index + 1 })));
  };

  const saveReordering = async () => {
    setIsSaving(true);
    try {
      const response = await reorderGifts(effectiveEventId, reorderedGifts.map(gift => ({ id: gift.id, order: gift.order })));
      if (response.data?.success) {
        setIsReorderMode(false);
        fetchGifts();
      } else {
        setError("Error saving order");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
      console.error("Error saving order:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelReordering = () => {
    setReorderedGifts(generateReorderedGifts(gifts));
    setIsReorderMode(false);
  };

  const handleEnterReorderMode = () => {
    if (gifts.length === 0) {
      // Alternative de ne pas activer le mode réorganisation s'il n'y a pas de cadeaux
      return;
    }
    setIsReorderMode(true);
  };

  const handleCreateGift = () => {
    navigate(`/events/${effectiveEventId}/gifts/create`);
  };

  // Afficher un état de chargement seulement lors du chargement initial
  if (loading && !initialLoadAttempted) return <div className="loading">Loading...</div>;

  // Message d'erreur seulement si ce n'est pas lié à une liste vide
  if (error) return <div className="error-message">Error: {error}</div>;

  // Afficher une interface minimale pour un nouvel événement
  if (gifts.length === 0 && initialLoadAttempted) {
    return (
      <div className="gift-management-container">
        <div className="gift-actions-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button 
            onClick={handleCreateGift} 
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
        
        <div className="no-gifts-message" style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          marginTop: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <p>No gifts found. {isOrganizer && 'Create your first gift!'}</p>
          <button 
            onClick={handleCreateGift}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#5c6bc0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
            Add Gift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gift-management-container">
      {isReorderMode ? (
        <div className="reorder-container">
          <div className="reorder-header">
            <h3>Reorder Gifts</h3>
            <p className="reorder-instructions">Drag and drop items to change their order.</p>
            
            <div className="reordering-actions">
              <button className="save-button" onClick={saveReordering} disabled={isSaving}>
                <FontAwesomeIcon icon={faSave} /> {isSaving ? 'Saving...' : 'Save Order'}
              </button>
              <button className="cancel-button" onClick={cancelReordering} disabled={isSaving}>
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
            </div>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="gifts">
              {(provided) => (
                <ul className="reorder-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {reorderedGifts.map((gift, index) => (
                    <Draggable key={gift.id} draggableId={gift.id} index={index}>
                      {(provided) => (
                        <li className="reorder-item" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <div className="reorder-grip"><FontAwesomeIcon icon={faGripLines} /></div>
                          <div className="reorder-content">
                            <span className="reorder-name">
                              {gift.isEssential && <span className="essential-tag">ESSENTIAL</span>}
                              {gift.name}
                            </span>
                            <span className={`reorder-status status-${gift.status}`}>
                              {gift.status === 'available' ? 'Available' : gift.status === 'partially' ? 'Partial' : 'Reserved'}
                            </span>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      ) : (
        <div className="gift-list-wrapper">
          <GiftList 
            providedEventId={effectiveEventId} 
            guestId={guestId} 
            isOrganizer={isOrganizer}
            onReorderClick={enableReordering && gifts.length > 0 ? handleEnterReorderMode : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default GiftManagement;