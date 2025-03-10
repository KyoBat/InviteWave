// services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

/**
 * Send invitation via email
 * @param {string} email - Recipient's email address
 * @param {string} guestName - Guest's name
 * @param {Object} event - Event object
 * @param {string} message - Custom message
 * @param {string} invitationUrl - URL to the invitation page
 * @returns {Promise<Object>} - Nodemailer response
 */
exports.sendEmailInvitation = async (email, guestName, event, message, invitationUrl) => {
  try {
    // Prepare event date and time
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const formattedTime = eventDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to ${event.name}!</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            padding: 20px;
            border: 1px solid #e9e9e9;
            border-radius: 0 0 5px 5px;
          }
          .event-details {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #5c6bc0;
          }
          .cta-button {
            display: inline-block;
            background-color: #5c6bc0;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.8em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <p>Hello ${guestName},</p>
          
          <p>${message || `You're invited to ${event.name}!`}</p>
          
          <div class="event-details">
            <h2>${event.name}</h2>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Location:</strong> ${event.location.address}</p>
            ${event.description ? `<p><strong>Details:</strong> ${event.description}</p>` : ''}
          </div>
          
          <p>Please let us know if you can attend by clicking the button below:</p>
          
          <a href="${invitationUrl}" class="cta-button">Respond to Invitation</a>
          
          <p>We hope to see you there!</p>
        </div>
        <div class="footer">
          <p>This invitation was sent through the Event Planner App</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Event Planner" <${config.email.from}>`,
      to: email,
      subject: `You're Invited to ${event.name}!`,
      html: htmlContent,
      text: `Hello ${guestName},\n\n${message || `You're invited to ${event.name}!`}\n\nEvent: ${event.name}\nDate: ${formattedDate}\nTime: ${formattedTime}\nLocation: ${event.location.address}\n\nPlease respond at: ${invitationUrl}\n\nWe hope to see you there!`
    });

    return info;
  } catch (error) {
    console.error('Email Service Error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient's email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<Object>} - Nodemailer response
 */
exports.sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            padding: 20px;
            border: 1px solid #e9e9e9;
            border-radius: 0 0 5px 5px;
          }
          .cta-button {
            display: inline-block;
            background-color: #5c6bc0;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.8em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <p>We received a request to reset your password for the Event Planner App. Click the button below to set a new password:</p>
          
          <a href="${resetUrl}" class="cta-button">Reset Password</a>
          
          <p>If you didn't request this, you can safely ignore this email.</p>
          
          <p>This link will expire in 1 hour for security reasons.</p>
        </div>
        <div class="footer">
          <p>This email was sent from the Event Planner App</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Event Planner" <${config.email.from}>`,
      to: email,
      subject: 'Reset Your Password - Event Planner App',
      html: htmlContent,
      text: `Hello,\n\nWe received a request to reset your password for the Event Planner App. Please visit the following link to set a new password:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nThis link will expire in 1 hour for security reasons.`
    });

    return info;
  } catch (error) {
    console.error('Email Service Error:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Note: Ceci représente uniquement les nouvelles méthodes à ajouter au service existant

/**
 * Envoie une notification à l'organisateur lorsqu'un invité réserve un cadeau
 * @param {string} to - Email de l'organisateur
 * @param {Object} data - Données pour le template d'email
 * @param {string} data.eventName - Nom de l'événement
 * @param {string} data.guestName - Nom de l'invité qui a réservé
 * @param {string} data.giftName - Nom du cadeau réservé
 * @param {number} data.quantity - Quantité réservée
 * @param {string} data.message - Message de l'invité (optionnel)
 */
exports.sendGiftReservationNotification = async (to, data) => {
  const subject = `[${data.eventName}] Nouvelle réservation de cadeau`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Nouvelle réservation de cadeau</h2>
      <p>Bonjour,</p>
      <p>Un invité a réservé un élément de votre liste de cadeaux pour ${data.eventName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Invité:</strong> ${data.guestName}</p>
        <p><strong>Cadeau:</strong> ${data.giftName}</p>
        <p><strong>Quantité:</strong> ${data.quantity}</p>
        ${data.message !== 'Aucun message' ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
      </div>
      <p>Vous pouvez consulter votre liste de cadeaux sur la page de détail de votre événement.</p>
      <p>Cordialement,<br>L'équipe InviteWave</p>
    </div>
  `;
  
  return await sendEmail(to, subject, html);
};

/**
 * Envoie une notification à l'organisateur lorsqu'un invité annule sa réservation
 * @param {string} to - Email de l'organisateur
 * @param {Object} data - Données pour le template d'email
 * @param {string} data.eventName - Nom de l'événement
 * @param {string} data.guestName - Nom de l'invité qui a annulé
 * @param {string} data.giftName - Nom du cadeau concerné
 */
exports.sendGiftCancellationNotification = async (to, data) => {
  const subject = `[${data.eventName}] Annulation d'une réservation de cadeau`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Annulation d'une réservation de cadeau</h2>
      <p>Bonjour,</p>
      <p>Un invité a annulé sa réservation d'un élément de votre liste de cadeaux pour ${data.eventName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Invité:</strong> ${data.guestName}</p>
        <p><strong>Cadeau:</strong> ${data.giftName}</p>
      </div>
      <p>Cet élément est maintenant disponible pour d'autres invités.</p>
      <p>Vous pouvez consulter votre liste de cadeaux sur la page de détail de votre événement.</p>
      <p>Cordialement,<br>L'équipe InviteWave</p>
    </div>
  `;
  
  return await sendEmail(to, subject, html);
};