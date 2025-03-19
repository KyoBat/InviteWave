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
    // Format phone number (remove non-numeric characters except for the + sign)
    let formattedNumber = phoneNumber.trim();
    
    // Remove any spaces, dashes or parentheses
    formattedNumber = formattedNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add + if it doesn't start with it
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+' + formattedNumber;
    }
    
    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formattedNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
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

    // Validate API response
    if (!response.data || response.data.error) {
      throw new Error(response.data?.error?.message || 'WhatsApp API returned an error');
    }

    return response.data;
  } catch (error) {
    // Enhanced error handling
    console.error('WhatsApp API Error:', error.response ? error.response.data : error.message);
    
    // Create a more specific error message
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
    // Process webhook for message status and delivery updates
    console.log('Received WhatsApp webhook:', JSON.stringify(webhook));
    
    if (!webhook || !webhook.entry) {
      console.log('Invalid webhook format, missing entry array');
      return;
    }
    
    for (const entry of webhook.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            // Process incoming messages
            await processIncomingMessages(change.value.messages);
          } else if (change.value && change.value.statuses) {
            // Process status updates
            await processStatusUpdates(change.value.statuses);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to process WhatsApp webhook:', error);
  }
};

/**
 * Process incoming messages
 * @param {Array} messages - Array of incoming messages
 * @returns {Promise<void>}
 */
async function processIncomingMessages(messages) {
  // Implementation of message processing
  // This could include looking up invitations by phone number and processing responses
  console.log('Processing incoming messages:', messages.length);
}

/**
 * Process status updates
 * @param {Array} statuses - Array of status updates
 * @returns {Promise<void>}
 */
async function processStatusUpdates(statuses) {
  // Implementation of status update processing
  // This could include updating invitation status based on WhatsApp message status
  console.log('Processing status updates:', statuses.length);
}