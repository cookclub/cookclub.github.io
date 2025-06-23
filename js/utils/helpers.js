/**
 * UTILITY HELPER FUNCTIONS
 */

const Utils = {
    /**
     * Debounce function calls
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    /**
     * Throttle function calls
     */
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    
    /**
     * Format date for display
     */
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    /**
     * Format time for display
     */
    formatTime(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
    },
    
    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },
    
    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Show loading state
     */
    showLoading(element, message = 'Loading...') {
      if (!element) return;
      
      element.classList.add('loading');
      element.setAttribute('aria-busy', 'true');
      
      const loadingHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span class="loading-text">${Utils.sanitizeHTML(message)}</span>
        </div>
      `;
      
      element.dataset.originalContent = element.innerHTML;
      element.innerHTML = loadingHTML;
    },
    
    /**
     * Hide loading state
     */
    hideLoading(element) {
      if (!element) return;
      
      element.classList.remove('loading');
      element.removeAttribute('aria-busy');
      
      if (element.dataset.originalContent) {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
      }
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <div class="toast-content">
          <span class="toast-message">${Utils.sanitizeHTML(message)}</span>
          <button class="toast-close" aria-label="Close notification">&times;</button>
        </div>
      `;
      
      // Add to page
      let toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
      }
      
      toastContainer.appendChild(toast);
      
      // Auto-remove
      const removeToast = () => {
        toast.classList.add('toast-removing');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      };
      
      // Close button
      toast.querySelector('.toast-close').addEventListener('click', removeToast);
      
      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(removeToast, duration);
      }
      
      // Animate in
      setTimeout(() => toast.classList.add('toast-visible'), 10);
    },
    
    /**
     * Smooth scroll to element
     */
    scrollToElement(element, offset = 0) {
      if (!element) return;
      
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    },
    
    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    },
    
    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        Utils.showToast('Copied to clipboard!', 'success', 2000);
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        Utils.showToast('Failed to copy to clipboard', 'error', 3000);
        return false;
      }
    },
    
    /**
     * Format Instagram handle
     */
    formatInstagramHandle(handle) {
      if (!handle) return '';
      
      // Ensure it starts with @
      const formatted = handle.startsWith('@') ? handle : '@' + handle;
      
      // Validate format
      if (!CONFIG.INSTAGRAM_REGEX.test(formatted)) {
        return '';
      }
      
      return formatted;
    },
    
    /**
     * Get emoji for recipe category
     */
    getCategoryEmoji(category) {
      const emojiMap = {
        'appetizer': '🥗',
        'main': '🍽️',
        'side': '🥙',
        'dessert': '🍰',
        'drink': '🍹',
        'bread': '🍞',
        'soup': '🍲',
        'salad': '🥗',
        'sauce': '🥄'
      };
      
      return emojiMap[category?.toLowerCase()] || '🍴';
    }
  };
  
  // Debug logging
  if (CONFIG.DEBUG) {
    window.Utils = Utils;
    console.log('🛠️ Utils loaded in debug mode');
  }