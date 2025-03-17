// src/components/events/EventGuestList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { guestService } from '../../services';
import '../../styles/EventTabs.css'

const EventGuestList = ({ eventId }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        // Récupérer tous les invités et filtrer ceux de l'événement
        const allGuests = await guestService.getGuests();
        // Filtrer les invités associés à cet événement (ajustez selon votre modèle de données)
        const eventGuests = allGuests.filter(guest => guest.eventId === eventId);
        setGuests(eventGuests);
      } catch (error) {
        setError('Failed to load guests');
        console.error('Error fetching guests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, [eventId]);

  const handleDelete = async (id) => {
    setGuestToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await guestService.deleteGuest(guestToDelete);
      setGuests(guests.filter(guest => guest._id !== guestToDelete));
      setShowDeleteModal(false);
    } catch (error) {
      setError('Failed to delete guest');
      console.error('Error deleting guest:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleUpdateStatus = async (guestId, newStatus) => {
    try {
      // Mise à jour du statut RSVP
      const updatedGuest = await guestService.updateGuest(guestId, { rsvpStatus: newStatus });
      
      // Mise à jour de la liste locale
      setGuests(guests.map(guest => 
        guest._id === guestId ? { ...guest, rsvpStatus: newStatus } : guest
      ));
    } catch (error) {
      setError('Failed to update guest status');
      console.error('Error updating guest status:', error);
    }
  };

  // Filtrer les invités selon la recherche et le statut
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (guest.phone && guest.phone.includes(searchTerm));
    
    const matchesStatus = selectedStatus === 'all' || guest.rsvpStatus === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pour le développement, si la liste est vide, on ajoute quelques données fictives
  const hasNoGuests = guests.length === 0 && !loading;

  if (loading) {
    return <div className="loading">Loading guests...</div>;
  }

  return (
    <div className="event-guest-list-container">
      <div className="event-guest-list-header">
        <h3>Event Guests</h3>
        <div className="guest-actions">
          <Link to={`/events/${eventId}/guests/add`} className="add-guest-button">
            Add Guest
          </Link>
          <Link to={`/events/${eventId}/guests/import`} className="import-button">
            Import Guests
          </Link>
        </div>
      </div>

      <div className="event-guest-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="status-select"
          >
            <option value="all">All Statuses</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="pending">Pending</option>
            <option value="maybe">Maybe</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {hasNoGuests ? (
        <div className="no-guests">
          <p>No guests have been added to this event yet.</p>
          <Link to={`/events/${eventId}/guests/add`} className="add-link">
            Add your first guest
          </Link>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="no-results">
          <p>No guests match your search criteria.</p>
        </div>
      ) : (
        <div className="guest-list">
          <table className="guest-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Info</th>
                <th>RSVP Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map(guest => (
                <tr key={guest._id} className="guest-row">
                  <td className="guest-name">{guest.name}</td>
                  <td className="guest-contact">
                    {guest.email && <div className="guest-email">{guest.email}</div>}
                    {guest.phone && <div className="guest-phone">{guest.phone}</div>}
                  </td>
                  <td className="guest-rsvp">
                    <select
                      value={guest.rsvpStatus || 'pending'}
                      onChange={(e) => handleUpdateStatus(guest._id, e.target.value)}
                      className={`rsvp-select rsvp-${guest.rsvpStatus || 'pending'}`}
                    >
                      <option value="attending">Attending</option>
                      <option value="not_attending">Not Attending</option>
                      <option value="pending">Pending</option>
                      <option value="maybe">Maybe</option>
                    </select>
                  </td>
                  <td className="guest-actions">
                    <Link to={`/events/${eventId}/guests/${guest._id}/edit`} className="edit-button">
                      Edit
                    </Link>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(guest._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Remove Guest</h3>
            <p>Are you sure you want to remove this guest from the event? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={confirmDelete}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventGuestList;