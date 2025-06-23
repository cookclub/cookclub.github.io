/**
 * USER EXPERIENCE ENHANCEMENTS
 * Advanced UX features for better user interaction
 */

class UXEnhancements {
    constructor() {
      this.init();
    }
    
    init() {
      this.setupKeyboardNavigation();
      this.setupAccessibilityFeatures();
      this.setupSmartDefaults();
      this.setupProgressSaving();
      this.setupHelpSystem();
    }
    
    /**
     * Enhanced keyboard navigation
     */
    setupKeyboardNavigation() {
      document.addEventListener('keydown', (e) => {
        // Form navigation shortcuts
        if (e.altKey) {
          switch (e.key) {
            case 'ArrowRight':
            case 'n':
              e.preventDefault();
              this.triggerNextStep();
              break;
            case 'ArrowLeft':
            case 'p':
              e.preventDefault();
              this.triggerPreviousStep();
              break;
          }
        }
        
        // Quick recipe search
        if (e.ctrlKey && e.key === 'f') {
          const recipeSearch = document.getElementById('recipe-search');
          if (recipeSearch && !recipeSearch.disabled) {
            e.preventDefault();
            recipeSearch.focus();
          }
        }
        
        // Submit form
        if (e.ctrlKey && e.key === 'Enter') {
          const submitBtn = document.getElementById('submit-rsvp');
          if (submitBtn && !submitBtn.disabled && submitBtn.style.display !== 'none') {
            e.preventDefault();
            submitBtn.click();
          }
        }
      });
    }
    
    triggerNextStep() {
      const nextBtn = document.getElementById('next-step');
      if (nextBtn && !nextBtn.disabled && nextBtn.style.display !== 'none') {
        nextBtn.click();
      }
    }
    
    triggerPreviousStep() {
      const prevBtn = document.getElementById('prev-step');
      if (prevBtn && prevBtn.style.display !== 'none') {
        prevBtn.click();
      }
    }
    
    /**
     * Accessibility enhancements
     */
    setupAccessibilityFeatures() {
      // Announce step changes to screen readers
      this.setupStepAnnouncements();
      
      // Enhanced focus management
      this.setupFocusManagement();
      
      // High contrast mode detection
      this.setupHighContrastMode();
    }
    
    setupStepAnnouncements() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const target = mutation.target;
            if (target.classList.contains('form-step')) {
              const isVisible = target.style.display !== 'none';
              if (isVisible) {
                this.announceStepChange(target);
              }
            }
          }
        });
      });
      
      document.querySelectorAll('.form-step').forEach(step => {
        observer.observe(step, { attributes: true });
      });
    }
    
    announceStepChange(stepElement) {
      const stepNumber = stepElement.dataset.step;
      const stepTitle = stepElement.querySelector('.step-title')?.textContent || `Step ${stepNumber}`;
      
      // Create announcement for screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Now on ${stepTitle}`;
      
      document.body.appendChild(announcement);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
    
    setupFocusManagement() {
      // Trap focus within modal dialogs
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const modal = document.querySelector('.modal:not([style*="display: none"])');
          if (modal) {
            this.trapFocus(e, modal);
          }
        }
      });
    }
    
    trapFocus(e, container) {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
    
    setupHighContrastMode() {
      // Detect high contrast mode preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
      }
      
      // Listen for changes
      window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
        if (e.matches) {
          document.body.classList.add('high-contrast');
        } else {
          document.body.classList.remove('high-contrast');
        }
      });
    }
    
    /**
     * Smart defaults and auto-completion
     */
    setupSmartDefaults() {
      // Auto-format Instagram handles
      const instagramInput = document.getElementById('guest-instagram');
      if (instagramInput) {
        instagramInput.addEventListener('input', (e) => {
          let value = e.target.value;
          
          // Auto-add @ if missing
          if (value && !value.startsWith('@')) {
            value = '@' + value;
            e.target.value = value;
          }
          
          // Remove invalid characters
          value = value.replace(/[^@A-Za-z0-9._]/g, '');
          if (value !== e.target.value) {
            e.target.value = value;
          }
        });
      }
      
      // Smart email suggestions
      this.setupEmailSuggestions();
      
      // Auto-capitalize names
      const nameInput = document.getElementById('guest-name');
      if (nameInput) {
        nameInput.addEventListener('blur', (e) => {
          const value = e.target.value;
          if (value) {
            // Capitalize first letter of each word
            const capitalized = value.replace(/\b\w/g, l => l.toUpperCase());
            e.target.value = capitalized;
          }
        });
      }
    }
    
    setupEmailSuggestions() {
      const emailInput = document.getElementById('guest-email');
      if (!emailInput) return;
      
      const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
      
      emailInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const atIndex = value.indexOf('@');
        
        if (atIndex > 0 && atIndex < value.length - 1) {
          const domain = value.substring(atIndex + 1);
          const suggestion = commonDomains.find(d => d.startsWith(domain) && d !== domain);
          
          if (suggestion) {
            this.showEmailSuggestion(emailInput, value, suggestion);
          } else {
            this.hideEmailSuggestion(emailInput);
          }
        } else {
          this.hideEmailSuggestion(emailInput);
        }
      });
    }
    
    showEmailSuggestion(input, currentValue, suggestion) {
      const atIndex = currentValue.indexOf('@');
      const suggestedEmail = currentValue.substring(0, atIndex + 1) + suggestion;
      
      // Create or update suggestion element
      let suggestionEl = input.parentNode.querySelector('.email-suggestion');
      if (!suggestionEl) {
        suggestionEl = document.createElement('div');
        suggestionEl.className = 'email-suggestion';
        input.parentNode.appendChild(suggestionEl);
      }
      
      suggestionEl.innerHTML = `
        <span class="suggestion-text">Did you mean: </span>
        <button type="button" class="suggestion-button" data-suggestion="${suggestedEmail}">
          ${suggestedEmail}
        </button>
      `;
      
      // Handle suggestion click
      suggestionEl.querySelector('.suggestion-button').addEventListener('click', (e) => {
        input.value = e.target.dataset.suggestion;
        this.hideEmailSuggestion(input);
        input.focus();
      });
    }
    
    hideEmailSuggestion(input) {
      const suggestionEl = input.parentNode.querySelector('.email-suggestion');
      if (suggestionEl) {
        suggestionEl.remove();
      }
    }
    
    /**
     * Progress saving and restoration
     */
    setupProgressSaving() {
      // Save form progress to localStorage
      const form = document.getElementById('rsvp-form');
      if (!form) return;
      
      const saveProgress = Utils.debounce(() => {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
          data[key] = value;
        }
        
        localStorage.setItem('rsvp-progress', JSON.stringify({
          data: data,
          timestamp: Date.now(),
          step: window.formHandler?.currentStep || 1
        }));
      }, 1000);
      
      // Save on input changes
      form.addEventListener('input', saveProgress);
      form.addEventListener('change', saveProgress);
      
      // Restore progress on page load
      this.restoreProgress();
    }
    
    restoreProgress() {
      try {
        const saved = localStorage.getItem('rsvp-progress');
        if (!saved) return;
        
        const progress = JSON.parse(saved);
        
        // Check if progress is recent (within 24 hours)
        const age = Date.now() - progress.timestamp;
        if (age > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('rsvp-progress');
          return;
        }
        
        // Ask user if they want to restore
        if (confirm('We found a previous RSVP in progress. Would you like to continue where you left off?')) {
          this.applyProgressData(progress);
        } else {
          localStorage.removeItem('rsvp-progress');
        }
        
      } catch (error) {
        console.error('Failed to restore progress:', error);
        localStorage.removeItem('rsvp-progress');
      }
    }
    
    applyProgressData(progress) {
      const form = document.getElementById('rsvp-form');
      if (!form) return;
      
      // Apply form data
      Object.entries(progress.data).forEach(([key, value]) => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
          if (field.type === 'radio' || field.type === 'checkbox') {
            if (field.value === value) {
              field.checked = true;
              field.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } else {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });
      
      // Navigate to saved step
      if (window.formHandler && progress.step > 1) {
        setTimeout(() => {
          window.formHandler.showStep(progress.step);
        }, 500);
      }
      
      Utils.showToast('✅ Previous progress restored', 'success', 3000);
    }
    
    /**
     * Interactive help system
     */
    setupHelpSystem() {
      // Add help buttons to complex fields
      this.addHelpButtons();
      
      // Setup help modal
      this.setupHelpModal();
      
      // Contextual help based on user actions
      this.setupContextualHelp();
    }
    
    addHelpButtons() {
      const helpFields = [
        { selector: '#guest-instagram', help: 'instagram-help' },
        { selector: '#recipe-search', help: 'recipe-search-help' },
        { selector: '#member-select', help: 'member-select-help' }
      ];
      
      helpFields.forEach(({ selector, help }) => {
        const field = document.querySelector(selector);
        if (field) {
          const helpButton = document.createElement('button');
          helpButton.type = 'button';
          helpButton.className = 'help-button';
          helpButton.innerHTML = '?';
          helpButton.setAttribute('aria-label', 'Get help');
          helpButton.addEventListener('click', () => this.showHelp(help));
          
          field.parentNode.appendChild(helpButton);
        }
      });
    }
    
    setupHelpModal() {
      // Create help modal if it doesn't exist
      if (!document.getElementById('help-modal')) {
        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Help</h3>
              <button type="button" class="modal-close" aria-label="Close help">&times;</button>
            </div>
            <div class="modal-body" id="help-content">
              <!-- Help content will be inserted here -->
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal events
        modal.querySelector('.modal-close').addEventListener('click', () => this.hideHelp());
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.hideHelp();
        });
      }
    }
    
    showHelp(helpType) {
      const modal = document.getElementById('help-modal');
      const content = document.getElementById('help-content');
      
      content.innerHTML = this.getHelpContent(helpType);
      modal.style.display = 'block';
      
      // Focus management
      const firstButton = modal.querySelector('button');
      if (firstButton) firstButton.focus();
    }
    
    hideHelp() {
      const modal = document.getElementById('help-modal');
      modal.style.display = 'none';
    }
    
    getHelpContent(helpType) {
      const helpContent = {
        'instagram-help': `
          <h4>Instagram Handle Help</h4>
          <p>Your Instagram handle is your username on Instagram, starting with @.</p>
          <ul>
            <li>Example: @yourname</li>
            <li>We'll use this to credit your dish in our menu</li>
            <li>Only visible to club members</li>
            <li>Especially helpful for @clt.gal.pals friends!</li>
          </ul>
        `,
        'recipe-search-help': `
          <h4>Recipe Search Help</h4>
          <p>Find recipes quickly by searching for:</p>
          <ul>
            <li>Recipe name (e.g., "pasta")</li>
            <li>Category (e.g., "dessert")</li>
            <li>Ingredients (e.g., "chicken")</li>
            <li>Dietary tags (e.g., "vegetarian")</li>
          </ul>
          <p>Use the category filter to narrow down results further.</p>
        `,
        'member-select-help': `
          <h4>Member Selection Help</h4>
          <p>Select your name from the dropdown list.</p>
          <p>If you don't see your name:</p>
          <ul>
            <li>You might be a guest - go back and select "Guest"</li>
            <li>Contact the organizer to be added to the member list</li>
          </ul>
        `
      };
      
      return helpContent[helpType] || '<p>Help content not available.</p>';
    }
    
    setupContextualHelp() {
      // Show help hints based on user behavior
      let recipeSearchAttempts = 0;
      
      const recipeSearch = document.getElementById('recipe-search');
      if (recipeSearch) {
        recipeSearch.addEventListener('input', () => {
          recipeSearchAttempts++;
          
          // Show help if user searches multiple times without selecting
          if (recipeSearchAttempts >= 3) {
            const selectedRecipe = document.querySelector('input[name="recipeId"]:checked');
            if (!selectedRecipe) {
              Utils.showToast('💡 Tip: Click on a recipe card to select it', 'info', 5000);
              recipeSearchAttempts = 0;
            }
          }
        });
      }
    }

    // ✅ NEW: Handle opaque response feedback
    showOpaqueResponseFeedback() {
        const feedbackMessage = `
        <div class="opaque-response-notice">
            <h4>📤 Submission Sent</h4>
            <p>Your RSVP has been sent to the server. Due to security restrictions, we cannot immediately confirm if it was processed successfully.</p>
            <p>The menu will automatically refresh in a few seconds to show any updates.</p>
            <div class="feedback-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.menuDisplay.refresh()">
                Refresh Menu Now
            </button>
            </div>
        </div>
        `;
        
        Utils.showToast(feedbackMessage, 'info', 8000);
    }

  }
  
  // Initialize UX enhancements when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.uxEnhancements = new UXEnhancements();
    });
  } else {
    window.uxEnhancements = new UXEnhancements();
  }