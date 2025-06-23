/**
 * REAL-TIME DATA SYNCHRONIZATION
 * Handles live updates across all components
 */

class RealTimeSync {
    constructor() {
      this.lastSync = Date.now();
      this.syncInterval = null;
      this.isOnline = navigator.onLine;
      this.pendingUpdates = [];
      this.subscribers = new Map();
      
      this.init();
    }
    
    init() {
      this.setupConnectionMonitoring();
      this.startSyncLoop();
      this.setupEventListeners();
    }
    
    setupConnectionMonitoring() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processPendingUpdates();
        this.forceSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      
      // Check connection periodically
      setInterval(() => {
        this.checkConnection();
      }, 60000); // Every minute
    }
    
    async checkConnection() {
      try {
        const response = await api.ping();
        const wasOnline = this.isOnline;
        this.isOnline = response.success;
        
        // If we just came back online
        if (this.isOnline && !wasOnline) {
          this.processPendingUpdates();
          this.forceSync();
        }
        
      } catch (error) {
        this.isOnline = false;
      }
    }
    
    startSyncLoop() {
      // Sync every 30 seconds when online and tab is visible
      this.syncInterval = setInterval(() => {
        if (this.isOnline && !document.hidden) {
          this.syncData();
        }
      }, 30000);
    }
    
    async syncData() {
      try {
        // Get updates from server
        const updates = await this.fetchUpdates();
        
        if (updates.length > 0) {
          // Process updates
          await this.processUpdates(updates);
          
          // Notify subscribers
          this.notifySubscribers('dataUpdated', updates);
          
          this.lastSync = Date.now();
        }
        
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
    
    // ✅ UPDATED CODE:
    async fetchUpdates() {
        try {
        // JSONP response is already parsed JSON
        const response = await api.getMenuUpdates(this.lastSync);
        
        // For JSONP, response is the actual data object
        if (response.success && response.data.has_updates) {
            return response.data.changes || [];
        }
        
        return [];
        
        } catch (error) {
        console.error('Failed to fetch updates:', error);
        return [];
        }
    }
    
    async processUpdates(updates) {
      const updateTypes = {
        menu: false,
        recipes: false,
        members: false
      };
      
      updates.forEach(update => {
        switch (update.type) {
          case 'new_rsvp':
          case 'new_recipe':
          case 'recipe_unclaimed':
            updateTypes.menu = true;
            break;
          case 'recipe_added':
          case 'recipe_updated':
            updateTypes.recipes = true;
            break;
          case 'member_added':
          case 'member_updated':
            updateTypes.members = true;
            break;
        }
      });
      
      // Update components based on what changed
      if (updateTypes.menu && window.menuDisplay) {
        await window.menuDisplay.loadMenuData();
        window.menuDisplay.renderMenu();
      }
      
      if (updateTypes.recipes && window.recipePicker) {
        await window.recipePicker.loadRecipes();
        window.recipePicker.renderRecipes();
      }
      
      if (updateTypes.members && window.userSelector) {
        await window.userSelector.loadMembers();
        window.userSelector.populateMemberDropdown();
      }
    }
    
    setupEventListeners() {
      // Listen for form submissions to trigger immediate sync
      document.addEventListener('rsvpSubmitted', () => {
        setTimeout(() => this.forceSync(), 2000);
      });
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Tab became visible, check for updates
          this.syncData();
        }
      });
      
      // Listen for focus events
      window.addEventListener('focus', () => {
        this.syncData();
      });
    }
    
    async forceSync() {
      await this.syncData();
    }
    
    // Subscription system for components
    subscribe(event, callback) {
      if (!this.subscribers.has(event)) {
        this.subscribers.set(event, []);
      }
      this.subscribers.get(event).push(callback);
    }
    
    unsubscribe(event, callback) {
      if (this.subscribers.has(event)) {
        const callbacks = this.subscribers.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
    
    notifySubscribers(event, data) {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in subscriber for ${event}:`, error);
          }
        });
      }
    }
    
    // Offline support
    queueUpdate(update) {
      this.pendingUpdates.push({
        ...update,
        timestamp: Date.now()
      });
    }
    
    async processPendingUpdates() {
      if (this.pendingUpdates.length === 0) return;
      
      const updates = [...this.pendingUpdates];
      this.pendingUpdates = [];
      
      for (const update of updates) {
        try {
          await this.processOfflineUpdate(update);
        } catch (error) {
          console.error('Failed to process pending update:', error);
          // Re-queue failed updates
          this.pendingUpdates.push(update);
        }
      }
    }
    
    async processOfflineUpdate(update) {
      // Process updates that were queued while offline
      switch (update.type) {
        case 'rsvp_submission':
          await api.submitRSVP(update.data);
          break;
        // Add other update types as needed
      }
    }
    
    // Cleanup
    destroy() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }
    }
  }
  
  // Initialize real-time sync
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.realTimeSync = new RealTimeSync();
    });
  } else {
    window.realTimeSync = new RealTimeSync();
  }