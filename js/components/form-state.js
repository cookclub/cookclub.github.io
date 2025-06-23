/**
 * FORM STATE MANAGEMENT
 * Handles complex form state, validation timing, and user flow
 */

class FormStateManager {
    constructor() {
      this.state = {
        currentStep: 1,
        formData: {},
        validationState: {},
        isDirty: false,
        isSubmitting: false,
        lastValidation: null
      };
      
      this.listeners = new Map();
      this.validationQueue = [];
      this.isValidating = false;
      
      this.init();
    }
    
    init() {
      this.setupStateListeners();
      this.setupValidationQueue();
    }
    
    /**
     * State management
     */
    setState(updates) {
      const oldState = { ...this.state };
      this.state = { ...this.state, ...updates };
      
      // Notify listeners of state changes
      this.notifyListeners('stateChange', { oldState, newState: this.state });
      
      // Auto-save if form is dirty
      if (this.state.isDirty && !this.state.isSubmitting) {
        this.autoSave();
      }
    }
    
    getState() {
      return { ...this.state };
    }
    
    updateFormData(field, value) {
      const newFormData = { ...this.state.formData, [field]: value };
      this.setState({ 
        formData: newFormData, 
        isDirty: true 
      });
      
      // Queue validation for this field
      this.queueValidation(field, value);
    }
    
    /**
     * Validation queue management
     */
    setupValidationQueue() {
      // Process validation queue every 300ms
      setInterval(() => {
        if (this.validationQueue.length > 0 && !this.isValidating) {
          this.processValidationQueue();
        }
      }, 300);
    }
    
    queueValidation(field, value) {
      // Remove existing validation for this field
      this.validationQueue = this.validationQueue.filter(item => item.field !== field);
      
      // Add new validation
      this.validationQueue.push({
        field,
        value,
        timestamp: Date.now()
      });
    }
    
    async processValidationQueue() {
      if (this.isValidating) return;
      
      this.isValidating = true;
      
      try {
        // Group validations by field (take most recent)
        const validationMap = new Map();
        this.validationQueue.forEach(item => {
          if (!validationMap.has(item.field) || 
              validationMap.get(item.field).timestamp < item.timestamp) {
            validationMap.set(item.field, item);
          }
        });
        
        // Process validations
        for (let [field, item] of validationMap) {
          await this.validateField(field, item.value);
        }
        
        // Clear processed validations
        this.validationQueue = [];
        
      } finally {
        this.isValidating = false;
      }
    }
    
    async validateField(field, value) {
      try {
        // Get context for validation
        const context = await this.getValidationContext();
        
        // Perform validation
        const validation = Validation.validateFieldWithSuggestions(field, value, context);
        
        // Update validation state
        const newValidationState = { 
          ...this.state.validationState, 
          [field]: validation 
        };
        
        this.setState({ validationState: newValidationState });
        
        // Update UI
        this.updateFieldValidationUI(field, validation);
        
        // Notify listeners
        this.notifyListeners('fieldValidated', { field, validation });
        
      } catch (error) {
        console.error(`Validation error for field ${field}:`, error);
      }
    }
    
    // ✅ UPDATED CODE:
    async getValidationContext() {
      // Get current context for validation
      const context = {};
      
      try {
        // Get available recipes if needed
        if (this.state.formData.cooking) {
          // JSONP response is already parsed JSON
          const recipesData = await api.getRecipesWithClaimStatus();
          context.availableRecipes = recipesData.recipes;
          context.claimedRecipes = recipesData.claimed_recipes;
        }
        
        // Get existing RSVPs for duplicate checking
        // JSONP response is already parsed JSON
        const menuData = await api.getMenuData();
        if (menuData.success) {
          context.existingRSVPs = menuData.data.rsvp_summary?.attendees || [];
        }
        
      } catch (error) {
        console.error('Failed to get validation context:', error);
      }
      
      return context;
    }
    
    updateFieldValidationUI(field, validation) {
      const fieldElement = document.querySelector(`[name="${field}"]`);
      if (fieldElement) {
        if (validation.valid) {
          Validation.clearFieldError(fieldElement);
          fieldElement.classList.add('field-valid');
        } else {
          fieldElement.classList.remove('field-valid');
          Validation.showEnhancedFieldError(fieldElement, validation);
        }
      }
    }
    
    /**
     * Step management
     */
    canAdvanceToStep(stepNumber) {
      const currentStepValidation = this.validateCurrentStep();
      return currentStepValidation.valid;
    }
    
