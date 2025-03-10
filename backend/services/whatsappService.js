// services/whatsappService.js
const axios = require('axios');
const config = require('../config');

/**
 * Send invitation via WhatsApp
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} guestName - Guest's name
 * @param {Object} event - Event object
 * @param {string} message - Custom message
 * @param {string} invitationUrl - URL to the invitation page
 * @returns {Promise<Object>} - Response from WhatsApp API
 */
exports.sendWhatsAppInvitation = async (phoneNumber, guestName, event, message, invitationUrl) => {
  try {
    // Format phone number (remove non-numeric characters)
    let formattedNumber = phoneNumber.replace(/\D/g, '');

    // BUG FIX: Assurer que le numéro commence par '+' pour l'API WhatsApp
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+' + formattedNumber;
    }
    
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

    // Prepare WhatsApp template message
    const templateMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedNumber,
      type: "template",
      template: {
        name: "event_invitation",
        language: {
          code: "en_US"
        },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "text",
                text: event.name
              }
            ]
          },
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: guestName
              },
              {
                type: "text",
                text: formattedDate
              },
              {
                type: "text",
                text: formattedTime
              },
              {
                type: "text",
                text: event.location.address
              },
              {
                type: "text",
                text: message || `You're invited to ${event.name}!`
              },
              {
                type: "text",
                text: invitationUrl
              }
            ]
          }
        ]
      }
    };

    // Send message via WhatsApp Business API
    const response = await axios.post(
      `${config.whatsapp.apiUrl}/messages`,
      templateMessage,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.whatsapp.apiToken}`
        }
      }
    );

    // BUG FIX: Validation de la réponse de l'API
    if (!response.data || response.data.error) {
      throw new Error(response.data?.error?.message || 'WhatsApp API returned an error');
    }

    return response.data;
  } catch (error) {
    // BUG FIX: Gestion améliorée des erreurs
    console.error('WhatsApp API Error:', error.response ? error.response.data : error.message);
    
    // Créer un message d'erreur plus spécifique
    let errorMessage = 'Failed to send WhatsApp message';
    
    if (error.response) {
      errorMessage += `: ${error.response.data?.error?.message || error.response.statusText}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Process webhook notification from WhatsApp API
 * @param {Object} webhook - Webhook data from WhatsApp
 * @returns {Promise<void>}
 */
exports.processWhatsAppWebhook = async (webhook) => {
  try {
    // Implement webhook processing logic for message status updates
    // and possibly handling responses from guests
    console.log('Received WhatsApp webhook:', JSON.stringify(webhook));
  } catch (error) {
    console.error('Failed to process WhatsApp webhook:', error);
  }
};