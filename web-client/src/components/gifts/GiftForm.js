// web-client/src/components/gifts/GiftForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createGift, getGiftById, updateGift } from '../../services/gift';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';

const GiftForm = () => {
  const { eventId, giftId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.includes('/edit');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    isEssential: false,
    imageUrl: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (isEditMode && giftId) {
      fetchGiftData();
    }
  }, [isEditMode, giftId, eventId]);

  const fetchGiftData = async () => {
    try {
      const response = await getGiftById(eventId, giftId);
      if (response.data && response.data.success) {
        const { name, description, quantity, isEssential, imageUrl } = response.data.data;
        setFormData({
          name,
          description: description || '',
          quantity,
          isEssential: isEssential || false,
          imageUrl: imageUrl || ''
        });
        if (imageUrl) {
          setImagePreview(imageUrl);
        }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Créer une URL pour l'aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Valider le formulaire
      if (!formData.name.trim()) {
        throw new Error('Le nom du cadeau est requis');
      }
      
      if (formData.quantity < 1) {
        throw new Error('La quantité doit être au moins 1');
      }
      
      // Si un fichier image a été sélectionné, le télécharger d'abord
      let updatedImageUrl = formData.imageUrl;
      if (imageFile) {
        // Ici, vous devriez implémenter le téléchargement du fichier
        // via votre API avant de continuer avec la création/mise à jour du cadeau
        // Par exemple:
        // const uploadResponse = await uploadImage(eventId, imageFile);
        // updatedImageUrl = uploadResponse.data.imageUrl;
        
        // Pour cet exemple, nous allons simplement utiliser l'URL de prévisualisation
        updatedImageUrl = imagePreview;
      }
      
      const giftData = {
        ...formData,
        imageUrl: updatedImageUrl,
        quantity: parseInt(formData.quantity)
      };
      
      let response;
      if (isEditMode) {
        response = await updateGift(eventId, giftId, giftData);
      } else {
        response = await createGift(eventId, giftData);
      }
      
      if (response.data && response.data.success) {
        // Rediriger vers la liste des cadeaux après le succès
        navigate(`/events/${eventId}/gifts`);
      } else {
        throw new Error('Erreur lors de l\'enregistrement du cadeau');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Erreur lors de l\'enregistrement du cadeau:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/events/${eventId}/gifts`);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="gift-form-container">
      <h2>{isEditMode ? 'Modifier le cadeau' : 'Ajouter un cadeau'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nom*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nom du cadeau"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description détaillée"
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantité*</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="isEssential">Priorité</label>
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="isEssential"
                name="isEssential"
                checked={formData.isEssential}
                onChange={handleChange}
              />
              <label htmlFor="isEssential" className="checkbox-label">Marquer comme essentiel</label>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Image (optionnelle)</label>
          <div className="file-input-container">
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            <label htmlFor="image" className="file-input-label">
              <FontAwesomeIcon icon={faUpload} /> Choisir une image
            </label>
          </div>
          <p className="form-note">Format recommandé: JPG ou PNG, taille max: 2MB</p>
          
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Aperçu" />
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="cancel-button"
            disabled={saving}
          >
            <FontAwesomeIcon icon={faTimes} /> Annuler
          </button>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={saving}
          >
            <FontAwesomeIcon icon={faSave} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GiftForm;