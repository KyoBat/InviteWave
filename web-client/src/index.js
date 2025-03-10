// web-client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import des styles CSS des bibliothèques
import 'react-tabs/style/react-tabs.css';
import 'react-confirm-alert/src/react-confirm-alert.css';

// Import des styles CSS
import './styles/main.css';
import './styles/auth.css';
import './styles/events.css';
import './styles/guests.css';
import './styles/invitations.css';
import './styles/dashboard.css';
import './styles/profile.css';
import './styles/gifts.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();