// src/components/events/EventForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '../../services';

const EventForm = ({ isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: {
      address: '',
      coordinates: null
    },
    theme: '',
    coverImage: null
  });
  
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { id } = useParams();
  
  // If editing, fetch event data
  useEffect(() => {
    if (isEdit && id) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const event = await eventService.getEvent(id);
          
          // Extract time from date
          const eventDate = new Date(event.date);
          const dateString = eventDate.toISOString().split('T')[0];
          const timeString = eventDate.toTimeString().substr(0, 5);
          
          setFormData({
            name: event.name,
            description: event.description || '',
            date: dateString,
            time: timeString,
            location: {
              address: event.location.address,
              coordinates: event.location.coordinates
            },
            theme: event.theme || '',
            coverImage: event.coverImage || null
          });
          
          if (event.coverImage) {
            setPreviewImage(event.coverImage);
          }
        } catch (error) {
          setError('Failed to load event details');
          console.error('Error fetching event:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchEvent();
    }
  }, [isEdit, id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'address') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          address: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
    
    try {
      // Upload image
      const response = await eventService.uploadCoverImage(file);
      setFormData({
        ...formData,
        coverImage: response.imageUrl
      });
    } catch (error) {
      setError('Failed to upload image');
      console.error('Error uploading image:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.date || !formData.time || !formData.location.address) {
      setError('Please fill all required fields');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Combine date and time
      const dateObj = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':');
      dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      const eventData = {
        name: formData.name,
        description: formData.description,
        date: dateObj.toISOString(),
        location: {
          address: formData.location.address,
          coordinates: formData.location.coordinates
        },
        theme: formData.theme,
        coverImage: formData.coverImage
      };
      
      if (isEdit) {
        await eventService.updateEvent(id, eventData);
        // Rediriger vers la page de détails de l'événement après modification
        navigate(`/events/${id}`);
      } else {
        const response = await eventService.createEvent(eventData);
        // Si la création de l'événement renvoie un ID, rediriger vers ses détails
        if (response && response._id) {
          navigate(`/events/${response._id}`);
        } else {
          // Sinon, rediriger vers la liste des événements
          navigate('/events');
        }
      }
    } catch (error) {
      setError(error.displayMessage || `Failed to ${isEdit ? 'update' : 'create'} event`);
      console.error('Event form error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEdit) {
    return <div className="loading">Loading event data...</div>;
  }
  
  return (
    <div className="event-form-container">
      <h2>{isEdit ? 'Edit Event' : 'Create New Event'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Event Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter event name"
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
            placeholder="Enter event description"
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date*</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="time">Time*</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Location*</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.location.address}
            onChange={handleChange}
            placeholder="Enter event address"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="theme">Theme/Dress Code</label>
          <input
            type="text"
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleChange}
            placeholder="Enter theme or dress code"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="coverImage">Cover Image</label>
          <input
            type="file"
            id="coverImage"
            name="coverImage"
            onChange={handleImageChange}
            accept="image/*"
          />
          
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Event Cover Preview" />
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate('/events')}>
            Cancel
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;