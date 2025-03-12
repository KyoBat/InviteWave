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
 * Send email using Nodemailer
 * @param {string} to - Recipient's email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text content
 * @returns {Promise<Object>} - Nodemailer response
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const mailOptions = {
      from: `"Event Planner" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email Service Error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

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

    const textContent = `Hello ${guestName},\n\n${message || `You're invited to ${event.name}!`}\n\nEvent: ${event.name}\nDate: ${formattedDate}\nTime: ${formattedTime}\nLocation: ${event.location.address}\n\nPlease respond at: ${invitationUrl}\n\nWe hope to see you there!`;

    // Send email
    return await sendEmail(
      email,
      `You're Invited to ${event.name}!`,
      htmlContent,
      textContent
    );
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

    const textContent = `Hello,\n\nWe received a request to reset your password for the Event Planner App. Please visit the following link to set a new password:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nThis link will expire in 1 hour for security reasons.`;

    // Send email
    return await sendEmail(
      email,
      'Reset Your Password - Event Planner App',
      htmlContent,
      textContent
    );
  } catch (error) {
    console.error('Email Service Error:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Send notification to the organizer when a guest reserves a gift
 * @param {string} to - Organizer's email
 * @param {Object} data - Data for the email template
 * @param {string} data.eventName - Event name
 * @param {string} data.guestName - Name of the guest who reserved
 * @param {string} data.giftName - Name of the reserved gift
 * @param {number} data.quantity - Reserved quantity
 * @param {string} data.message - Guest's message (optional)
 * @returns {Promise<Object>} - Nodemailer response
 */
exports.sendGiftReservationNotification = async (to, data) => {
  const subject = `[${data.eventName}] New Gift Reservation`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Gift Reservation</h2>
      <p>Hello,</p>
      <p>A guest has reserved an item from your gift list for ${data.eventName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Guest:</strong> ${data.guestName}</p>
        <p><strong>Gift:</strong> ${data.giftName}</p>
        <p><strong>Quantity:</strong> ${data.quantity}</p>
        ${data.message !== 'No message' ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
      </div>
      <p>You can view your gift list on your event details page.</p>
      <p>Best regards,<br>The Event Planner Team</p>
    </div>
  `;
  
  return await sendEmail(to, subject, html);
};

/**
 * Send notification to the organizer when a guest cancels a reservation
 * @param {string} to - Organizer's email
 * @param {Object} data - Data for the email template
 * @param {string} data.eventName - Event name
 * @param {string} data.guestName - Name of the guest who canceled
 * @param {string} data.giftName - Name of the gift
 * @returns {Promise<Object>} - Nodemailer response
 */
exports.sendGiftCancellationNotification = async (to, data) => {
  const subject = `[${data.eventName}] Gift Reservation Canceled`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Gift Reservation Canceled</h2>
      <p>Hello,</p>
      <p>A guest has canceled their reservation of an item from your gift list for ${data.eventName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Guest:</strong> ${data.guestName}</p>
        <p><strong>Gift:</strong> ${data.giftName}</p>
      </div>
      <p>This item is now available for other guests.</p>
      <p>You can view your gift list on your event details page.</p>
      <p>Best regards,<br>The Event Planner Team</p>
    </div>
  `;
  
  return await sendEmail(to, subject, html);
};

// Export the sendEmail function to make it accessible in other modules
exports.sendEmail = sendEmail;