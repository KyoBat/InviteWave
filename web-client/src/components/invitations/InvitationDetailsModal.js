// src/components/invitations/InvitationDetailsModal.js
import React from 'react';
import { formatDate } from '../../utils/dateUtils';

const InvitationDetailsModal = ({ isOpen, invitation, onClose }) => {
  if (!isOpen || !invitation) return null;

  const { guest, sendMethod, status, sentAt, response } = invitation;

  return (
    <div className="modal-overlay">
      <div className="modal-content invitation-details-modal">
        <div className="modal-header">
          <h3>Invitation Details</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="details-section">
            <h4>Guest Information</h4>
            <div className="detail-item">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{guest?.name || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{guest?.email || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{guest?.phone || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{guest?.category || 'N/A'}</span>
            </div>
          </div>
          
          <div className="details-section">
            <h4>Invitation Details</h4>
            <div className="detail-item">
              <span className="detail-label">Send Method:</span>
              <span className="detail-value">{sendMethod}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${status}`}>{status}</span>
            </div>
            {sentAt && (
              <div className="detail-item">
                <span className="detail-label">Sent Date:</span>
                <span className="detail-value">{formatDate(sentAt)}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Message:</span>
              <div className="detail-message">{invitation.message || 'No message'}</div>
            </div>
          </div>
          
          <div className="details-section">
            <h4>Response</h4>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value response-${response.status}`}>
                {response.status === 'yes' ? 'Attending' :
                 response.status === 'no' ? 'Not Attending' :
                 response.status === 'maybe' ? 'Maybe' : 'Pending'}
              </span>
            </div>
            {response.respondedAt && (
              <div className="detail-item">
                <span className="detail-label">Responded Date:</span>
                <span className="detail-value">{formatDate(response.respondedAt)}</span>
              </div>
            )}
            {response.message && (
              <div className="detail-item">
                <span className="detail-label">Guest Message:</span>
                <div className="detail-message">{response.message}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="button-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationDetailsModal;