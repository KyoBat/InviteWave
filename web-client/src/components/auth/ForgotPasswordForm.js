// src/components/auth/ForgotPasswordForm.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      await authService.forgotPassword(email);
      setSuccessMessage('Reset password email sent. Please check your inbox.');
      setEmail('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-form-container">
      <h2>Forgot Password</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
      
      <div className="form-links">
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;