// src/components/invitations/PublicInvitation.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { invitationService } from '../../services';
import { format } from 'date-fns';
import GiftList from '../gifts/GiftList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faMapMarkerAlt, 
  faCheck, 
  faTimes, 
  faQuestionCircle,
  faSpinner,
  faGift
} from '@fortawesome/free-solid-svg-icons';

const PublicInvitation = () => {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [guestId, setGuestId] = useState(null);
  const [eventId, setEventId] = useState(null);
  
  const { code } = useParams();

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true);
        
        const data = await invitationService.getInvitationByCode(code);
        setInvitation(data.invitation);
        
        // Pre-fill response if already responded
        if (data.invitation.response && data.invitation.response.status !== 'pending') {
          setResponse(data.invitation.response.status);
          setMessage(data.invitation.response.message || '');
          setSubmitted(true);
          setSubmitSuccess(true);
        }
        
        // Retrieve guest ID
        if (data.invitation.guest && data.invitation.guest._id) {
          setGuestId(data.invitation.guest._id);
        }
        
        // Retrieve event ID
        const event = data.invitation.event;
        if (event) {
          const possibleId = event._id || event.id || event.eventId;
          
          if (possibleId) {
            setEventId(possibleId);
          } else if (event.name) {
            // Temporary fallback if no ID
            setEventId(event.name);
          }
        }
      } catch (error) {
        setError('Invitation not found or has expired');
        console.error('Error retrieving invitation:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchInvitation();
  }, [code]);

  const handleResponseChange = (e) => {
    setResponse(e.target.value);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!response) {
      setError('Please select a response');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      if (!code) {
        throw new Error('Invitation code is missing');
      }
      
      await invitationService.respondToInvitation(code, {
        status: response,
        message: message || ''
      });
      
      setSubmitted(true);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting response:', error);
      setError(error.displayMessage || 'Failed to submit response');
      setSubmitSuccess(false);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (loading && !submitted) {
    return (
      <div className="loading-invitation">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <span>Loading invitation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-error-container">
        <div className="invitation-error">
          <h2>Oops!</h2>
          <p>{error}</p>
          <div className="error-illustration"></div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="invitation-not-found">
        <h2>Invitation Not Found</h2>
        <p>The invitation you're looking for might have been removed or is no longer available.</p>
      </div>
    );
  }

  // Format event date and time
  const eventDate = new Date(invitation.event.date);
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');

  // Determine if guest has confirmed attendance
  const isConfirmed = submitted && response === 'yes';

  // Function to get correct image URL
  const getCorrectImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // If URL is already complete, return it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Otherwise, clean the URL and build the complete path
    const cleanImageName = imageUrl.replace(/^\/?(uploads\/)?/, '');
    return `${process.env.REACT_APP || 'http://localhost:5001'}/uploads/${cleanImageName}`;
  };

  return (
    <div className="public-invitation-container">
      <div className="invitation-card">
        <div className="invitation-header">
          <h1>You're Invited!</h1>
          <h2>{invitation.event.name}</h2>
        </div>
        
        <div className="invitation-content">
          <div className="event-details">
          <div className="event-image">
            {invitation.event.coverImage ? (
              <img 
                src={getCorrectImageUrl(invitation.event.coverImage)} 
                alt={invitation.event.name}
                className="event-cover-image"
              />
            ) : (
              <div className="event-placeholder-image">
                <span>{invitation.event.name.substring(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>
            
            <div className="event-info">
              <p className="invitation-message">{invitation.message || `You are cordially invited to ${invitation.event.name}`}</p>
              
              <div className="info-item">
                <FontAwesomeIcon icon={faCalendarAlt} className="info-icon" />
                <span>{formattedDate}</span>
              </div>
              
              <div className="info-item">
                <FontAwesomeIcon icon={faClock} className="info-icon" />
                <span>{formattedTime}</span>
              </div>
              
              <div className="info-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="info-icon" />
                <span>{invitation.event.location?.address || 'Address not specified'}</span>
              </div>
              
              {invitation.event.description && (
                <div className="event-description">
                  <p>{invitation.event.description}</p>
                </div>
              )}
            </div>
          </div>
          
          {!submitted ? (
            <div className="response-form-container">
              <h3>Will you be attending?</h3>
              
              {error && <div className="error-message">{error}</div>}
              
              <form onSubmit={handleSubmit} className="response-form">
                <div className="response-options">
                  <label className={`response-option ${response === 'yes' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="response"
                      value="yes"
                      checked={response === 'yes'}
                      onChange={handleResponseChange}
                    />
                    <FontAwesomeIcon icon={faCheck} className="response-icon yes-icon" />
                    <span className="option-label">Yes, I'll be there!</span>
                  </label>
                  
                  <label className={`response-option ${response === 'no' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="response"
                      value="no"
                      checked={response === 'no'}
                      onChange={handleResponseChange}
                    />
                    <FontAwesomeIcon icon={faTimes} className="response-icon no-icon" />
                    <span className="option-label">No, I can't make it</span>
                  </label>
                  
                  <label className={`response-option ${response === 'maybe' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="response"
                      value="maybe"
                      checked={response === 'maybe'}
                      onChange={handleResponseChange}
                    />
                    <FontAwesomeIcon icon={faQuestionCircle} className="response-icon maybe-icon" />
                    <span className="option-label">Maybe, I'm not sure yet</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message (optional)</label>
                  <textarea
                    id="message"
                    name="message"
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Add a personal message..."
                    rows="3"
                  />
                </div>
                
                <button type="submit" className="submit-button" disabled={!response || loading}>
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
                    </>
                  ) : (
                    'Submit Response'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="response-confirmation">
              {submitSuccess ? (
                <>
                  <h3>Thank you for your response!</h3>
                  <div className="response-summary">
                    <p>You've responded: <strong>
                      {response === 'yes' ? 'Attending' : 
                       response === 'no' ? 'Not attending' : 
                       'Maybe attending'}
                    </strong></p>
                    {message && (
                      <div className="response-message">
                        <p>Your message:</p>
                        <blockquote>{message}</blockquote>
                      </div>
                    )}
                  </div>
                  <p className="host-notification">The host has been notified of your response.</p>
                </>
              ) : (
                <>
                  <h3>Something went wrong</h3>
                  <p>We couldn't record your response. Please try again later.</p>
                  <button 
                    className="try-again-button"
                    onClick={() => setSubmitted(false)}
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Gift list section */}
          {isConfirmed && (
            <div className="invitation-section gift-public-list">
              <div className="invitation-section-header">
                <h3>
                  <FontAwesomeIcon icon={faGift} className="section-icon" />
                  Gift Registry
                </h3>
                <p>If you would like to bring a gift, here are some ideas.</p>
              </div>
              
              {/* Display gift list */}
              {(eventId || invitation?.event) ? (
                <GiftList 
                  providedEventId={eventId} 
                  guestId={guestId} 
                  isOrganizer={false} 
                  isPublic={true} 
                />
              ) : (
                <div className="loading-message">
                  <FontAwesomeIcon icon={faSpinner} spin /> 
                  Loading gift registry...
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="invitation-footer">
          <p>Sent to {invitation.guest.name}</p>
          <p className="powered-by">Powered by Event Planner App</p>
        </div>
      </div>
    </div>
  );
};

export default PublicInvitation;