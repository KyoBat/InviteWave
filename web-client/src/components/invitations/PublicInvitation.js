// Mise à jour complète de PublicInvitation.js pour résoudre les problèmes avec la liste de cadeaux

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { invitationService } from '../../services';
import { format } from 'date-fns';
import GiftList from '../gifts/GiftList';

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
        console.log('Fetching invitation with code:', code);
        const data = await invitationService.getInvitationByCode(code);
        console.log('Invitation data received:', data);
        setInvitation(data.invitation);
        
        // Pre-fill response if already responded
        if (data.invitation.response.status !== 'pending') {
          setResponse(data.invitation.response.status);
          setMessage(data.invitation.response.message || '');
          setSubmitted(true);
          setSubmitSuccess(true);
        }
        
        // Récupérer l'ID de l'invité
        if (data.invitation.guest && data.invitation.guest._id) {
          setGuestId(data.invitation.guest._id);
          console.log('Guest ID set to:', data.invitation.guest._id);
        }
        
        // Examiner la structure complète de l'objet event
        console.log('Detailed event object structure:', data.invitation.event);
        console.log('Event object keys:', Object.keys(data.invitation.event));
        
        // Essayons de trouver l'ID de l'événement, peut-être sous un nom différent
        const event = data.invitation.event;
        if (event) {
          // Essayer plusieurs possibilités pour l'ID
          const possibleId = event._id || event.id || event.eventId;
          
          if (possibleId) {
            console.log('Found event ID:', possibleId);
            setEventId(possibleId);
          } else {
            // Si nous ne trouvons pas d'ID explicite, explorons toutes les propriétés
            for (const key in event) {
              console.log(`Event property ${key}:`, event[key]);
            }
            
            // S'il n'y a pas d'ID mais que nous avons besoin d'une valeur unique, utilisons le nom comme fallback temporaire
            if (event.name) {
              console.warn('No ID found, using event name as temporary identifier:', event.name);
              // Note: Ce n'est pas idéal mais peut fonctionner temporairement pour déboguer
              setEventId(event.name);
            }
          }
        } else {
          console.warn('Event object is missing or undefined:', data.invitation);
        }
      } catch (error) {
        setError('Invitation not found or has expired');
        console.error('Error fetching invitation:', error);
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
    return <div className="loading-invitation">Loading invitation...</div>;
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

  // Déterminer si l'invité a confirmé sa présence
  const isConfirmed = submitted && response === 'yes';

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
                <img src={invitation.event.coverImage} alt={invitation.event.name} />
              ) : (
                <div className="event-placeholder-image"></div>
              )}
            </div>
            
            <div className="event-info">
              <p className="invitation-message">{invitation.message}</p>
              
              <div className="info-item">
                <i className="calendar-icon"></i>
                <span>{formattedDate}</span>
              </div>
              
              <div className="info-item">
                <i className="clock-icon"></i>
                <span>{formattedTime}</span>
              </div>
              
              <div className="info-item">
                <i className="location-icon"></i>
                <span>{invitation.event.location.address}</span>
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
                  {loading ? 'Submitting...' : 'Submit Response'}
                </button>
              </form>
            </div>
          ) : (
            <div className="response-confirmation">
              {submitSuccess ? (
                <>
                  <h3>Thank you for your response!</h3>
                  <div className="response-summary">
                    <p>You've responded: <strong>{response.charAt(0).toUpperCase() + response.slice(1)}</strong></p>
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
          
          {/* Section liste de cadeaux */}
          {isConfirmed && (
            <div className="invitation-section gift-public-list">
              <div className="invitation-section-header">
                <h3>Liste de cadeaux</h3>
                <p>Si vous souhaitez nous offrir un cadeau, voici quelques idées.</p>
                <p className="debug-info" style={{color: 'gray', fontSize: '12px'}}>
                  Debug info - Event ID: {eventId ? eventId : 'non défini'}, Guest ID: {guestId ? guestId : 'non défini'}
                </p>
              </div>
              
              {/* Fallback: si nous n'avons pas d'event ID explicite mais avons les données d'invitation */}
              {(eventId || invitation?.event) ? (
                <GiftList 
                  providedEventId={eventId} 
                  guestId={guestId} 
                  isOrganizer={false} 
                  isPublic={true} 
                />
              ) : (
                <div className="loading-message">Chargement de la liste de cadeaux...</div>
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