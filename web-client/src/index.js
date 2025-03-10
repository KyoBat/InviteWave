// web-client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import des styles CSS
import './styles/main.css';
import './styles/auth.css';
import './styles/events.css';
import './styles/guests.css';
import './styles/invitations.css';
import './styles/dashboard.css';
import './styles/profile.css';
import './styles/gifts.css'; // Nouveau fichier CSS pour la fonctionnalité cadeaux

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();