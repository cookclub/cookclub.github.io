/**
 * COOKBOOK CLUB FRONTEND CONFIGURATION
 * Update these values for your deployment
 */

const CONFIG = {
    // Your Google Apps Script deployment URL
    // SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwn1PsAZCbamvoTv8PL8cUQJTsNlO5aLwNcD7zdlXHD1riSYb4EaFXVnywkgJ5fj3ceWw/exec',
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx8ytApBsp58MvL6_oR7jMjUJJQ78a6alfyoyxVoZVMjmOc0b4MSs0jPDEPkG71usXg3A/exec',
    // App settings
    APP_NAME: 'Cookbook Club RSVP',
    VERSION: '2.0.0',
    
    // UI settings
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    
    // Form settings
    MAX_DISPLAY_NAME_LENGTH: 50,
    MAX_NOTES_LENGTH: 500,
    MAX_GUEST_COUNT: 5,
    
    // Instagram handle validation
    INSTAGRAM_REGEX: /^@[A-Za-z0-9._]{1,30}$/,
    
    // Debug mode (set to false for production)
    DEBUG: false,
    
    // Feature flags
    FEATURES: {
      GUEST_RSVP: true,
      INSTAGRAM_INTEGRATION: true,
      MENU_DISPLAY: true,
      REAL_TIME_UPDATES: true
    }
  };
  
  // Validation function for config
  function validateConfig() {
    if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
      console.error('❌ Please update SCRIPT_URL in config.js with your actual deployment URL');
      return false;
    }
    
    console.log('✅ Configuration validated');
    return true;
  }
  
  // Export for module systems (if needed)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
  }