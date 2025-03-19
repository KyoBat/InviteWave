// src/components/invitations/InvitationListItem.js
import React from 'react';
import { formatDate } from '../../utils/dateUtils'; // Assuming you have this utility

const InvitationListItem = ({ invitation, selected, onSelect, onView, onSend }) => {
  const { guest, status, sentAt, response, sendMethod } = invitation;

  // Get appropriate status class for styling
  const getStatusClass = () => {
    switch (status) {
      case 'sent': return 'status-sent';
      case 'failed': return 'status-failed';
      default: return 'status-pending';
    }
  };

  // Get appropriate response class for styling
  const getResponseClass = () => {
    switch (response.status) {
      case 'yes': return 'response-yes';
      case 'no': return 'response-no';
      case 'maybe': return 'response-maybe';
      default: return 'response-pending';
    }
  };

  // Format response for display
  const getResponseText = () => {
    switch (response.status) {
      case 'yes': return 'Attending';
      case 'no': return 'Not Attending';
      case 'maybe': return 'Maybe';
      default: return 'Awaiting Response';
    }
  };

  return (
    <tr className={selected ? 'selected' : ''}>
      <td className="checkbox-column">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          disabled={status === 'sent'}
        />
      </td>
      <td className="guest-column">
        <div className="guest-name">{guest?.name || 'Guest'}</div>
        {guest?.group && <div className="guest-group">{guest.group}</div>}
      </td>
      
      {/* Colonne Contact */}
      <td className="guest-contact">
        {guest?.email && <div className="email">{guest.email}</div>}
        {guest?.phone && <div className="phone">{guest.phone}</div>}
      </td>
      
      {/* Colonne Send Method */}
      <td className="send-method">
        {sendMethod === 'email' ? 'Email' : 
         sendMethod === 'whatsapp' ? 'WhatsApp' : 
         sendMethod === 'both' ? 'Email & WhatsApp' : 
         sendMethod || 'N/A'}
      </td>
      
      <td className={`status-column ${getStatusClass()}`}>
        <span className="status-text">{status}</span>
        {sentAt && <div className="sent-date">{formatDate(sentAt)}</div>}
      </td>
      
      <td className={`response-column ${getResponseClass()}`}>
        <span className="response-text">{getResponseText()}</span>
        {response.respondedAt && <div className="response-date">{formatDate(response.respondedAt)}</div>}
      </td>
      
      <td className="actions-column">
        <button
          className="action-button view-button"
          title="View Details"
          onClick={() => onView && onView(invitation)}
        >
          View
        </button>
        {status !== 'sent' && (
          <button
            className="action-button send-button"
            title="Send Invitation"
            onClick={() => onSend && onSend(invitation)}
          >
            Send
          </button>
        )}
      </td>
    </tr>
  );
};

export default InvitationListItem;