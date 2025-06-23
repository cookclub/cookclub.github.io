/**
 * MENU DISPLAY COMPONENT
 * Shows current menu with claimed recipes and attendee information
 */

class MenuDisplay {
    constructor() {
      this.menuData = null;
      this.menuContent = document.getElementById('menu-content');
      this.menuStats = document.getElementById('menu-stats');
      
      this.init();
    }
    
    async init() {
      try {
        await this.loadMenuData();
        this.renderMenu();
      } catch (error) {
        console.error('Failed to initialize menu display:', error);
        this.showMenuLoadError();
      }
    }
    
    // ✅ UPDATED CODE:
    async loadMenuData() {
        try {
        // JSONP response is already parsed JSON
        const response = await api.getMenuData();
        
        // For JSONP, response is the actual data object
        if (response.success && response.data) {
            this.menuData = response.data;
            console.log('✅ Loaded menu data');
        } else {
            throw new Error(response.message || 'Failed to load menu data');
        }
        } catch (error) {
        console.error('Error loading menu data:', error);
        throw error;
        }
    }
    
    renderMenu() {
      if (!this.menuData || !this.menuContent) return;
      
      const { menu_by_category, rsvp_summary, stats } = this.menuData;
      
      if (!menu_by_category || Object.keys(menu_by_category).length === 0) {
        this.showEmptyMenu();
        return;
      }
      
      // Render menu by category
      const menuHTML = Object.entries(menu_by_category)
        .map(([category, dishes]) => this.renderCategory(category, dishes))
        .join('');
      
      this.menuContent.innerHTML = menuHTML;
      
      // Render stats
      this.renderStats(stats, rsvp_summary);
      
      console.log('✅ Menu rendered successfully');
    }
    
    renderCategory(category, dishes) {
      if (!dishes || dishes.length === 0) return '';
      
      const categoryEmoji = Utils.getCategoryEmoji(category);
      const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
      
      const dishesHTML = dishes.map(dish => this.renderDish(dish)).join('');
      
      return `
        <div class="menu-category">
          <h3 class="category-title">
            <span class="category-emoji">${categoryEmoji}</span>
            ${categoryTitle}
            <span class="category-count">(${dishes.length})</span>
          </h3>
          <div class="category-dishes">
            ${dishesHTML}
          </div>
        </div>
      `;
    }
    
    renderDish(dish) {
      const categoryEmoji = Utils.getCategoryEmoji(dish.category);
      const userType = dish.user_type || 'unknown';
      const isGuest = userType === 'guest';
      
      return `
        <div class="menu-dish ${isGuest ? 'guest-dish' : 'member-dish'}">
          <div class="dish-header">
            <div class="dish-title">
              <span class="dish-emoji">${categoryEmoji}</span>
              <span class="dish-name">${Utils.sanitizeHTML(dish.recipe_name)}</span>
            </div>
            ${dish.page_number ? `<span class="dish-page">p. ${dish.page_number}</span>` : ''}
          </div>
          
          <div class="dish-attribution">
            <span class="attribution-text">from</span>
            <span class="attribution-name ${isGuest ? 'guest-name' : 'member-name'}">
              ${Utils.sanitizeHTML(dish.display_name)}
            </span>
            ${isGuest ? '<span class="guest-badge">guest</span>' : ''}
            ${dish.instagram_handle ? `
              <a href="https://instagram.com/${dish.instagram_handle.replace('@', '')}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="instagram-link"
                 aria-label="View ${dish.display_name}'s Instagram">
                📷
              </a>
            ` : ''}
          </div>
          
          ${dish.dietary_tags ? `
            <div class="dish-dietary">
              <span class="dietary-icon">🌱</span>
              ${Utils.sanitizeHTML(dish.dietary_tags)}
            </div>
          ` : ''}
          
          ${dish.modifications ? `
            <div class="dish-modifications">
              <span class="modifications-icon">✏️</span>
              <strong>Modifications:</strong> ${Utils.sanitizeHTML(dish.modifications)}
            </div>
          ` : ''}
          
          ${dish.notes ? `
            <div class="dish-notes">
              <span class="notes-icon">💭</span>
              ${Utils.sanitizeHTML(dish.notes)}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    renderStats(stats, rsvpSummary) {
      if (!this.menuStats) return;
      
      const statsHTML = `
        <div class="menu-stats-grid">
          <div class="stat-item">
            <div class="stat-number">${stats.total_dishes || 0}</div>
            <div class="stat-label">Dishes</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${rsvpSummary.total_attendees || 0}</div>
            <div class="stat-label">Attendees</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${rsvpSummary.cooking_count || 0}</div>
            <div class="stat-label">Cooking</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${rsvpSummary.guest_count || 0}</div>
            <div class="stat-label">Guests</div>
          </div>
        </div>
        
        <div class="menu-summary">
          <div class="summary-section">
            <h4 class="summary-title">👥 Who's Coming</h4>
            <div class="attendee-list">
              ${this.renderAttendeeList(rsvpSummary)}
            </div>
          </div>
          
          ${stats.categories ? `
            <div class="summary-section">
              <h4 class="summary-title">🍽️ Menu Breakdown</h4>
              <div class="category-breakdown">
                ${Object.entries(stats.categories)
                  .map(([cat, count]) => `
                    <span class="category-stat">
                      ${Utils.getCategoryEmoji(cat)} ${cat}: ${count}
                    </span>
                  `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
      
      this.menuStats.innerHTML = statsHTML;
      this.menuStats.style.display = 'block';
    }
    
    renderAttendeeList(rsvpSummary) {
      if (!rsvpSummary.attendees || rsvpSummary.attendees.length === 0) {
        return '<div class="no-attendees">No RSVPs yet</div>';
      }
      
      return rsvpSummary.attendees.map(attendee => {
        const isGuest = attendee.user_type === 'guest';
        
        return `
          <div class="attendee-item ${isGuest ? 'guest-attendee' : 'member-attendee'}">
            <span class="attendee-name">${Utils.sanitizeHTML(attendee.display_name)}</span>
            ${isGuest ? '<span class="guest-badge">guest</span>' : ''}
            <span class="attendee-status">${attendee.response_type === 'cooking' ? '👨‍🍳' : '🍽️'}</span>
            ${attendee.guest_count > 0 ? `<span class="guest-count">+${attendee.guest_count}</span>` : ''}
          </div>
        `;
      }).join('');
    }
    
    showEmptyMenu() {
      if (!this.menuContent) return;
      
      this.menuContent.innerHTML = `
        <div class="empty-menu">
          <div class="empty-icon">🍽️</div>
          <div class="empty-title">No dishes claimed yet</div>
          <div class="empty-text">
            Be the first to claim a recipe and start building our menu!
          </div>
        </div>
      `;
      
      if (this.menuStats) {
        this.menuStats.style.display = 'none';
      }
    }
    
    showMenuLoadError() {
      if (!this.menuContent) return;
      
      this.menuContent.innerHTML = `
        <div class="menu-error">
          <div class="error-icon">❌</div>
          <div class="error-title">Failed to load menu</div>
          <div class="error-text">
            Please try refreshing the page.
            <br>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.menuDisplay.loadMenuData()">
              Retry
            </button>
          </div>
        </div>
      `;
      
      Utils.showToast('Failed to load current menu. Please refresh the page.', 'error');
    }
  
    // ✅ UPDATED CODE:
    async checkForUpdates() {
      try {
        // JSONP response is already parsed JSON
        const response = await api.getMenuUpdates(this.lastUpdate);
        
        // For JSONP, response is the actual data object
        if (response.success && response.data.has_updates) {
          await this.loadMenuData();
          this.renderMenu();
          this.showUpdateNotification(response.data.changes);
          this.lastUpdate = Date.now();
        }
        
      } catch (error) {
        console.error('Failed to check for menu updates:', error);
      }
    }
  
    showUpdateNotification(changes) {
        if (!changes || changes.length === 0) return;
        
        const changeText = changes.map(change => {
        switch (change.type) {
            case 'new_rsvp':
            return `${change.user_name} joined the event`;
            case 'new_recipe':
            return `${change.user_name} claimed ${change.recipe_name}`;
            case 'recipe_unclaimed':
            return `${change.recipe_name} is now available`;
            default:
            return 'Menu updated';
        }
        }).join(', ');
        
        Utils.showToast(`📋 Menu updated: ${changeText}`, 'info', 5000);
    }
  
    /**
     * Interactive menu features
     */
    makeMenuInteractive() {
        // Add click handlers for recipe details
        this.menuContent.addEventListener('click', (e) => {
        const dishElement = e.target.closest('.menu-dish');
        if (dishElement) {
            this.showDishDetails(dishElement);
        }
        });
        
        // Add hover effects for better UX
        this.setupHoverEffects();
        
        // Add copy functionality for sharing
        this.setupShareFeatures();
    }
  
    showDishDetails(dishElement) {
        const recipeName = dishElement.querySelector('.dish-name')?.textContent;
        const userName = dishElement.querySelector('.attribution-name')?.textContent;
        const modifications = dishElement.querySelector('.dish-modifications')?.textContent;
        const notes = dishElement.querySelector('.dish-notes')?.textContent;
        
        // Create detail modal
        const modal = this.createDishModal(recipeName, userName, modifications, notes);
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => modal.classList.add('modal-visible'), 10);
        
        // Close handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
        this.closeDishModal(modal);
        });
        
        modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.closeDishModal(modal);
        }
        });
    }
  
    createDishModal(recipeName, userName, modifications, notes) {
        const modal = document.createElement('div');
        modal.className = 'dish-modal modal';
        modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
            <h3 class="modal-title">${Utils.sanitizeHTML(recipeName)}</h3>
            <button type="button" class="modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
            <div class="dish-detail-section">
                <h4>👨‍🍳 Prepared by</h4>
                <p>${Utils.sanitizeHTML(userName)}</p>
            </div>
            
            ${modifications ? `
                <div class="dish-detail-section">
                <h4>✏️ Modifications</h4>
                <p>${Utils.sanitizeHTML(modifications)}</p>
                </div>
            ` : ''}
            
            ${notes ? `
                <div class="dish-detail-section">
                <h4>💭 Notes</h4>
                <p>${Utils.sanitizeHTML(notes)}</p>
                </div>
            ` : ''}
            
            <div class="dish-actions">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').querySelector('.modal-close').click()">
                Close
                </button>
            </div>
            </div>
        </div>
        `;
        
        return modal;
    }
  
    closeDishModal(modal) {
        modal.classList.remove('modal-visible');
        setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        }, 300);
    }
  
    setupHoverEffects() {
        // Add smooth hover animations
        const style = document.createElement('style');
        style.textContent = `
        .menu-dish {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
        }
        
        .menu-dish:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .menu-dish:active {
            transform: translateY(0);
        }
        `;
        
        document.head.appendChild(style);
    }
  
    setupShareFeatures() {
        // Add share button to menu stats
        if (this.menuStats) {
        const shareButton = document.createElement('button');
        shareButton.className = 'btn btn-secondary btn-sm share-menu-btn';
        shareButton.innerHTML = '📋 Share Menu';
        shareButton.addEventListener('click', () => this.shareMenu());
        
        this.menuStats.appendChild(shareButton);
        }
    }
  
    async shareMenu() {
        try {
        const menuText = this.generateMenuText();
        
        if (navigator.share) {
            // Use native sharing if available
            await navigator.share({
            title: 'Cookbook Club Menu',
            text: menuText,
            url: window.location.href
            });
        } else {
            // Fallback to clipboard
            await Utils.copyToClipboard(menuText);
            Utils.showToast('📋 Menu copied to clipboard!', 'success', 3000);
        }
        
        } catch (error) {
        console.error('Failed to share menu:', error);
        Utils.showToast('Failed to share menu', 'error', 3000);
        }
    }
  
    generateMenuText() {
        if (!this.menuData) return 'Menu not available';
        
        const { menu_by_category, rsvp_summary } = this.menuData;
        
        let text = `🍽️ Cookbook Club Menu\n\n`;
        
        // Add event info if available
        if (this.menuData.event) {
        text += `📅 ${Utils.formatDate(this.menuData.event.event_date)}\n`;
        text += `📖 ${this.menuData.event.cookbook_title}\n\n`;
        }
        
        // Add dishes by category
        Object.entries(menu_by_category).forEach(([category, dishes]) => {
        const categoryEmoji = Utils.getCategoryEmoji(category);
        text += `${categoryEmoji} ${category.toUpperCase()}\n`;
        
        dishes.forEach(dish => {
            text += `• ${dish.recipe_name} (by ${dish.display_name})\n`;
        });
        
        text += '\n';
        });
        
        // Add summary
        text += `👥 ${rsvp_summary.total_attendees} attendees\n`;
        text += `👨‍🍳 ${rsvp_summary.cooking_count} cooking\n`;
        
        return text;
    }
  
    /**
     * Menu filtering and search
     */
    addMenuFiltering() {
        // Add filter controls to menu section
        const filterControls = document.createElement('div');
        filterControls.className = 'menu-filters';
        filterControls.innerHTML = `
        <div class="filter-group">
            <label for="menu-search" class="filter-label">Search menu</label>
            <input type="search" id="menu-search" class="filter-input" placeholder="Search dishes or people...">
        </div>
        
        <div class="filter-group">
            <label for="menu-category-filter" class="filter-label">Filter by category</label>
            <select id="menu-category-filter" class="filter-input">
            <option value="">All categories</option>
            <option value="appetizer">Appetizers</option>
            <option value="main">Main dishes</option>
            <option value="side">Side dishes</option>
            <option value="dessert">Desserts</option>
            <option value="drink">Drinks</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label for="menu-dietary-filter" class="filter-label">Dietary</label>
            <select id="menu-dietary-filter" class="filter-input">
            <option value="">All dietary options</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten-free">Gluten-free</option>
            <option value="dairy-free">Dairy-free</option>
            </select>
        </div>
        
        <button type="button" class="btn btn-secondary btn-sm clear-filters-btn">
            Clear Filters
        </button>
        `;
        
        // Insert before menu content
        this.menuContent.parentNode.insertBefore(filterControls, this.menuContent);
        
        // Set up filter event listeners
        this.setupFilterListeners(filterControls);
    }
  
    setupFilterListeners(filterControls) {
        const searchInput = filterControls.querySelector('#menu-search');
        const categoryFilter = filterControls.querySelector('#menu-category-filter');
        const dietaryFilter = filterControls.querySelector('#menu-dietary-filter');
        const clearButton = filterControls.querySelector('.clear-filters-btn');
        
        // Debounced search
        const debouncedFilter = Utils.debounce(() => this.applyMenuFilters(), 300);
        
        searchInput.addEventListener('input', debouncedFilter);
        categoryFilter.addEventListener('change', () => this.applyMenuFilters());
        dietaryFilter.addEventListener('change', () => this.applyMenuFilters());
        
        clearButton.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        dietaryFilter.value = '';
        this.applyMenuFilters();
        });
    }
  
    applyMenuFilters() {
        const searchTerm = document.getElementById('menu-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('menu-category-filter')?.value || '';
        const dietaryFilter = document.getElementById('menu-dietary-filter')?.value || '';
        
        const dishes = this.menuContent.querySelectorAll('.menu-dish');
        let visibleCount = 0;
        
        dishes.forEach(dish => {
        const recipeName = dish.querySelector('.dish-name')?.textContent.toLowerCase() || '';
        const userName = dish.querySelector('.attribution-name')?.textContent.toLowerCase() || '';
        const category = dish.dataset.category?.toLowerCase() || '';
        const dietary = dish.querySelector('.dish-dietary')?.textContent.toLowerCase() || '';
        
        const matchesSearch = !searchTerm || 
            recipeName.includes(searchTerm) || 
            userName.includes(searchTerm);
        
        const matchesCategory = !categoryFilter || category === categoryFilter;
        
        const matchesDietary = !dietaryFilter || dietary.includes(dietaryFilter);
        
        const isVisible = matchesSearch && matchesCategory && matchesDietary;
        
        dish.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
        });
        
        // Update category headers
        this.updateCategoryVisibility();
        
        // Show no results message if needed
        this.showFilterResults(visibleCount);
    }
  
    updateCategoryVisibility() {
        const categories = this.menuContent.querySelectorAll('.menu-category');
        
        categories.forEach(category => {
        const visibleDishes = category.querySelectorAll('.menu-dish:not([style*="display: none"])');
        const countElement = category.querySelector('.category-count');
        
        if (visibleDishes.length > 0) {
            category.style.display = 'block';
            if (countElement) {
            countElement.textContent = `(${visibleDishes.length})`;
            }
        } else {
            category.style.display = 'none';
        }
        });
    }
  
    showFilterResults(visibleCount) {
        // Remove existing no-results message
        const existingMessage = this.menuContent.querySelector('.filter-no-results');
        if (existingMessage) {
        existingMessage.remove();
        }
        
        if (visibleCount === 0) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.className = 'filter-no-results';
        noResultsMessage.innerHTML = `
            <div class="no-results-icon">🔍</div>
            <div class="no-results-text">
            No dishes match your filters.
            <br>
            <button type="button" class="link-button clear-filters-btn">
                Clear filters
            </button>
            </div>
        `;
        
        this.menuContent.appendChild(noResultsMessage);
        
        // Add clear filters functionality
        noResultsMessage.querySelector('.clear-filters-btn').addEventListener('click', () => {
            document.getElementById('menu-search').value = '';
            document.getElementById('menu-category-filter').value = '';
            document.getElementById('menu-dietary-filter').value = '';
            this.applyMenuFilters();
        });
        }
    }
  
    /**
     * Menu analytics and insights
     */
    addMenuAnalytics() {
        if (!this.menuData) return;
        
        const analytics = this.calculateMenuAnalytics();
        this.renderAnalytics(analytics);
    }
  
    calculateMenuAnalytics() {
        const { menu_by_category, rsvp_summary } = this.menuData;
        
        const analytics = {
        totalDishes: 0,
        categoryBreakdown: {},
        dietaryOptions: {},
        memberVsGuest: { members: 0, guests: 0 },
        popularIngredients: {},
        difficultyLevels: {}
        };
        
        // Analyze dishes
        Object.entries(menu_by_category).forEach(([category, dishes]) => {
        analytics.categoryBreakdown[category] = dishes.length;
        analytics.totalDishes += dishes.length;
        
        dishes.forEach(dish => {
            // User type analysis
            if (dish.user_type === 'guest') {
            analytics.memberVsGuest.guests++;
            } else {
            analytics.memberVsGuest.members++;
            }
            
            // Dietary analysis
            if (dish.dietary_tags) {
            dish.dietary_tags.split(',').forEach(tag => {
                const cleanTag = tag.trim().toLowerCase();
                analytics.dietaryOptions[cleanTag] = (analytics.dietaryOptions[cleanTag] || 0) + 1;
            });
            }
            
            // Difficulty analysis
            if (dish.difficulty) {
            analytics.difficultyLevels[dish.difficulty] = (analytics.difficultyLevels[dish.difficulty] || 0) + 1;
            }
        });
        });
        
        return analytics;
    }
  
    renderAnalytics(analytics) {
        const analyticsSection = document.createElement('div');
        analyticsSection.className = 'menu-analytics';
        analyticsSection.innerHTML = `
        <h4 class="analytics-title">📊 Menu Insights</h4>
        
        <div class="analytics-grid">
            <div class="analytics-card">
            <div class="analytics-number">${analytics.totalDishes}</div>
            <div class="analytics-label">Total Dishes</div>
            </div>
            
            <div class="analytics-card">
            <div class="analytics-number">${Object.keys(analytics.categoryBreakdown).length}</div>
            <div class="analytics-label">Categories</div>
            </div>
            
            <div class="analytics-card">
            <div class="analytics-number">${Object.keys(analytics.dietaryOptions).length}</div>
            <div class="analytics-label">Dietary Options</div>
            </div>
            
            <div class="analytics-card">
            <div class="analytics-number">${Math.round((analytics.memberVsGuest.guests / (analytics.memberVsGuest.members + analytics.memberVsGuest.guests)) * 100)}%</div>
            <div class="analytics-label">Guest Dishes</div>
            </div>
        </div>
        
        ${Object.keys(analytics.dietaryOptions).length > 0 ? `
            <div class="analytics-section">
            <h5>🌱 Dietary Accommodations</h5>
            <div class="dietary-tags">
                ${Object.entries(analytics.dietaryOptions)
                .map(([tag, count]) => `
                    <span class="dietary-tag">
                    ${tag} (${count})
                    </span>
                `).join('')}
            </div>
            </div>
        ` : ''}
        `;
        
        // Add to menu stats
        if (this.menuStats) {
        this.menuStats.appendChild(analyticsSection);
        }
    }
  
    // Update the init method to include new features
    async init() {
        try {
        await this.loadMenuData();
        this.renderMenu();
        this.setupRealTimeUpdates();
        this.makeMenuInteractive();
        this.addMenuFiltering();
        this.addMenuAnalytics();
        } catch (error) {
        console.error('Failed to initialize menu display:', error);
        this.showMenuLoadError();
        }
    }

    async refresh() {
      try {
        Utils.showLoading(this.menuContent, 'Refreshing menu...');
        await this.loadMenuData();
        this.renderMenu();
      } catch (error) {
        console.error('Failed to refresh menu:', error);
        this.showMenuLoadError();
      } finally {
        Utils.hideLoading(this.menuContent);
      }
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.menuDisplay = new MenuDisplay();
    });
  } else {
    window.menuDisplay = new MenuDisplay();
  }