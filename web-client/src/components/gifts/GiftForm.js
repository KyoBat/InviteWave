import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createGift, getGiftById, updateGift } from '../../services/gift';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import config from '../../config';

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
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            setImagePreview(imageUrl);
          } else {
            // Sinon on construit l'URL complète
            setImagePreview(`${config.apiUrl}/uploads/${imageUrl}`);
          }
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Error loading gift:', err);
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
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setError('File size exceeds the limit of 2MB');
        return;
      }
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
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Gift name is required');
      }

      if (formData.quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      let response;

      // Si nous avons un nouveau fichier image
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description || '');
        formDataToSend.append('quantity', formData.quantity.toString());
        formDataToSend.append('isEssential', formData.isEssential.toString());
        formDataToSend.append('image', imageFile);
        
        if (isEditMode) {
          response = await updateGift(eventId, giftId, formDataToSend);
        } else {
          response = await createGift(eventId, formDataToSend);
        }
      } else {
        const dataToSend = {
          name: formData.name,
          description: formData.description || '',
          quantity: parseInt(formData.quantity),
          isEssential: formData.isEssential
        };
        
        if (isEditMode && formData.imageUrl) {
          dataToSend.imageUrl = formData.imageUrl;
        }
        
        if (isEditMode) {
          response = await updateGift(eventId, giftId, dataToSend);
        } else {
          response = await createGift(eventId, dataToSend);
        }
      }

      if (response.data && response.data.success) {
        navigate(`/events/${eventId}`, { 
          replace: true,
          state: { fromGiftForm: true, activeTab: 2 }
        });
      } else {
        throw new Error(response.data?.message || 'Error saving gift');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error saving gift:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/events/${eventId}`, { 
      replace: true,
      state: { activeTab: 2 }
    });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="gift-form-container">
      <h2>{isEditMode ? 'Edit Gift' : 'Add Gift'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="improved-gift-form">
        <div className="form-section">
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
              className="form-control"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description"
              rows="4"
              className="form-control"
            />
          </div>
        </div>

        <div className="form-section form-row-flex">
          <div className="form-group form-group-half">
            <label htmlFor="quantity">Quantity*</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
              className="form-control"
            />
          </div>

          <div className="form-group form-group-half">
            <label htmlFor="isEssential">Priority</label>
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="isEssential"
                name="isEssential"
                checked={formData.isEssential}
                onChange={handleChange}
                className="checkbox-input"
              />
              <label htmlFor="isEssential" className="checkbox-label">Mark as essential</label>
            </div>
          </div>
        </div>

        <div className="form-section">
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