// web-client/src/components/gifts/StandaloneGiftList.js
import React, { useState, useEffect } from 'react';
import { getGiftItems } from '../../services/gift';

const StandaloneGiftList = ({ eventId }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        setLoading(true);
        console.log('Récupération des cadeaux pour l\'événement:', eventId);
        const response = await getGiftItems(eventId);
        setGifts(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des cadeaux:', err);
        setError('Erreur lors de la récupération des cadeaux');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchGifts();
    } else {
      setError('ID d\'événement manquant');
      setLoading(false);
    }
  }, [eventId]);

  if (loading) return <div>Chargement des cadeaux...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  
  if (gifts.length === 0) {
    return <div>Aucun cadeau n'a encore été ajouté pour cet événement.</div>;
  }

  return (
    <div>
      <h3>Liste de cadeaux/objets</h3>
      <div>
        {gifts.map(gift => (
          <div key={gift._id} style={{ 
            border: '1px solid #ddd', 
            padding: '10px', 
            margin: '10px 0', 
            borderRadius: '4px' 
          }}>
            <h4>{gift.name}</h4>
            <p>{gift.description}</p>
            <div>Quantité: {gift.reservedQuantity || 0}/{gift.quantity}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StandaloneGiftList;