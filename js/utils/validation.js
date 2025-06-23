/**
 * FORM VALIDATION FUNCTIONS
 */

const Validation = {
    /**
     * Validate display name
     */
    validateDisplayName(name) {
      const errors = [];
      
      if (!name || name.trim().length === 0) {
        errors.push('Display name is required');
      } else if (name.trim().length > CONFIG.MAX_DISPLAY_NAME_LENGTH) {
        errors.push(`Display name must be ${CONFIG.MAX_DISPLAY_NAME_LENGTH} characters or less`);
      } else if (name.trim().length < 2) {
        errors.push('Display name must be at least 2 characters');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: name ? name.trim() : ''
      };
    },
    
    /**
     * Validate Instagram handle
     */
    validateInstagramHandle(handle) {
      const errors = [];
      
      if (!handle) {
        return { valid: true, errors: [], value: '' }; // Optional field
      }
      
      const formatted = Utils.formatInstagramHandle(handle);
      
      if (!formatted) {
        errors.push('Instagram handle must start with @ and contain only letters, numbers, periods, or underscores');
      } else if (formatted.length < 3) {
        errors.push('Instagram handle must be at least 2 characters after the @');
      } else if (formatted.length > 31) {
        errors.push('Instagram handle must be 30 characters or less after the @');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: formatted
      };
    },
    
    /**
     * Validate email
     */
    validateEmail(email) {
      const errors = [];
      
      if (!email) {
        return { valid: true, errors: [], value: '' }; // Optional field
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
      } else if (email.length > 254) {
        errors.push('Email address is too long');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: email.trim().toLowerCase()
      };
    },
    
    /**
     * Validate Discord ID
     */
    validateDiscordId(discordId) {
      const errors = [];
      
      if (!discordId || discordId.trim().length === 0) {
        errors.push('Discord ID is required for members');
      } else if (!/^\d{17,19}$/.test(discordId.trim())) {
        errors.push('Discord ID must be 17-19 digits');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: discordId ? discordId.trim() : ''
      };
    },
    
    /**
     * Validate guest count
     */
    validateGuestCount(count) {
      const errors = [];
      const numCount = parseInt(count) || 0;
      
      if (numCount < 0) {
        errors.push('Guest count cannot be negative');
      } else if (numCount > CONFIG.MAX_GUEST_COUNT) {
        errors.push(`Maximum ${CONFIG.MAX_GUEST_COUNT} guests allowed`);
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: numCount
      };
    },
    
    /**
     * Validate notes
     */
    validateNotes(notes) {
      const errors = [];
      
      if (notes && notes.length > CONFIG.MAX_NOTES_LENGTH) {
        errors.push(`Notes must be ${CONFIG.MAX_NOTES_LENGTH} characters or less`);
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: notes ? notes.trim() : ''
      };
    },
    
    /**
     * Validate recipe selection
     */
    validateRecipeSelection(recipeId, isCooking) {
      const errors = [];
      
      if (isCooking && (!recipeId || recipeId.trim().length === 0)) {
        errors.push('Please select a recipe if you are cooking');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: recipeId ? recipeId.trim() : ''
      };
    },
    
    /**
     * Validate complete form data
     */
    validateFormData(formData) {
      const results = {
        displayName: this.validateDisplayName(formData.displayName),
        instagramHandle: this.validateInstagramHandle(formData.instagramHandle),
        email: this.validateEmail(formData.email),
        guestCount: this.validateGuestCount(formData.guestCount),
        notes: this.validateNotes(formData.notes),
        recipeSelection: this.validateRecipeSelection(formData.recipeId, formData.cooking)
      };
      
      // User type specific validation
      if (formData.userType === 'member') {
        results.discordId = this.validateDiscordId(formData.discordId);
      } else if (formData.userType === 'guest') {
        // Guests need at least one contact method
        if (!results.instagramHandle.value && !results.email.value) {
          results.contactMethod = {
            valid: false,
            errors: ['Please provide either an Instagram handle or email address'],
            value: ''
          };
        } else {
          results.contactMethod = { valid: true, errors: [], value: 'provided' };
        }
      }
      
      // Collect all errors
      const allErrors = [];
      Object.values(results).forEach(result => {
        if (result && result.errors) {
          allErrors.push(...result.errors);
        }
      });
      
      return {
        valid: allErrors.length === 0,
        errors: allErrors,
        results: results
      };
    },
    
    // Add these enhanced validation methods to the Validation object

    /**
     * Advanced form validation with context awareness
     */
    validateFormWithContext(formData, context = {}) {
      const results = this.validateFormData(formData);
      
      // Add context-specific validation
      if (context.availableRecipes) {
        results.recipeAvailability = this.validateRecipeAvailability(
          formData.recipeId, 
          context.availableRecipes
        );
      }
      
      if (context.existingRSVPs) {
        results.duplicateRSVP = this.validateDuplicateRSVP(
          formData, 
          context.existingRSVPs
        );
      }
      
      // Recalculate overall validity
      const allResults = Object.values(results);
      const allErrors = [];
      allResults.forEach(result => {
        if (result && result.errors) {
          allErrors.push(...result.errors);
        }
      });
      
      return {
        valid: allErrors.length === 0,
        errors: allErrors,
        results: results
      };
    },

    /**
     * Validate recipe availability
     */
    validateRecipeAvailability(recipeId, availableRecipes) {
      const errors = [];
      
      if (!recipeId) {
        return { valid: true, errors: [], value: '' };
      }
      
      const recipe = availableRecipes.find(r => r.recipe_id === recipeId);
      
      if (!recipe) {
        errors.push('Selected recipe is not available');
      } else if (recipe.is_claimed) {
        errors.push('This recipe has already been claimed by someone else');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: recipeId
      };
    },

    /**
     * Check for duplicate RSVP
     */
    validateDuplicateRSVP(formData, existingRSVPs) {
      const errors = [];
      
      // Check if user already has an RSVP
      const existingRSVP = existingRSVPs.find(rsvp => {
        if (formData.userType === 'member') {
          return rsvp.discord_id === formData.discordId;
        } else {
          return rsvp.display_name === formData.displayName ||
                (formData.instagramHandle && rsvp.instagram_handle === formData.instagramHandle);
        }
      });
      
      if (existingRSVP) {
        errors.push('You have already submitted an RSVP for this event');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        value: existingRSVP ? existingRSVP.rsvp_id : null
      };
    },

    /**
     * Real-time field validation with suggestions
     */
    validateFieldWithSuggestions(fieldName, value, context = {}) {
      const baseValidation = this.validateSingleFieldValue(fieldName, value);
      
      // Add suggestions for common issues
      if (!baseValidation.valid) {
        baseValidation.suggestions = this.getSuggestions(fieldName, value, baseValidation.errors);
      }
      
      return baseValidation;
    },

    /**
     * Get helpful suggestions for validation errors
     */
    getSuggestions(fieldName, value, errors) {
      const suggestions = [];
      
      switch (fieldName) {
        case 'displayName':
          if (value.length < 2) {
            suggestions.push('Try using your full first name or nickname');
          } else if (value.length > CONFIG.MAX_DISPLAY_NAME_LENGTH) {
            suggestions.push('Try using a shorter version of your name');
          }
          break;
          
        case 'instagramHandle':
          if (value && !value.startsWith('@')) {
            suggestions.push('Instagram handles should start with @');
          } else if (value && value.includes(' ')) {
            suggestions.push('Instagram handles cannot contain spaces');
          }
          break;
          
        case 'email':
          if (value && !value.includes('@')) {
            suggestions.push('Email addresses must contain an @ symbol');
          } else if (value && !value.includes('.')) {
            suggestions.push('Email addresses must contain a domain (like .com)');
          }
          break;
      }
      
      return suggestions;
    },

    /**
     * Validate single field value (helper method)
     */
    validateSingleFieldValue(fieldName, value) {
      switch (fieldName) {
        case 'displayName':
          return this.validateDisplayName(value);
        case 'instagramHandle':
          return this.validateInstagramHandle(value);
        case 'email':
          return this.validateEmail(value);
        case 'discordId':
          return this.validateDiscordId(value);
        case 'guestCount':
          return this.validateGuestCount(value);
        case 'notes':
        case 'modifications':
          return this.validateNotes(value);
        default:
          return { valid: true, errors: [], value: value };
      }
    },

    /**
     * Show enhanced field validation with suggestions
     */
    showEnhancedFieldError(fieldElement, validation) {
      if (!fieldElement) return;
      
      // Clear existing errors
      this.clearFieldError(fieldElement);
      
      if (validation.valid) return;
      
      // Add error state
      fieldElement.classList.add('field-error');
      fieldElement.setAttribute('aria-invalid', 'true');
      
      // Create enhanced error message
      const errorContainer = document.createElement('div');
      errorContainer.className = 'field-error-container';
      
      // Main error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'field-error-message';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.textContent = validation.errors[0];
      errorContainer.appendChild(errorMessage);
      
      // Add suggestions if available
      if (validation.suggestions && validation.suggestions.length > 0) {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'field-suggestion';
        suggestionElement.innerHTML = `
          <span class="suggestion-icon">💡</span>
          <span class="suggestion-text">${validation.suggestions[0]}</span>
        `;
        errorContainer.appendChild(suggestionElement);
      }
      
      // Insert after field
      fieldElement.parentNode.insertBefore(errorContainer, fieldElement.nextSibling);
      
      // Associate with field for accessibility
      const errorId = Utils.generateId('error');
      errorContainer.id = errorId;
      fieldElement.setAttribute('aria-describedby', errorId);
    },

    /**
     * Show validation errors in UI
     */
    showFieldError(fieldElement, errors) {
      if (!fieldElement) return;
      
      // Remove existing error state
      this.clearFieldError(fieldElement);
      
      if (errors.length === 0) return;
      
      // Add error state
      fieldElement.classList.add('field-error');
      fieldElement.setAttribute('aria-invalid', 'true');
      
      // Create error message element
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.textContent = errors[0]; // Show first error
      
      // Insert after field
      fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
      
      // Associate with field for accessibility
      const errorId = Utils.generateId('error');
      errorElement.id = errorId;
      fieldElement.setAttribute('aria-describedby', errorId);
    },
    
    /**
     * Clear validation errors from field
     */
    clearFieldError(fieldElement) {
      if (!fieldElement) return;
      
      fieldElement.classList.remove('field-error');
      fieldElement.removeAttribute('aria-invalid');
      fieldElement.removeAttribute('aria-describedby');
      
      // Remove error message
      const errorElement = fieldElement.parentNode.querySelector('.field-error-message');
      if (errorElement) {
        errorElement.remove();
      }
    },
    
    /**
     * Clear all validation errors from form
     */
    clearAllErrors(formElement) {
      if (!formElement) return;
      
      const fields = formElement.querySelectorAll('.field-error');
      fields.forEach(field => this.clearFieldError(field));
      
      const errorMessages = formElement.querySelectorAll('.field-error-message');
      errorMessages.forEach(msg => msg.remove());
    }
  };
  
  // Debug logging
  if (CONFIG.DEBUG) {
    window.Validation = Validation;
    console.log('✅ Validation loaded in debug mode');
  }