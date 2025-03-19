// src/services/user.js
import api from './api';

const userService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },
  
  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/users/me/password', { currentPassword, newPassword });
    return response.data;
  },
  
  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/users/me/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }
};

export default userService;