    validateCurrentStep() {
      const step = this.state.currentStep;
      const formData = this.state.formData;
      
      switch (step) {
        case 1: // User type
          return {
            valid: !!formData.userType,
            errors: formData.userType ? [] : ['Please select user type']
          };
          
        case 2: // User info
          if (formData.userType === 'member') {
            return {
              valid: !!formData.memberId,
              errors: formData.memberId ? [] : ['Please select your name']
            };
          } else {
            const nameValid = !!formData.displayName?.trim();
            const contactValid = !!(formData.instagramHandle?.trim() || formData.email?.trim());
            
            const errors = [];
            if (!nameValid) errors.push('Please enter your name');
            if (!contactValid) errors.push('Please provide Instagram handle or email');
            
            return {
              valid: nameValid && contactValid,
              errors
            };
          }
          
        case 3: // Participation
          return {
            valid: formData.cooking !== undefined,
            errors: formData.cooking !== undefined ? [] : ['Please select participation type']
          };
          
        case 4: // Recipe (if cooking)
          if (formData.cooking) {
            return {
              valid: !!formData.recipeId,
              errors: formData.recipeId ? [] : ['Please select a recipe']
            };
          }
          return { valid: true, errors: [] };
          
        case 5: // Details
          return { valid: true, errors: [] }; // All optional
          
        default:
          return { valid: false, errors: ['Invalid step'] };
      }
    }
    
    /**
     * Auto-save functionality
     */
    autoSave() {
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }
      
      this.autoSaveTimeout = setTimeout(() => {
        this.saveToLocalStorage();
      }, 2000);
    }
    
    saveToLocalStorage() {
      try {
        const saveData = {
          formData: this.state.formData,
          currentStep: this.state.currentStep,
          timestamp: Date.now()
        };
        
        localStorage.setItem('rsvp-autosave', JSON.stringify(saveData));
        
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }
    
    loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem('rsvp-autosave');
        if (!saved) return null;
        
        const saveData = JSON.parse(saved);
        
        // Check if save is recent (within 24 hours)
        const age = Date.now() - saveData.timestamp;
        if (age > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('rsvp-autosave');
          return null;
        }
        
        return saveData;
        
      } catch (error) {
        console.error('Failed to load auto-save:', error);
        localStorage.removeItem('rsvp-autosave');
        return null;
      }
    }
    
    clearAutoSave() {
      localStorage.removeItem('rsvp-autosave');
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
      }
    }
    
    /**
     * Event system
     */
    setupStateListeners() {
      // Listen for form input changes
      document.addEventListener('input', (e) => {
        if (e.target.form?.id === 'rsvp-form') {
          this.handleFormInput(e);
        }
      });
      
      document.addEventListener('change', (e) => {
        if (e.target.form?.id === 'rsvp-form') {
          this.handleFormChange(e);
        }
      });
    }
    
    handleFormInput(e) {
      const field = e.target.name;
      const value = e.target.value;
      
      if (field) {
        this.updateFormData(field, value);
      }
    }
    
    handleFormChange(e) {
      const field = e.target.name;
      let value = e.target.value;
      
      // Handle special input types
      if (e.target.type === 'checkbox') {
        value = e.target.checked;
      } else if (e.target.type === 'radio') {
        value = e.target.checked ? e.target.value : undefined;
      }
      
      if (field && value !== undefined) {
        this.updateFormData(field, value);
      }
    }
    
    addEventListener(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
    
    removeEventListener(event, callback) {
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
    
    notifyListeners(event, data) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
    }
    
    /**
     * Form submission
     */
    // ✅ UPDATED CODE:
    async submitForm() {
      if (this.state.isSubmitting) return;
      
      this.setState({ isSubmitting: true });
      
      try {
        // Final validation
        const context = await this.getValidationContext();
        const validation = Validation.validateFormWithContext(this.state.formData, context);
        
        if (!validation.valid) {
          throw new Error('Form validation failed: ' + validation.errors.join(', '));
        }
        
        // Submit via API - POST request with no-cors mode
        const response = await api.submitRSVP(this.state.formData);
        
        // ⚠️ CRITICAL: For no-cors POST requests, we cannot read the response
        // We assume success if the fetch didn't throw a network error
        // The response will always be { success: true, message: 'Request sent successfully' }
        
        // Clear auto-save on successful submission
        this.clearAutoSave();
        
        // Reset state
        this.setState({
          formData: {},
          isDirty: false,
          isSubmitting: false
        });
        
        return response;
        
      } catch (error) {
        this.setState({ isSubmitting: false });
        throw error;
      }
    }
  }
  
  // Initialize form state manager
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.formStateManager = new FormStateManager();
    });
  } else {
    window.formStateManager = new FormStateManager();
  }