// src/components/common/NotificationModal.js
import React from 'react';

const NotificationModal = ({ isOpen, title, message, onClose, type = 'info' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className={`modal-header modal-${type}`}>
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="button-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;