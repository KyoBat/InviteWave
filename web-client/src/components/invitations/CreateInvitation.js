// src/components/invitations/CreateInvitation.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestService, eventService, invitationService } from '../../services';

const CreateInvitation = () => {
  const [guests, setGuests] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    selectedGuests: [],
    message: '',
    sendMethod: 'email'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  
  const { eventId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);
        
        // Fetch guests
        const guestsData = await guestService.getGuests();
        setGuests(guestsData);
        
        // Initialize default message
        setFormData(prev => ({
          ...prev,
          message: `You're invited to ${eventData.name}!`
        }));
      } catch (error) {
        setError('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleSelectGuest = (guestId) => {
    setFormData(prev => {
      const updatedSelection = prev.selectedGuests.includes(guestId)
        ? prev.selectedGuests.filter(id => id !== guestId)
        : [...prev.selectedGuests, guestId];
      
      return {
        ...prev,
        selectedGuests: updatedSelection
      };
    });
  };

  const handleSelectAll = () => {
    if (formData.selectedGuests.length === filteredGuests.length) {
      // Deselect all
      setFormData(prev => ({ ...prev, selectedGuests: [] }));
    } else {
      // Select all filtered guests
      setFormData(prev => ({
        ...prev,
        selectedGuests: filteredGuests.map(guest => guest._id)
      }));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleMessageChange = (e) => {
    setFormData(prev => ({
      ...prev,
      message: e.target.value
    }));
  };

  const handleSendMethodChange = (e) => {
    setFormData(prev => ({
      ...prev,
      sendMethod: e.target.value
    }));
  };

  const nextStep = () => {
    if (formData.selectedGuests.length === 0) {
      setError('Please select at least one guest');
      return;
    }
    
    setError('');
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedGuests.length === 0) {
      setError('Please select at least one guest');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter a invitation message');
      return;
    }

    setError('');
    setCreating(true);
    
    try {
      if (!eventId) {
        throw new Error('Event ID is missing');
      }

      await invitationService.createInvitations(eventId, {
        guestIds: formData.selectedGuests,
        message: formData.message,
        sendMethod: formData.sendMethod
      });
      
      navigate(`/events/${eventId}/invitations`);
    } catch (error) {
      setError(error.displayMessage || 'Failed to create invitations');
      console.error('Create invitation error:', error);
      setCreating(false);
    }
  };

  // Filter guests based on search term and category
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guest.phone && guest.phone.includes(searchTerm));
    
    const matchesCategory = selectedCategory === 'all' || guest.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...new Set(guests.map(guest => guest.category))];

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!event) {
    return <div className="error-message">Event not found</div>;
  }

  return (
    <div className="create-invitation-container">
      <h2>Create Invitations for {event.name}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="steps-indicator">
        <div className={`step ${step === 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Guests</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Customize Invitation</span>
        </div>
      </div>
      
      {step === 1 ? (
        <div className="select-guests-step">
          <div className="guest-list-filters">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>

            <div className="category-filter">
              <label htmlFor="category-select">Category:</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="category-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              className="select-all-button"
              onClick={handleSelectAll}
            >
              {formData.selectedGuests.length === filteredGuests.length && filteredGuests.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
          
          {guests.length === 0 ? (
            <div className="no-guests">
              <p>You don't have any guests yet.</p>
              <button 
                className="create-guest-button"
                onClick={() => navigate('/guests/create')}
              >
                Add Guests
              </button>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="no-results">
              <p>No guests match your search.</p>
            </div>
          ) : (
            <div className="guest-selection-grid">
              {filteredGuests.map(guest => (
                <div 
                  key={guest._id}
                  className={`guest-card ${formData.selectedGuests.includes(guest._id) ? 'selected' : ''}`}
                  onClick={() => handleSelectGuest(guest._id)}
                >
                  <div className="checkbox">
                    <input
                      type="checkbox"
                      checked={formData.selectedGuests.includes(guest._id)}
                      onChange={() => {}} // Handled by the div click
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className="guest-info">
                    <h3>{guest.name}</h3>
                    {guest.email && <div className="email">{guest.email}</div>}
                    {guest.phone && <div className="phone">{guest.phone}</div>}
                    <span className={`category-badge category-${guest.category}`}>
                      {guest.category.charAt(0).toUpperCase() + guest.category.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="step-actions">
            <span className="selection-count">
              {formData.selectedGuests.length} guest{formData.selectedGuests.length !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/events/${eventId}/invitations`)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="next-button"
              onClick={nextStep}
              disabled={formData.selectedGuests.length === 0}
            >
              Next: Customize Invitation
            </button>
          </div>
        </div>
      ) : (
        <div className="customize-invitation-step">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="message">Invitation Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleMessageChange}
                placeholder="Enter your invitation message"
                rows="6"
              />
            </div>
            
            <div className="form-group">
              <label>Send Method</label>
              <div className="send-method-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="email"
                    checked={formData.sendMethod === 'email'}
                    onChange={handleSendMethodChange}
                  />
                  Email
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="whatsapp"
                    checked={formData.sendMethod === 'whatsapp'}
                    onChange={handleSendMethodChange}
                  />
                  WhatsApp
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="both"
                    checked={formData.sendMethod === 'both'}
                    onChange={handleSendMethodChange}
                  />
                  Both (when available)
                </label>
              </div>
            </div>
            
            <div className="invitation-preview">
              <h3>Preview</h3>
              <div className="preview-content">
                <p className="preview-message">{formData.message}</p>
                <p className="preview-event-name"><strong>Event:</strong> {event.name}</p>
                <p className="preview-event-date">
                  <strong>Date:</strong> {new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </p>
                <p className="preview-event-time">
                  <strong>Time:</strong> {new Date(event.date).toLocaleTimeString('en-US', { 
                    hour: '2-digit', minute: '2-digit', hour12: true 
                  })}
                </p>
                <p className="preview-event-location"><strong>Location:</strong> {event.location.address}</p>
                <div className="preview-response-link">
                  <em>Guests will receive a unique link to respond to this invitation</em>
                </div>
              </div>
            </div>
            
            <div className="selected-summary">
              <p>Creating invitations for {formData.selectedGuests.length} guest{formData.selectedGuests.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="step-actions">
              <button
                type="button"
                className="back-button"
                onClick={prevStep}
              >
                Back to Guest Selection
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate(`/events/${eventId}/invitations`)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create-button"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Invitations'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateInvitation;