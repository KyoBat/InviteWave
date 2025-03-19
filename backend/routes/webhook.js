// routes/webhook.js
const express = require('express');
const router = express.Router();
//const { whatsappService } = require('../services');
const whatsappService = require('../services/whatsappService');

// WhatsApp webhook
router.post('/whatsapp', async (req, res) => {
  try {
    // Process webhook
    await whatsappService.processWhatsAppWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// WhatsApp webhook verification (GET)
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Check the mode and token
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    // Respond with the challenge token from the request
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    // Respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

module.exports = router;