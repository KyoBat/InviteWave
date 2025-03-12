// web-client/src/components/gifts/GiftManagement.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedGifts, setReorderedGifts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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
        setError("Error retrieving gifts");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
      console.error("Error retrieving gifts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveEventId) {
      fetchGifts();
    } else {
      setError("Missing event ID");
      setLoading(false);
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

  if (loading && !isReorderMode) return <div className="loading">Loading...</div>;

  return (
    <div className="gift-management-container">
      <div className="gift-management-header">
        {isOrganizer && (
          <div className="gift-management-actions">
            <Link 
              to={`/events/${effectiveEventId}/gifts/create`} 
              className="create-gift-button"
            >
              <FontAwesomeIcon icon={faPlus} /> Create Gift
            </Link>
            
            {enableReordering && (
              isReorderMode ? (
                <div className="reordering-actions">
                  <button className="save-button" onClick={saveReordering} disabled={isSaving}>
                    <FontAwesomeIcon icon={faSave} /> {isSaving ? 'Saving...' : 'Save Order'}
                  </button>
                  <button className="cancel-button" onClick={cancelReordering} disabled={isSaving}>
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                </div>
              ) : (
                <button className="reorder-button" onClick={() => setIsReorderMode(true)}>
                  Reorder Gifts
                </button>
              )
            )}
          </div>
        )}
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {isReorderMode ? (
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
      ) : (
        <div className="gift-list-wrapper">
          {gifts.length === 0 && !loading ? (
            <div className="no-gifts-message">
              <p>No gifts found. {isOrganizer && 'Create your first gift using the button above!'}</p>
            </div>
          ) : (
            <GiftList 
              providedEventId={effectiveEventId} 
              guestId={guestId} 
              isOrganizer={isOrganizer} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GiftManagement;