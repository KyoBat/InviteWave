// src/components/guests/GuestListItem.js
import React from 'react';

const GuestListItem = ({ guest, onEdit, onDelete }) => {
  return (
    <tr className="guest-list-item">
      <td className="guest-name">{guest.name}</td>
      <td className="guest-email">{guest.email || '-'}</td>
      <td className="guest-phone">{guest.phone || '-'}</td>
      <td className="guest-category">
        <span className={`category-badge category-${guest.category}`}>
          {guest.category.charAt(0).toUpperCase() + guest.category.slice(1)}
        </span>
      </td>
      <td className="guest-actions">
        <button 
          className="edit-button"
          onClick={onEdit}
          aria-label="Edit guest"
        >
          Edit
        </button>
        <button 
          className="delete-button"
          onClick={onDelete}
          aria-label="Delete guest"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default GuestListItem;