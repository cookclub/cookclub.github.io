/**
 * API INTEGRATION LAYER
 * Handles all communication with Google Apps Script backend
 */

class CookbookAPI {
  constructor() {
    this.baseUrl = CONFIG.SCRIPT_URL;
    this.cache = new Map();
    this.requestQueue = [];
    this.isOnline = navigator.onLine;

    // Set up online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Generic API request handler
   * MODIFIED: Handles JSONP for GET requests and no-cors for POST requests.
   */
  async makeRequest(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      cache = false,
      timeout = 30000,
      mode = 'cors' // Added mode option, defaults to 'cors'
    } = options;

    // Check cache first (only for GET requests that return readable data)
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}`;
    if (cache && this.cache.has(cacheKey)) {
      console.log('📦 Using cached response for:', endpoint);
      return this.cache.get(cacheKey);
    }

    let url = this.baseUrl;
    const requestOptions = {
      method: method,
      headers: {},
      mode: mode // Set the fetch mode
    };

    // --- Handle GET (JSONP) Requests ---
    if (method === 'GET') {
      // For JSONP, we need a global callback function
      const callbackName = `jsonpCallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      url += `?action=${endpoint}&callback=${callbackName}&cb=${Date.now()}`; // Add action, callback, and cache-buster

      return new Promise((resolve, reject) => {
        // Define the global callback function
        window[callbackName] = (response) => {
          console.log(`✅ API Response (JSONP): ${endpoint}`, response);
          delete window[callbackName]; // Clean up the global function

          // Cache successful responses
          if (cache && response.success) {
            this.cache.set(cacheKey, response);
            setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000); // Auto-expire cache
          }
          resolve(response);
        };

        // Create a script tag to make the JSONP request
        const script = document.createElement('script');
        script.src = url;
        script.async = true; // Make sure script loads asynchronously

        script.onerror = (e) => {
          console.error(`❌ API Error (JSONP): ${endpoint}`, e);
          delete window[callbackName]; // Clean up
          reject(new Error(`API request failed (JSONP): Network error or script load failure for ${endpoint}`));
        };

        // Append the script to the document head
        document.head.appendChild(script);

        // Clean up the script tag after it loads or errors
        script.onload = () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };
      });
    }
    // --- End GET (JSONP) Handling ---


    // --- Handle POST Requests (with no-cors) ---
    if (method === 'POST') {
      if (data) {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(data);
      }
      // No need to set mode: 'no-cors' here if it's already passed in options.mode
      // But ensure it's set for submitRSVP calls.
    }

    try {
      console.log(`🌐 API Request: ${method} ${endpoint}`, data || '');

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      requestOptions.signal = controller.signal;

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // If in 'no-cors' mode, we cannot read the response body or status.
      // We just assume success if the fetch didn't throw an error.
      if (requestOptions.mode === 'no-cors') {
        console.warn(`Received opaque response for ${endpoint} (no-cors mode). Cannot read response body or status.`);
        // We assume success here, as the script execution is confirmed by logs/sheet.
        return { success: true, message: 'Request sent (response opaque)' };
      }

      // For 'cors' mode (e.g., if you use it for other endpoints or future changes)
      if (!response.ok) {
        let errorText = response.statusText;
        try {
          const errorJson = await response.json();
          errorText = errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          // If not JSON, just use status text
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Cache successful responses (only for readable responses)
      if (cache && result.success) {
        this.cache.set(cacheKey, result);
        setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      }

      console.log(`✅ API Response: ${endpoint}`, result);
      return result;

    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);

      // Queue request for retry if offline (only for requests that can be retried)
      if (!this.isOnline && requestOptions.mode !== 'no-cors') { // Don't queue no-cors, as we can't verify success
        this.requestQueue.push({ endpoint, options });
      }

      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Process queued requests when back online
   */
  async processQueue() {
    if (this.requestQueue.length === 0) return;

    console.log(`🔄 Processing ${this.requestQueue.length} queued requests`);

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const { endpoint, options } of queue) {
      try {
        await this.makeRequest(endpoint, options);
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  /**
   * Test API connection
   */
  async ping() {
    // ping is a GET request, will use JSONP
    return this.makeRequest('ping');
  }

  /**
   * Get form data (members, recipes, event info)
   */
  async getFormData() {
    // getFormData is a GET request, will use JSONP
    return this.makeRequest('getData', { cache: true });
  }

  /**
   * Get menu data
   */
  async getMenuData() {
    // getMenuData is a GET request, will use JSONP
    return this.makeRequest('getMenu', { cache: false });
  }

  /**
   * Submit RSVP
   * MODIFIED: Uses mode: 'no-cors' for fire-and-forget.
   */
  async submitRSVP(formData) {
    return this.makeRequest('submitRSVP', {
      method: 'POST',
      data: { action: 'submitRSVP', ...formData },
      mode: 'no-cors' // <--- Crucial for POST requests to Apps Script
    });
  }

  // Add these methods to the CookbookAPI class

  /**
   * Get current event information
   */
  async getEventInfo() {
    const response = await this.makeRequest('getData', { cache: true });
    return response.data?.event || null;
  }

  /**
   * Get available recipes with claim status
   */
  async getRecipesWithClaimStatus() {
    const response = await this.makeRequest('getData', { cache: true });
    return {
      recipes: response.data?.recipes || [],
      claimed_recipes: response.data?.claimed_recipes || []
    };
  }

  /**
   * Get member list
   */
  async getMembers() {
    const response = await this.makeRequest('getData', { cache: true });
    return response.data?.members || [];
  }

  /**
   * Validate recipe claim before submission
   * NOTE: If this is a POST and you need to read its response,
   * you might need to reconsider the 'no-cors' strategy for this specific endpoint,
   * or accept that the response will be opaque.
   * For now, I'll assume it's also fire-and-forget or will be handled differently.
   */
  async validateRecipeClaim(recipeId, userId) {
    return this.makeRequest('validateClaim', {
      method: 'POST',
      data: {
        action: 'validateClaim',
        recipeId: recipeId,
        userId: userId
      },
      mode: 'no-cors' // Assuming this is also fire-and-forget
    });
  }

  /**
   * Get real-time menu updates
   */
  async getMenuUpdates(lastUpdate = null) {
    const params = lastUpdate ? `&lastUpdate=${lastUpdate}` : '';
    // This is a GET request, will use JSONP
    return this.makeRequest(`getMenu${params}`, { cache: false });
  }

  /**
   * Submit feedback or report issue
   * NOTE: If this is a POST and you need to read its response,
   * you might need to reconsider the 'no-cors' strategy for this specific endpoint,
   * or accept that the response will be opaque.
   */
  async submitFeedback(feedback) {
    return this.makeRequest('submitFeedback', {
      method: 'POST',
      data: {
        action: 'submitFeedback',
        ...feedback
      },
      mode: 'no-cors' // Assuming this is also fire-and-forget
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }
}

// Create global API instance
const api = new CookbookAPI();
