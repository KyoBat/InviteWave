// web-client/src/components/gifts/GiftManagement.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAllGifts, reorderGifts } from '../../services/gift';
import GiftList from './GiftList';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripLines, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

const GiftManagement = ({ 
  guestId, 
  isOrganizer = true,
  enableReordering = true 
}) => {
  const { eventId } = useParams();
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedGifts, setReorderedGifts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGifts();
  }, [eventId]);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (guestId) {
        params.guestId = guestId;
      }
      
      const response = await getAllGifts(eventId, params);
      if (response.data && response.data.success) {
        setGifts(response.data.data);
        // Initialiser la liste pour le réordonnement
        setReorderedGifts(response.data.data.map((gift, index) => ({
          id: gift._id,
          order: gift.order || index + 1,
          name: gift.name,
          isEssential: gift.isEssential,
          status: gift.status
        })));
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

  const handleDragEnd = (result) => {
    // Abandonner si abandonné en dehors de la zone
    if (!result.destination) return;
    
    // Abandonner si la position n'a pas changé
    if (result.destination.index === result.source.index) return;
    
    // Réorganiser la liste
    const items = Array.from(reorderedGifts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Mettre à jour les indices
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    setReorderedGifts(updatedItems);
  };

  const saveReordering = async () => {
    setIsSaving(true);
    try {
      const items = reorderedGifts.map(gift => ({
        id: gift.id,
        order: gift.order
      }));
      
      const response = await reorderGifts(eventId, items);
      if (response.data && response.data.success) {
        setIsReorderMode(false);
        fetchGifts();
      } else {
        setError('Erreur lors de la sauvegarde de l\'ordre');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de la sauvegarde de l\'ordre:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelReordering = () => {
    // Réinitialiser les changements
    setReorderedGifts(gifts.map((gift, index) => ({
      id: gift._id,
      order: gift.order || index + 1,
      name: gift.name,
      isEssential: gift.isEssential,
      status: gift.status
    })));
    setIsReorderMode(false);
  };

  if (loading && !isReorderMode) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error-message">Erreur: {error}</div>;

  return (
    <div className="gift-management-container">
      {isOrganizer && enableReordering && (
        <div className="reordering-controls">
          {isReorderMode ? (
            <div className="reordering-actions">
              <button 
                className="save-button"
                onClick={saveReordering}
                disabled={isSaving}
              >
                <FontAwesomeIcon icon={faSave} /> {isSaving ? 'Sauvegarde...' : 'Enregistrer l\'ordre'}
              </button>
              <button 
                className="cancel-button"
                onClick={cancelReordering}
                disabled={isSaving}
              >
                <FontAwesomeIcon icon={faTimes} /> Annuler
              </button>
            </div>
          ) : (
            <button 
              className="reorder-button"
              onClick={() => setIsReorderMode(true)}
            >
              Réorganiser les cadeaux
            </button>
          )}
        </div>
      )}
      
      {isReorderMode ? (
        <div className="reorder-container">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="gifts">
              {(provided) => (
                <ul
                  className="reorder-list"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {reorderedGifts.map((gift, index) => (
                    <Draggable key={gift.id} draggableId={gift.id} index={index}>
                      {(provided) => (
                        <li
                          className="reorder-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="reorder-grip">
                            <FontAwesomeIcon icon={faGripLines} />
                          </div>
                          <div className="reorder-content">
                            <span className="reorder-name">
                              {gift.isEssential && <span className="essential-tag">ESSENTIEL</span>}
                              {gift.name}
                            </span>
                            <span className={`reorder-status status-${gift.status}`}>
                              {gift.status === 'available' && 'Disponible'}
                              {gift.status === 'partially' && 'Partiel'}
                              {gift.status === 'reserved' && 'Réservé'}
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
        <GiftList 
          eventId={eventId} 
          guestId={guestId} 
          isOrganizer={isOrganizer} 
        />
      )}
    </div>
  );
};

export default GiftManagement;