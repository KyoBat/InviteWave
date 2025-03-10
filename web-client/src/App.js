// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';

// Public pages
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import PublicInvitation from './components/invitations/PublicInvitation';

// Private pages
import Dashboard from './components/layout/Dashboard';
import ProfileSettings from './components/layout/ProfileSettings';

// Events
import EventList from './components/events/EventList';
import EventDetail from './components/events/EventDetail';
import EventForm from './components/events/EventForm';
import EventStats from './components/events/EventStats';

// Guests
import GuestList from './components/guests/GuestList';
import GuestForm from './components/guests/GuestForm';
import GuestImport from './components/guests/GuestImport';

// Invitations
import InvitationList from './components/invitations/InvitationList';
import CreateInvitation from './components/invitations/CreateInvitation';

import './styles/main.css';
<img src="/uploads/3f024eba-f4e1-4319-8bd6-5589556fd630.jpeg" alt="Bon"></img>
function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route path="/invitation/:code" element={<PublicInvitation />} />

            {/* Private routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfileSettings />} />
              
              {/* Events routes */}
              <Route path="/events" element={<EventList />} />
              <Route path="/events/create" element={<EventForm isEdit={false} />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/:id/edit" element={<EventForm isEdit={true} />} />
              <Route path="/events/:id/stats" element={<EventStats />} />
              
              {/* Guests routes */}
              <Route path="/guests" element={<GuestList />} />
              <Route path="/guests/create" element={<GuestForm isEdit={false} />} />
              <Route path="/guests/:id/edit" element={<GuestForm isEdit={true} />} />
              <Route path="/guests/import" element={<GuestImport />} />
              
              {/* Invitations routes */}
              <Route path="/events/:eventId/invitations" element={<InvitationList />} />
              <Route path="/events/:eventId/invitations/create" element={<CreateInvitation />} />
            </Route>

            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 route */}
            <Route path="*" element={
              <div className="not-found">
                <h1>404</h1>
                <p>Page not found</p>
                <a href="/dashboard">Go back to dashboard</a>
              </div>
            } />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;