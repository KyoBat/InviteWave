// src/components/events/EventDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { eventService } from '../../services';
import { invitationService } from '../../services';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import GiftManagement from '../gifts/GiftManagement';
import QuickStats from './QuickStats';
import '../../styles/QuickStats.css';

const EventDetail = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  
  // États pour la liste des invitations
  const [invitations, setInvitations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInvitations, setSelectedInvitations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    responses: 0
  });

  // État pour les statistiques des cadeaux
  const [giftStats, setGiftStats] = useState({
    total: 0,
    reserved: 0
  });
  
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventService.getEvent(id);
        setEvent(data);
      } catch (error) {
        setError('Failed to load event details');
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
    // Charger les statistiques de base au démarrage
    fetchInvitations();
    fetchGiftStats();
  }, [id]);
  
  // Charger les invitations lorsque l'onglet est sélectionné
  useEffect(() => {
    // Vérifier si on vient d'un formulaire de cadeau ou si activeTab est spécifié
    if (location.state && (location.state.fromGiftForm || location.state.activeTab === 2)) {
      setTabIndex(2); // Sélectionner l'onglet Gifts (index 2)
      
      // Important: nettoyer l'état après avoir appliqué la redirection
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Effet pour charger les données en fonction de l'onglet sélectionné
  useEffect(() => {
    // Si l'onglet Invitations est sélectionné, charger les invitations
    if (tabIndex === 1) {
      fetchInvitations();
    }
    
    // Si l'onglet Gifts est sélectionné, charger les statistiques des cadeaux
    if (tabIndex === 2) {
      fetchGiftStats();
    }
  }, [tabIndex, id]);
  
  const fetchInvitations = async () => {
    try {
      const data = await invitationService.getEventInvitations(id);
      setInvitations(data);
      
      // Calculer les statistiques
      const totalInvitations = data.length;
      const sentInvitations = data.filter(inv => inv.status === 'sent').length;
      const pendingInvitations = data.filter(inv => inv.status === 'pending').length;
      const responses = data.filter(inv => 
        inv.response && 
        (inv.response.status === 'yes' || inv.response.status === 'no' || inv.response.status === 'maybe')
      ).length;
      
      setStats({
        total: totalInvitations,
        sent: sentInvitations,
        pending: pendingInvitations,
        responses: responses
      });
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  // Fonction pour récupérer les statistiques des cadeaux
  const fetchGiftStats = async () => {
    try {
      // Vous devrez adapter cette partie selon votre API
      // Si vous n'avez pas d'endpoint spécifique, vous pouvez calculer à partir des données existantes
      
      // Exemple fictif - à remplacer par votre propre implémentation
      // const response = await fetch(`/api/events/${id}/gifts/stats`);
      // const data = await response.json();
      
      // Simulation de données pour l'exemple
      // Dans un cas réel, vous récupéreriez ces données de votre API
      setTimeout(() => {
        setGiftStats({
          total: 0, // Remplacer par le nombre réel de cadeaux
          reserved: 0  // Remplacer par le nombre réel de cadeaux réservés
        });
      }, 300);
      
    } catch (error) {
      console.error('Error fetching gift stats:', error);
    }
  };
  
  const handleDelete = async () => {
    try {
      setLoading(true);
      await eventService.deleteEvent(id);
      navigate('/events');
    } catch (error) {
      setError('Failed to delete event');
      console.error('Error deleting event:', error);
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const toggleSelectAll = () => {
    if (selectedInvitations.length === filteredInvitations.length) {
      setSelectedInvitations([]);
    } else {
      setSelectedInvitations(filteredInvitations.map(inv => inv._id || inv.id));
    }
  };
  
  const toggleSelectInvitation = (invitationId) => {
    if (selectedInvitations.includes(invitationId)) {
      setSelectedInvitations(selectedInvitations.filter(id => id !== invitationId));
    } else {
      setSelectedInvitations([...selectedInvitations, invitationId]);
    }
  };
  
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
  // Filtrer les invitations selon les critères de recherche et de filtre
  const filteredInvitations = invitations.filter(invitation => {
    // Filtre de recherche
    const guestName = invitation.guest?.name || '';
    const guestEmail = invitation.guest?.email || '';
    const searchMatch = 
      guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guestEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre de statut/réponse
    let statusMatch = true;
    switch (filter) {
      case 'pending':
        statusMatch = invitation.status === 'pending';
        break;
      case 'sent':
        statusMatch = invitation.status === 'sent';
        break;
      case 'failed':
        statusMatch = invitation.status === 'failed';
        break;
      case 'yes':
        statusMatch = invitation.response?.status === 'yes';
        break;
      case 'no':
        statusMatch = invitation.response?.status === 'no';
        break;
      case 'maybe':
        statusMatch = invitation.response?.status === 'maybe';
        break;
      case 'not-responded':
        statusMatch = invitation.status === 'sent' && 
                      (!invitation.response || invitation.response.status === 'pending');
        break;
      default:
        statusMatch = true;
    }
    
    return searchMatch && statusMatch;
  });
  
  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!event) {
    return <div className="not-found">Event not found</div>;
  }
  
  // Format date and time
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');
  
  // Assume organizer is current user (adapt according to your application logic)
  const isOrganizer = true;
  
  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };
  
  return (
    <div className="event-detail-container">
      <div className="event-detail-header">
        <h2>{event.name}</h2>
        
        <div className="event-actions">
          <Link to={`/events/${id}/edit`} className="edit-button">
            Edit Event
          </Link>
          <button 
            className="delete-button"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Event
          </button>
        </div>
      </div>
      
      <Tabs selectedIndex={tabIndex} onSelect={index => setTabIndex(index)}>
        <TabList>
          <Tab>Details</Tab>
          <Tab>Guests & Invitations</Tab>
          <Tab>Gifts</Tab>
        </TabList>
        
        <TabPanel>
          <div className="event-detail-content">
            <div className="event-detail-main">
              <div className="event-cover">
                {event.coverImage ? (
                  <img src={getCorrectImageUrl(event.coverImage)} alt={event.name} />
                ) : (
                  <div className="event-no-image">
                    <span>{event.name.substring(0, 7).toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              <div className="event-info">
                <div className="event-info-item">
                  <i className="calendar-icon"></i>
                  <div>
                    <strong>Date</strong>
                    <p>{formattedDate}</p>
                  </div>
                </div>
                
                <div className="event-info-item">
                  <i className="clock-icon"></i>
                  <div>
                    <strong>Time</strong>
                    <p>{formattedTime}</p>
                  </div>
                </div>
                
                <div className="event-info-item">
                  <i className="location-icon"></i>
                  <div>
                    <strong>Location</strong>
                    <p>{event.location.address}</p>
                  </div>
                </div>
                
                {event.theme && (
                  <div className="event-info-item">
                    <i className="theme-icon"></i>
                    <div>
                      <strong>Theme</strong>
                      <p>{event.theme}</p>
                    </div>
                  </div>
                )}
                
                <div className="event-info-item">
                  <i className="status-icon"></i>
                  <div>
                    <strong>Status</strong>
                    <p>
                      <span className={`status-badge status-badge-${event.status}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {event.description && (
                <div className="event-description">
                  <h3>Description</h3>
                  <p>{event.description}</p>
                </div>
              )}
            </div>
            
            <div className="event-detail-sidebar">
              {/* Intégration du composant QuickStats */}
              <QuickStats 
                eventId={id} 
                stats={{
                  totalGuests: stats.total,
                  attending: stats.responses,
                  notResponded: stats.pending,
                  totalGifts: giftStats.total,
                  reservedGifts: giftStats.reserved
                }} 
              />
              
              
            </div>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="invitation-list-container">
            <div className="invitation-list-header">
              <h2>Invitations for {event.name}</h2>
              <Link className="create-button" to={`/events/${id}/invitations/create`}>
                Create Invitations
              </Link>
            </div>
            
            <div className="invitation-list-actions">
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Search guests..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="filter-container">
                <select 
                  className="filter-select"
                  value={filter}
                  onChange={handleFilterChange}
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
                onClick={toggleSelectAll}
              >
                Select All
              </button>
              
              <button 
                className="send-button"
                disabled={selectedInvitations.length === 0}
              >
                Send Selected ({selectedInvitations.length})
              </button>
            </div>
            
            <div className="invitation-list">
              <table className="invitation-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input 
                        type="checkbox" 
                        checked={selectedInvitations.length === filteredInvitations.length && filteredInvitations.length > 0}
                        onChange={toggleSelectAll}
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
                  {filteredInvitations.map(invitation => {
                    const canBeSelected = invitation.status !== 'sent';
                    const isSelected = selectedInvitations.includes(invitation._id || invitation.id);
                    
                    return (
                      <tr key={invitation._id || invitation.id} className={isSelected ? 'selected' : ''}>
                        <td className="checkbox-column">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectInvitation(invitation._id || invitation.id)}
                            disabled={!canBeSelected}
                          />
                        </td>
                        <td className="guest-column">
                          <div className="guest-name">{invitation.guest?.name || 'Unknown Guest'}</div>
                        </td>
                        <td className="guest-contact">
                          {invitation.guest?.email && (
                            <div className="email">{invitation.guest.email}</div>
                          )}
                        </td>
                        <td className="send-method">
                          {invitation.guest?.email ? 'Email' : 'SMS'}
                        </td>
                        <td className={`status-column status-${invitation.status}`}>
                          <span className="status-text">{invitation.status}</span>
                          {invitation.sentAt && (
                            <div className="sent-date">{formatDate(invitation.sentAt)}</div>
                          )}
                        </td>
                        <td className={`response-column response-${invitation.response?.status || 'pending'}`}>
                          <span className="response-text">
                            {invitation.response?.status === 'yes' ? 'Attending' :
                             invitation.response?.status === 'no' ? 'Not Attending' :
                             invitation.response?.status === 'maybe' ? 'Maybe' :
                             'Awaiting Response'}
                          </span>
                          {invitation.response?.updatedAt && (
                            <div className="response-date">{formatDate(invitation.response.updatedAt)}</div>
                          )}
                        </td>
                        <td className="actions-column">
                          <button 
                            className="action-button view-button" 
                            title="View Details"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="invitation-stats">
              <div className="stat-item">
                <span className="stat-label">Total Invitations:</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sent:</span>
                <span className="stat-value">{stats.sent}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending:</span>
                <span className="stat-value">{stats.pending}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Responses:</span>
                <span className="stat-value">{stats.responses}</span>
              </div>
              <Link className="view-stats-link" to={`/events/${id}/stats`}>
                View Detailed Statistics
              </Link>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel>
          <GiftManagement isOrganizer={isOrganizer} enableReordering={isOrganizer} eventId={id} />
        </TabPanel>
      </Tabs>
      
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Event</h3>
            <p>Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;