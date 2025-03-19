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
        
        // Pré-remplir la réponse si déjà répondu
        if (data.invitation.response && data.invitation.response.status !== 'pending') {
          setResponse(data.invitation.response.status);
          setMessage(data.invitation.response.message || '');
          setSubmitted(true);
          setSubmitSuccess(true);
        }
        
        // Récupérer l'ID de l'invité
        if (data.invitation.guest && data.invitation.guest._id) {
          setGuestId(data.invitation.guest._id);
        }
        
        // Récupérer l'ID de l'événement
        const event = data.invitation.event;
        if (event) {
          const possibleId = event._id || event.id || event.eventId;
          
          if (possibleId) {
            setEventId(possibleId);
          } else if (event.name) {
            // Fallback temporaire si pas d'ID
            setEventId(event.name);
          }
        }
      } catch (error) {
        setError('Invitation introuvable ou expirée');
        console.error('Erreur lors de la récupération de l\'invitation:', error);
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
      setError('Veuillez sélectionner une réponse');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      if (!code) {
        throw new Error('Code d\'invitation manquant');
      }
      
      await invitationService.respondToInvitation(code, {
        status: response,
        message: message || ''
      });
      
      setSubmitted(true);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
      setError(error.displayMessage || 'Échec de l\'envoi de la réponse');
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
        <span>Chargement de l'invitation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-error-container">
        <div className="invitation-error">
          <h2>Oups !</h2>
          <p>{error}</p>
          <div className="error-illustration"></div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="invitation-not-found">
        <h2>Invitation introuvable</h2>
        <p>L'invitation que vous recherchez a peut-être été supprimée ou n'est plus disponible.</p>
      </div>
    );
  }

  // Formater la date et l'heure de l'événement
  const eventDate = new Date(invitation.event.date);
  const formattedDate = format(eventDate, 'EEEE, d MMMM yyyy');
  const formattedTime = format(eventDate, 'HH:mm');

  // Déterminer si l'invité a confirmé sa présence
  const isConfirmed = submitted && response === 'yes';

  // Fonction pour obtenir l'URL correcte de l'image
  const getCorrectImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // Si l'URL est déjà complète, la retourner directement
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Sinon, nettoyer l'URL et construire le chemin complet
    const cleanImageName = imageUrl.replace(/^\/?(uploads\/)?/, '');
    return `${process.env.REACT_APP || 'http://localhost:5001'}/uploads/${cleanImageName}`;
  };

  return (
    <div className="public-invitation-container">
      <div className="invitation-card">
        <div className="invitation-header">
          <h1>Vous êtes invité !</h1>
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
              <p className="invitation-message">{invitation.message || `Vous êtes cordialement invité à ${invitation.event.name}`}</p>
              
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
                <span>{invitation.event.location?.address || 'Adresse non spécifiée'}</span>
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
              <h3>Serez-vous présent ?</h3>
              
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
                    <span className="option-label">Oui, je serai présent(e) !</span>
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
                    <span className="option-label">Non, je ne pourrai pas venir</span>
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
                    <span className="option-label">Peut-être, je ne suis pas sûr(e)</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message (optionnel)</label>
                  <textarea
                    id="message"
                    name="message"
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Ajoutez un message personnel..."
                    rows="3"
                  />
                </div>
                
                <button type="submit" className="submit-button" disabled={!response || loading}>
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Envoi en cours...
                    </>
                  ) : (
                    'Envoyer ma réponse'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="response-confirmation">
              {submitSuccess ? (
                <>
                  <h3>Merci pour votre réponse !</h3>
                  <div className="response-summary">
                    <p>Vous avez répondu : <strong>
                      {response === 'yes' ? 'Présent(e)' : 
                       response === 'no' ? 'Absent(e)' : 
                       'Peut-être'}
                    </strong></p>
                    {message && (
                      <div className="response-message">
                        <p>Votre message :</p>
                        <blockquote>{message}</blockquote>
                      </div>
                    )}
                  </div>
                  <p className="host-notification">L'hôte a été notifié de votre réponse.</p>
                </>
              ) : (
                <>
                  <h3>Une erreur est survenue</h3>
                  <p>Nous n'avons pas pu enregistrer votre réponse. Veuillez réessayer ultérieurement.</p>
                  <button 
                    className="try-again-button"
                    onClick={() => setSubmitted(false)}
                  >
                    Réessayer
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Section liste de cadeaux */}
          {isConfirmed && (
            <div className="invitation-section gift-public-list">
              <div className="invitation-section-header">
                <h3>
                  <FontAwesomeIcon icon={faGift} className="section-icon" />
                  Liste de cadeaux
                </h3>
                <p>Si vous souhaitez nous offrir un cadeau, voici quelques idées.</p>
              </div>
              
              {/* Affichage de la liste de cadeaux */}
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
                  Chargement de la liste de cadeaux...
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="invitation-footer">
          <p>Envoyé à {invitation.guest.name}</p>
          <p className="powered-by">Propulsé par Event Planner App</p>
        </div>
      </div>
    </div>
  );
};

export default PublicInvitation;