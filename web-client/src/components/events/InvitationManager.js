// src/components/events/InvitationManager.js
import React, { useState, useEffect } from 'react';
import { invitationService, guestService } from '../../services';
import '../../styles/EventTabs.css'

const InvitationManager = ({ eventId }) => {
  const [invitations, setInvitations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    opened: 0,
    responded: 0,
    responseRate: 0
  });
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [invitationTemplate, setInvitationTemplate] = useState('default');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Utiliser getEventInvitations au lieu de getInvitationsByEvent
        const invitationsData = await invitationService.getEventInvitations(eventId);
        const guestsData = await guestService.getGuests();
        
        // Filtrer les invités pour cet événement (ajustez selon votre modèle de données)
        const eventGuests = guestsData.filter(guest => guest.eventId === eventId);
        
        setInvitations(invitationsData);
        setGuests(eventGuests);
        
        // Calculer les statistiques
        const total = invitationsData.length;
        const sent = invitationsData.filter(inv => inv.status === 'sent').length;
        const opened = invitationsData.filter(inv => inv.opened).length;
        const responded = invitationsData.filter(inv => inv.responseStatus !== 'pending').length;
        
        setStats({
          total,
          sent,
          opened,
          responded,
          responseRate: sent > 0 ? Math.round((responded / sent) * 100) : 0
        });
      } catch (error) {
        setError('Failed to load invitation data');
        console.error('Error fetching invitation data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);

  const handleSendInvitations = async () => {
    if (selectedGuests.length === 0) return;
    
    try {
      setLoading(true);
      // Création des invitations puis envoi
      const invitationData = {
        guests: selectedGuests,
        template: invitationTemplate
      };
      
      // Créer d'abord les invitations
      const createdInvitations = await invitationService.createInvitations(eventId, invitationData);
      
      // Puis les envoyer
      const invitationIds = createdInvitations.map(inv => inv._id || inv.id);
      await invitationService.sendInvitations(eventId, invitationIds);
      
      // Rafraîchir les données après l'envoi
      const updatedInvitations = await invitationService.getEventInvitations(eventId);
      setInvitations(updatedInvitations);
      
      // Recalculer les statistiques
      const total = updatedInvitations.length;
      const sent = updatedInvitations.filter(inv => inv.status === 'sent').length;
      const opened = updatedInvitations.filter(inv => inv.opened).length;
      const responded = updatedInvitations.filter(inv => inv.responseStatus !== 'pending').length;
      
      setStats({
        total,
        sent,
        opened,
        responded,
        responseRate: sent > 0 ? Math.round((responded / sent) * 100) : 0
      });
      
      setShowSendModal(false);
      setSelectedGuests([]);
    } catch (error) {
      setError('Failed to send invitations');
      console.error('Error sending invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      // Appel à l'API pour renvoyer l'invitation
      await invitationService.resendInvitation(invitationId);
      
      // Mettre à jour l'état local
      setInvitations(invitations.map(inv => 
        inv._id === invitationId 
          ? { ...inv, resent: true, lastSentAt: new Date().toISOString() } 
          : inv
      ));
    } catch (error) {
      setError('Failed to resend invitation');
      console.error('Error resending invitation:', error);
    }
  };

  const getGuestWithNoInvitation = () => {
    // Trouver les invités qui n'ont pas encore d'invitation
    const invitedGuestIds = invitations.map(inv => inv.guestId);
    return guests.filter(guest => !invitedGuestIds.includes(guest._id));
  };

  const handleGuestSelection = (guestId) => {
    if (selectedGuests.includes(guestId)) {
      setSelectedGuests(selectedGuests.filter(id => id !== guestId));
    } else {
      setSelectedGuests([...selectedGuests, guestId]);
    }
  };

  const handleSelectAllGuests = () => {
    const availableGuests = getGuestWithNoInvitation();
    setSelectedGuests(availableGuests.map(guest => guest._id));
  };

  const handleDeselectAllGuests = () => {
    setSelectedGuests([]);
  };

  // Fonction pour obtenir le nom de l'invité à partir de son ID
  const getGuestName = (guestId) => {
    const guest = guests.find(g => g._id === guestId);
    return guest ? guest.name : 'Unknown Guest';
  };

  if (loading) {
    return <div className="loading">Loading invitation data...</div>;
  }

  return (
    <div className="invitation-manager-container">
      <div className="invitation-header">
        <h3>Invitations</h3>
        <button 
          className="send-invitations-button"
          onClick={() => setShowSendModal(true)}
          disabled={getGuestWithNoInvitation().length === 0}
        >
          Send Invitations
        </button>
      </div>

      <div className="invitation-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Invitations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.sent}</div>
          <div className="stat-label">Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.opened}</div>
          <div className="stat-label">Opened</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.responded}</div>
          <div className="stat-label">Responded</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.responseRate}%</div>
          <div className="stat-label">Response Rate</div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {invitations.length === 0 ? (
        <div className="no-invitations">
          <p>No invitations have been sent yet.</p>
          <button 
            className="send-first-invitation"
            onClick={() => setShowSendModal(true)}
            disabled={guests.length === 0}
          >
            Send your first invitation
          </button>
        </div>
      ) : (
        <div className="invitation-list">
          <table className="invitation-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Status</th>
                <th>Sent On</th>
                <th>Opened</th>
                <th>Response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map(invitation => (
                <tr key={invitation._id || invitation.id} className="invitation-row">
                  <td className="invitation-guest">{getGuestName(invitation.guestId)}</td>
                  <td className="invitation-status">
                    <span className={`status-badge status-${invitation.status}`}>
                      {invitation.status === 'sent' ? 'Sent' : 'Draft'}
                    </span>
                  </td>
                  <td className="invitation-sent-date">
                    {invitation.sentAt 
                      ? new Date(invitation.sentAt).toLocaleDateString() 
                      : '-'}
                  </td>
                  <td className="invitation-opened">
                    {invitation.opened ? 'Yes' : 'No'}
                  </td>
                  <td className="invitation-response">
                    <span className={`response-badge response-${invitation.responseStatus}`}>
                      {invitation.responseStatus === 'attending' ? 'Attending' :
                       invitation.responseStatus === 'not_attending' ? 'Not Attending' :
                       invitation.responseStatus === 'maybe' ? 'Maybe' : 'Pending'}
                    </span>
                  </td>
                  <td className="invitation-actions">
                    <button 
                      className="resend-button"
                      onClick={() => handleResendInvitation(invitation._id || invitation.id)}
                      disabled={invitation.status !== 'sent'}
                    >
                      Resend
                    </button>
                    <button className="preview-button">
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal pour envoyer des invitations */}
      {showSendModal && (
        <div className="modal-overlay">
          <div className="modal-content send-invitation-modal">
            <h3>Send Invitations</h3>
            
            <div className="invitation-template-selection">
              <h4>Choose a Template</h4>
              <div className="template-options">
                <div 
                  className={`template-option ${invitationTemplate === 'default' ? 'selected' : ''}`}
                  onClick={() => setInvitationTemplate('default')}
                >
                  <div className="template-preview default-template"></div>
                  <div className="template-name">Default</div>
                </div>
                <div 
                  className={`template-option ${invitationTemplate === 'formal' ? 'selected' : ''}`}
                  onClick={() => setInvitationTemplate('formal')}
                >
                  <div className="template-preview formal-template"></div>
                  <div className="template-name">Formal</div>
                </div>
                <div 
                  className={`template-option ${invitationTemplate === 'casual' ? 'selected' : ''}`}
                  onClick={() => setInvitationTemplate('casual')}
                >
                  <div className="template-preview casual-template"></div>
                  <div className="template-name">Casual</div>
                </div>
              </div>
            </div>
            
            <div className="guest-selection">
              <h4>Select Guests</h4>
              {getGuestWithNoInvitation().length === 0 ? (
                <p className="all-invited">All guests have been invited already.</p>
              ) : (
                <>
                  <div className="guest-selection-list">
                    {getGuestWithNoInvitation().map(guest => (
                      <div key={guest._id} className="guest-selection-item">
                        <input 
                          type="checkbox"
                          id={`guest-${guest._id}`}
                          checked={selectedGuests.includes(guest._id)}
                          onChange={() => handleGuestSelection(guest._id)}
                        />
                        <label htmlFor={`guest-${guest._id}`}>
                          {guest.name} ({guest.email || 'No email'})
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="guest-selection-actions">
                    <button 
                      className="select-all-button"
                      onClick={handleSelectAllGuests}
                    >
                      Select All
                    </button>
                    <button 
                      className="deselect-all-button"
                      onClick={handleDeselectAllGuests}
                    >
                      Deselect All
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowSendModal(false)}
              >
                Cancel
              </button>
              <button 
                className="send-button"
                onClick={handleSendInvitations}
                disabled={selectedGuests.length === 0}
              >
                Send Invitations ({selectedGuests.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationManager;