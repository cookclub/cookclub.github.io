/**
 * MAIN APPLICATION CONTROLLER
 * Coordinates all components and handles app-level functionality
 */

class CookbookClubApp {
    constructor() {
      this.isOnline = navigator.onLine;
      this.lastDataLoad = null;
      this.refreshInterval = null;
      
      this.connectionStatus = document.getElementById('connection-status');
      this.eventInfo = document.getElementById('event-info');
      this.refreshButton = document.getElementById('refresh-data');
      
      this.init();
    }
    
    async init() {
      console.log('🚀 Initializing Cookbook Club App');
      
      // Validate configuration
      if (!validateConfig()) {
        this.showConfigError();
        return;
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize connection monitoring
      this.setupConnectionMonitoring();
      
      // Load initial data
      await this.loadInitialData();
      
      // Set up auto-refresh
      this.setupAutoRefresh();
      
      console.log('✅ App initialized successfully');
    }
    
    setupEventListeners() {
      // Refresh button
      if (this.refreshButton) {
        this.refreshButton.addEventListener('click', () => this.refreshAllData());
      }
      
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'r':
              e.preventDefault();
              this.refreshAllData();
              break;
          }
        }
      });
      
      // Visibility change (refresh when tab becomes visible)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.shouldRefreshData()) {
          this.refreshAllData();
        }
      });
    }
    
    setupConnectionMonitoring() {
      // Online/offline detection
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.updateConnectionStatus();
        this.refreshAllData();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.updateConnectionStatus();
      });
      
      // Initial status
      this.updateConnectionStatus();
    }
    
    updateConnectionStatus() {
      if (!this.connectionStatus) return;
      
      const indicator = this.connectionStatus.querySelector('.status-indicator');
      const text = this.connectionStatus.querySelector('.status-text');
      
      if (this.isOnline) {
        indicator.className = 'status-indicator status-online';
        text.textContent = 'Connected';
        this.connectionStatus.setAttribute('aria-label', 'Connected to server');
      } else {
        indicator.className = 'status-indicator status-offline';
        text.textContent = 'Offline';
        this.connectionStatus.setAttribute('aria-label', 'Offline - some features may not work');
      }
    }
    
    async loadInitialData() {
      try {
        // Test API connection first
        await this.testConnection();
        
        // Load event information
        await this.loadEventInfo();
        
        this.lastDataLoad = Date.now();
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
        this.showConnectionError();
      }
    }
    
    // ✅ UPDATED CODE:
    async testConnection() {
        try {
        // JSONP response is already parsed JSON
        const response = await api.ping();
        if (!response.success) {
            throw new Error('API ping failed');
        }
        
        // Update connection status to show successful connection
        if (this.connectionStatus) {
            const text = this.connectionStatus.querySelector('.status-text');
            text.textContent = 'Connected';
        }
        
        } catch (error) {
        console.error('Connection test failed:', error);
        throw error;
        }
    }
    
    // ✅ UPDATED CODE:
    async loadEventInfo() {
        try {
        // JSONP response is already parsed JSON
        const response = await api.getFormData();
        
        // For JSONP, response is the actual data object
        if (response.success && response.data.event) {
            this.renderEventInfo(response.data.event);
        } else {
            throw new Error('Failed to load event information');
        }
        
        } catch (error) {
        console.error('Failed to load event info:', error);
        this.showEventLoadError();
        }
    }
    
    renderEventInfo(event) {
      if (!this.eventInfo) return;
      
      const eventTitle = this.eventInfo.querySelector('#event-title');
      const eventDate = this.eventInfo.querySelector('#event-date .detail-text');
      const eventCookbook = this.eventInfo.querySelector('#event-cookbook .detail-text');
      const eventLocation = this.eventInfo.querySelector('#event-location .detail-text');
      
      if (eventTitle) {
        eventTitle.innerHTML = `
          <span class="event-emoji">🍽️</span>
          ${Utils.sanitizeHTML(event.event_name || 'Cookbook Club Gathering')}
        `;
      }
      
      if (eventDate && event.event_date) {
        eventDate.textContent = Utils.formatDate(event.event_date);
      }
      
      if (eventCookbook && event.cookbook_title) {
        eventCookbook.innerHTML = `
          ${Utils.sanitizeHTML(event.cookbook_title)}
          ${event.cookbook_author ? `<br><small>by ${Utils.sanitizeHTML(event.cookbook_author)}</small>` : ''}
        `;
      }
      
      if (eventLocation && event.location) {
        eventLocation.textContent = event.location;
      }
      
      // Remove loading placeholders
      this.eventInfo.querySelectorAll('.loading-placeholder').forEach(el => {
        el.classList.remove('loading-placeholder');
      });
    }
    
    showEventLoadError() {
      if (!this.eventInfo) return;
      
      const eventTitle = this.eventInfo.querySelector('#event-title');
      if (eventTitle) {
        eventTitle.innerHTML = `
          <span class="error-icon">❌</span>
          Failed to load event information
        `;
      }
    }
    
    setupAutoRefresh() {
      // Refresh menu data every 5 minutes
      this.refreshInterval = setInterval(() => {
        if (this.isOnline && !document.hidden) {
          this.refreshMenuData();
        }
      }, 5 * 60 * 1000);
    }
    
    shouldRefreshData() {
      // Refresh if data is older than 2 minutes
      return !this.lastDataLoad || (Date.now() - this.lastDataLoad) > 2 * 60 * 1000;
    }
    
    async refreshAllData() {
      try {
        Utils.showToast('🔄 Refreshing data...', 'info', 2000);
        
        // Refresh all components
        const promises = [];
        
        if (window.menuDisplay) {
          promises.push(window.menuDisplay.refresh());
        }
        
        if (window.recipePicker) {
          promises.push(window.recipePicker.loadRecipes());
        }
        
        if (window.userSelector) {
          promises.push(window.userSelector.loadMembers());
        }
        
        // Refresh event info
        promises.push(this.loadEventInfo());
        
        await Promise.all(promises);
        
        this.lastDataLoad = Date.now();
        Utils.showToast('✅ Data refreshed successfully', 'success', 3000);
        
      } catch (error) {
        console.error('Failed to refresh data:', error);
        Utils.showToast('❌ Failed to refresh data', 'error', 5000);
      }
    }
    
    async refreshMenuData() {
      try {
        if (window.menuDisplay) {
          await window.menuDisplay.loadMenuData();
          window.menuDisplay.renderMenu();
        }
      } catch (error) {
        console.error('Failed to refresh menu data:', error);
      }
    }
    
    showConfigError() {
      document.body.innerHTML = `
        <div class="config-error">
          <div class="error-container">
            <div class="error-icon">⚙️</div>
            <h1 class="error-title">Configuration Error</h1>
            <div class="error-message">
              Please update the SCRIPT_URL in js/config.js with your Google Apps Script deployment URL.
            </div>
            <div class="error-actions">
              <button type="button" class="btn btn-primary" onclick="location.reload()">
                Retry
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    showConnectionError() {
      if (this.connectionStatus) {
        const indicator = this.connectionStatus.querySelector('.status-indicator');
        const text = this.connectionStatus.querySelector('.status-text');
        
        indicator.className = 'status-indicator status-error';
        text.textContent = 'Connection Error';
      }
      
      Utils.showToast('❌ Failed to connect to server. Please check your internet connection.', 'error', 8000);
    }
    
    // Cleanup method
    destroy() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    }
  }
  
  // Initialize app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.cookbookApp = new CookbookClubApp();
    });
  } else {
    window.cookbookApp = new CookbookClubApp();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.cookbookApp) {
      window.cookbookApp.destroy();
    }
  });