// src/components/auth/ResetPasswordForm.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services';

const ResetPasswordForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get token from URL query params
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      await authService.resetPassword(token, newPassword);
      setSuccessMessage('Password reset successful');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-form-container">
      <h2>Reset Password</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
        </div>
        
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Resetting...' : 'Set New Password'}
        </button>
      </form>
      
      <div className="form-links">
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
};

export default ResetPasswordForm;