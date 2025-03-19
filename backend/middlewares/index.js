// middlewares/index.js
module.exports = {
    auth: require('./auth'),
    validation: require('./validation'),
    errorHandler: require('./error').errorHandler,
    upload: require('./upload')
  };