// src/components/guests/GuestForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { guestService } from '../../services';

const GuestForm = ({ isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'friends'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { id } = useParams();

  // If editing, fetch guest data
  useEffect(() => {
    if (isEdit && id) {
      const fetchGuest = async () => {
        try {
          setLoading(true);
          const guest = await guestService.getGuest(id);
          setFormData({
            name: guest.name,
            email: guest.email || '',
            phone: guest.phone || '',
            category: guest.category
          });
        } catch (error) {
          setError('Failed to load guest details');
          console.error('Error fetching guest:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchGuest();
    }
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      setError('Name is required');
      return;
    }
    
    if (!formData.email && !formData.phone) {
      setError('Either email or phone is required');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      if (isEdit) {
        await guestService.updateGuest(id, formData);
      } else {
        await guestService.createGuest(formData);
      }
      
      navigate('/guests');
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} guest`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="loading">Loading guest data...</div>;
  }

  return (
    <div className="guest-form-container">
      <h2>{isEdit ? 'Edit Guest' : 'Add New Guest'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter guest's full name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter guest's email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter guest's phone number"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="family">Family</option>
            <option value="friends">Friends</option>
            <option value="colleagues">Colleagues</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-note">
          <p>* Required fields</p>
          <p>Either email or phone is required</p>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate('/guests')}>
            Cancel
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Guest' : 'Add Guest'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuestForm;
