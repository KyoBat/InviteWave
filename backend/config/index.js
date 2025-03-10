// config/index.js
require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 5001,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://boulothibou:Mariagecub31+@wedding.axpo5.mongodb.net/?retryWrites=true&w=majority&appName=Wedding'
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    resetSecret: process.env.JWT_RESET_SECRET || 'reset-secret'
  },
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0',
    apiToken: process.env.WHATSAPP_API_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'event-planner-verify-token'
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@eventplanner.com'
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // 'local' or 's3'
    s3: {
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  }
};
