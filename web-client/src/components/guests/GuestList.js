// src/components/guests/GuestList.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { guestService } from '../../services';
import GuestListItem from './GuestListItem';

const GuestList = ({ eventId }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const data = await guestService.getGuests();
        setGuests(data);
      } catch (error) {
        setError('Failed to load guests');
        console.error('Error fetching guests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

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

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
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
    return <div className="loading">Loading guests...</div>;
  }

  return (
    <div className="guest-list-container">
      <div className="guest-list-header">
        <h2>Your Guest List</h2>
        <Link to="/guests/create" className="create-button">
          Add New Guest
        </Link>
      </div>

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
      </div>

      {error && <div className="error-message">{error}</div>}

      {guests.length === 0 ? (
        <div className="no-guests">
          <p>You don't have any guests yet.</p>
          <Link to="/guests/create" className="create-link">
            Add your first guest
          </Link>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="no-results">
          <p>No guests match your search.</p>
        </div>
      ) : (
        <div className="guest-list">
          <table className="guest-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map(guest => (
                <GuestListItem
                  key={guest._id}
                  guest={guest}
                  onDelete={() => handleDelete(guest._id)}
                  onEdit={() => navigate(`/guests/${guest._id}/edit`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Guests Button */}
      <div className="import-container">
        <button 
          className="import-button"
          onClick={() => navigate('/guests/import')}
        >
          Import Guests
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Guest</h3>
            <p>Are you sure you want to delete this guest? This action cannot be undone.</p>
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;