// src/components/invitations/InvitationList.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { invitationService, eventService } from '../../services';
import InvitationListItem from './InvitationListItem';
import NotificationModal from '../common/NotificationModal';
import InvitationDetailsModal from './InvitationDetailsModal';

const InvitationList = () => {
  const [invitations, setInvitations] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInvitations, setSelectedInvitations] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({ title: '', message: '', type: 'info' });
  const [viewingInvitation, setViewingInvitation] = useState(null);
  
  const { eventId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);
        
        // Fetch invitations
        const invitationsData = await invitationService.getEventInvitations(eventId);
        setInvitations(invitationsData);
      } catch (error) {
        setError('Failed to load invitations');
        console.error('Error fetching invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const toggleInvitationSelection = (invitationId) => {
    setSelectedInvitations(prevSelected => {
      if (prevSelected.includes(invitationId)) {
        return prevSelected.filter(id => id !== invitationId);
      } else {
        return [...prevSelected, invitationId];
      }
    });
  };

  // Filter invitations based on search term and status filter
  const filteredInvitations = invitations.filter(invitation => {
    const guest = invitation.guest;

    if (!guest) return false;
    
    const matchesSearch = 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guest.phone && guest.phone.includes(searchTerm));
    
    let matchesFilter = true;
    
    switch (filter) {
      case 'pending':
        matchesFilter = invitation.status === 'pending';
        break;
      case 'sent':
        matchesFilter = invitation.status === 'sent';
        break;
      case 'failed':
        matchesFilter = invitation.status === 'failed';
        break;
      case 'yes':
        matchesFilter = invitation.response.status === 'yes';
        break;
      case 'no':
        matchesFilter = invitation.response.status === 'no';
        break;
      case 'maybe':
        matchesFilter = invitation.response.status === 'maybe';
        break;
      case 'not-responded':
        matchesFilter = invitation.response.status === 'pending';
        break;
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleSelectAll = () => {
    if (selectedInvitations.length === filteredInvitations.length) {
      // Deselect all
      setSelectedInvitations([]);
    } else {
      // Select all filtered invitations
      setSelectedInvitations(filteredInvitations.map(invitation => invitation._id));
    }
  };

  const handleSendInvitations = async () => {
    if (selectedInvitations.length === 0) {
      return;
    }
    
    try {
      setSending(true);
      setSendResult(null);
      
      const result = await invitationService.sendInvitations(eventId, selectedInvitations);
      
      // Update invitation status in the list
      setInvitations(prevInvitations => 
        prevInvitations.map(invitation => {
          if (result.results.success.includes(invitation._id)) {
            return { ...invitation, status: 'sent', sentAt: new Date() };
          } else if (result.results.failed.some(failed => failed.id === invitation._id)) {
            return { ...invitation, status: 'failed' };
          }
          return invitation;
        })
      );
      
      // Clear selection
      setSelectedInvitations([]);
      
      // Show result summary
      setSendResult({
        success: result.results.success.length,
        failed: result.results.failed.length,
        message: result.message
      });
    } catch (error) {
      setError('Failed to send invitations');
      console.error('Error sending invitations:', error);
    } finally {
      setSending(false);
    }
  };

  // Déplacer ces fonctions à l'intérieur du composant
  const handleViewInvitation = (invitation) => {
    setViewingInvitation(invitation);
    // Vous pourriez également ouvrir un modal ici
    setModalOpen(true);
    setModalInfo({
      title: 'Invitation Details',
      message: `
        Guest: ${invitation.guest?.name || 'N/A'}
        Send Method: ${invitation.sendMethod || 'N/A'}
        Status: ${invitation.status || 'N/A'}
        Response: ${invitation.response?.status || 'Pending'}
        ${invitation.response?.message ? `Message: ${invitation.response.message}` : ''}
      `,
      type: 'info'
    });
  };

  const handleSendInvitation = async (invitation) => {
    try {
      setSending(true);
      
      // Envoi d'une seule invitation
      const result = await invitationService.sendInvitations(eventId, [invitation._id]);
      
      // Mettre à jour l'état local pour refléter le changement
      setInvitations(prevInvitations => 
        prevInvitations.map(inv => {
          if (inv._id === invitation._id) {
            if (result.results.success.includes(invitation._id)) {
              return { ...inv, status: 'sent', sentAt: new Date().toISOString() };
            } else {
              // Trouver le message d'erreur spécifique pour cette invitation
              const failedItem = result.results.failed.find(item => item.id === invitation._id);
              const errorMsg = failedItem ? failedItem.error : 'Unknown error';
              return { ...inv, status: 'failed', failureReason: errorMsg };
            }
          }
          return inv;
        })
      );
      
    // Afficher une pop-up avec le résultat
    if (result.results.success.includes(invitation._id)) {
      setModalInfo({
        title: 'Success',
        message: `Invitation sent successfully to ${invitation.guest?.name || 'guest'}.`,
        type: 'success'
      });
    } else {
      // Trouver le message d'erreur spécifique
      const failedItem = result.results.failed.find(item => item.id === invitation._id);
      const errorMsg = failedItem ? failedItem.error : 'Unknown error occurred';
      
      setModalInfo({
        title: 'Invitation Failed',
        message: `Failed to send invitation to ${invitation.guest?.name || 'guest'}: ${errorMsg}`,
        type: 'error'
      });
    }
    setModalOpen(true);
    
  } catch (error) {
    console.error('Send invitation error:', error);
    
    // Message d'erreur plus spécifique si possible
    let errorMsg = 'Failed to send invitation';
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    // Afficher une pop-up d'erreur
    setModalInfo({
      title: 'Error',
      message: `${errorMsg}. ${error.code === 'EAUTH' ? 'Please check your email credentials in settings.' : ''}`,
      type: 'error'
    });
    setModalOpen(true);
  } finally {
    setSending(false);
  }
};

// Puis, ajoutez le composant Modal dans votre JSX


  if (loading) {
    return <div className="loading">Loading invitations...</div>;
  }

  if (!event) {
    return <div className="error-message">Event not found</div>;
  }

  return (
    <div className="invitation-list-container">
      <div className="invitation-list-header">
        <h2>Invitations for {event.name}</h2>
        <Link to={`/events/${eventId}/invitations/create`} className="create-button">
          Create Invitations
        </Link>
      </div>

      <div className="invitation-list-actions">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <NotificationModal
            isOpen={modalOpen}
            title={modalInfo.title}
            message={modalInfo.message}
            type={modalInfo.type}
            onClose={() => setModalOpen(false)}
          />
          {/* Modal de détails d'invitation */}
          <InvitationDetailsModal
            isOpen={viewingInvitation !== null}
            invitation={viewingInvitation}
            onClose={() => setViewingInvitation(null)}
          />
        </div>

        <div className="filter-container">
          <select
            value={filter}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All Invitations</option>
            <option value="pending">Pending Invitations</option>
            <option value="sent">Sent Invitations</option>
            <option value="failed">Failed Invitations</option>
            <option value="yes">Responded: Yes</option>
            <option value="no">Responded: No</option>
            <option value="maybe">Responded: Maybe</option>
            <option value="not-responded">Not Responded</option>
          </select>
        </div>

        <button
          className="select-all-button"
          onClick={handleSelectAll}
        >
          {selectedInvitations.length === filteredInvitations.length && filteredInvitations.length > 0
            ? 'Deselect All'
            : 'Select All'}
        </button>

        <button
          className="send-button"
          disabled={selectedInvitations.length === 0 || sending}
          onClick={handleSendInvitations}
        >
          {sending ? 'Sending...' : `Send Selected (${selectedInvitations.length})`}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {sendResult && (
        <div className={`send-result ${sendResult.failed > 0 ? 'has-failures' : 'success'}`}>
          <p>{sendResult.message}</p>
          {sendResult.failed > 0 && (
            <p>Some invitations failed to send. Please try again later.</p>
          )}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="no-invitations">
          <p>No invitations have been created for this event yet.</p>
          <Link to={`/events/${eventId}/invitations/create`} className="create-link">
            Create invitations now
          </Link>
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="no-results">
          <p>No invitations match your search or filter.</p>
        </div>
      ) : (
        <div className="invitation-list">
          <table className="invitation-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={
                      filteredInvitations.length > 0 &&
                      selectedInvitations.length === filteredInvitations.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Guest</th>
                <th>Contact</th>
                <th>Send Method</th>
                <th>Status</th>
                <th>Response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvitations.map(invitation => (
                <InvitationListItem
                  key={invitation._id}
                  invitation={invitation}
                  selected={selectedInvitations.includes(invitation._id)}
                  onSelect={() => toggleInvitationSelection(invitation._id)}
                  onView={() => handleViewInvitation(invitation)}
                  onSend={() => handleSendInvitation(invitation)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="invitation-stats">
        <div className="stat-item">
          <span className="stat-label">Total Invitations:</span>
          <span className="stat-value">{invitations.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Sent:</span>
          <span className="stat-value">{invitations.filter(inv => inv.status === 'sent').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending:</span>
          <span className="stat-value">{invitations.filter(inv => inv.status === 'pending').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Responses:</span>
          <span className="stat-value">
            {invitations.filter(inv => inv.response.status !== 'pending').length}
          </span>
        </div>
        <Link to={`/events/${eventId}/stats`} className="view-stats-link">
          View Detailed Statistics
        </Link>
      </div>
    </div>
  );
};

export default InvitationList;