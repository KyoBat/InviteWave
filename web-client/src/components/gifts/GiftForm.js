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
        setError('Error retrieving gift data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error retrieving gift data:', err);
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
      
      // Create URL for preview
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
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Gift name is required');
      }
      
      if (formData.quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      
      // If an image file has been selected, upload it first
      let updatedImageUrl = formData.imageUrl;
      if (imageFile) {
        // Here you should implement file upload through your API
        // before continuing with gift creation/updating
        // For example:
        // const uploadResponse = await uploadImage(eventId, imageFile);
        // updatedImageUrl = uploadResponse.data.imageUrl;
        
        // For this example, we'll simply use the preview URL
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
        // Redirect to gift list after success
        navigate(`/events/${eventId}/gifts`);
      } else {
        throw new Error('Error saving gift');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error saving gift:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/events/${eventId}/gifts`);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="gift-form-container">
      <h2>{isEditMode ? 'Edit Gift' : 'Add Gift'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Gift name"
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
            placeholder="Detailed description"
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity*</label>
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
            <label htmlFor="isEssential">Priority</label>
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="isEssential"
                name="isEssential"
                checked={formData.isEssential}
                onChange={handleChange}
              />
              <label htmlFor="isEssential" className="checkbox-label">Mark as essential</label>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Image (optional)</label>
          <div className="file-input-container">
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            <label htmlFor="image" className="file-input-label">
              <FontAwesomeIcon icon={faUpload} /> Choose an image
            </label>
          </div>
          <p className="form-note">Recommended format: JPG or PNG, max size: 2MB</p>
          
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
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
            <FontAwesomeIcon icon={faTimes} /> Cancel
          </button>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={saving}
          >
            <FontAwesomeIcon icon={faSave} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GiftForm;