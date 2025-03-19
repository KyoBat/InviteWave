// src/utils/dateUtils.js

/**
 * Formats a date string or object into a readable format
 * @param {string|Date} date - The date to format (ISO string or Date object)
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeTime - Whether to include the time in the formatted date
 * @param {boolean} options.shortMonth - Whether to use short month names (Jan, Feb) vs (January, February)
 * @returns {string} The formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const { includeTime = false, shortMonth = true } = options;
    
    // Convert string to Date object if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return 'Invalid date';
    }
    
    // Format options
    const dateFormatOptions = {
      year: 'numeric',
      month: shortMonth ? 'short' : 'long',
      day: 'numeric',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    };
    
    // Remove undefined options
    Object.keys(dateFormatOptions).forEach(key => {
      if (dateFormatOptions[key] === undefined) {
        delete dateFormatOptions[key];
      }
    });
    
    return new Intl.DateTimeFormat('en-US', dateFormatOptions).format(dateObj);
  };
  
  /**
   * Formats a date relative to now (e.g., "2 days ago", "just now")
   * @param {string|Date} date - The date to format
   * @returns {string} The relative time string
   */
  export const formatRelativeTime = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatRelativeTime:', date);
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Default to standard date format
    return formatDate(dateObj);
  };
  
  /**
   * Checks if a date is in the past
   * @param {string|Date} date - The date to check
   * @returns {boolean} True if the date is in the past
   */
  export const isPastDate = (date) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    return dateObj < now;
  };
  
  /**
   * Calculates the difference between two dates in days
   * @param {string|Date} dateA - The first date
   * @param {string|Date} dateB - The second date (defaults to now)
   * @returns {number} The difference in days
   */
  export const daysBetween = (dateA, dateB = new Date()) => {
    if (!dateA) return null;
    
    const dateObjA = typeof dateA === 'string' ? new Date(dateA) : dateA;
    const dateObjB = typeof dateB === 'string' ? new Date(dateB) : dateB;
    
    // Set time to midnight to ignore time portion
    const dateAMidnight = new Date(dateObjA);
    dateAMidnight.setHours(0, 0, 0, 0);
    
    const dateBMidnight = new Date(dateObjB);
    dateBMidnight.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffInMs = Math.abs(dateBMidnight - dateAMidnight);
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  };