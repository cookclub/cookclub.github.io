/**
 * FORM HANDLER - Progressive Disclosure Logic
 */

class FormHandler {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.formData = {};
    this.isSubmitting = false;
    this.availableRecipes = []; // To store recipes fetched from API for success message lookup
    
    this.form = document.getElementById('rsvp-form');
    this.steps = document.querySelectorAll('.form-step');
    this.prevBtn = document.getElementById('prev-step');
    this.nextBtn = document.getElementById('next-step');
    this.submitBtn = document.getElementById('submit-rsvp');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.updateProgress();
    this.showStep(1);
    this.loadInitialFormData(); // NEW: Call this to fetch data
  }
  
  bindEvents() {
    // Navigation buttons
    this.prevBtn.addEventListener('click', () => this.previousStep());
    this.nextBtn.addEventListener('click', () => this.nextStep());
    this.submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
    
    // User type selection
    const userTypeInputs = document.querySelectorAll('input[name="userType"]');
    userTypeInputs.forEach(input => {
      input.addEventListener('change', () => this.handleUserTypeChange());
    });
    
    // Participation type selection
    const cookingInputs = document.querySelectorAll('input[name="cooking"]');
    cookingInputs.forEach(input => {
      input.addEventListener('change', () => this.handleParticipationChange());
    });
    
    // Member selection
    const memberSelect = document.getElementById('member-select');
    if (memberSelect) {
      memberSelect.addEventListener('change', () => this.handleMemberSelection());
    }
    
    // Real-time validation
    this.setupRealTimeValidation();
    
    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Prevent accidental navigation away
    window.addEventListener('beforeunload', (e) => {
      if (this.hasFormData() && !this.isSubmitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  }

  // NEW: Method to load initial data from Apps Script
  async loadInitialFormData() {
    try {
      Utils.showToast('Loading event data...', 'info', 3000);

      // Use api.getFormData() which handles JSONP for GET requests
      const result = await api.getFormData(); 

      if (result.success && result.data) {
        const { members, recipes, event } = result.data;

        // Store recipes for later lookup (e.g., in success message)
        this.availableRecipes = recipes; 

        // Populate Event Info Section (from index.html)
        document.getElementById('event-title').textContent = event.event_name;
        document.getElementById('event-date').querySelector('.detail-text').textContent = new Date(event.event_date).toLocaleDateString();
        document.getElementById('event-cookbook').querySelector('.detail-text').textContent = event.cookbook_title;
        document.getElementById('event-location').querySelector('.detail-text').textContent = event.location;

        // Populate Member Select (Step 2)
        const memberSelect = document.getElementById('member-select');
        memberSelect.innerHTML = '<option value="">Choose your name...</option>'; // Clear existing options
        members.forEach(member => {
          const option = document.createElement('option');
          option.value = member.user_id;
          option.textContent = member.display_name;
          option.dataset.discordId = member.discord_id; // Store discordId for later
          memberSelect.appendChild(option);
        });

        // Populate Recipe List (Step 4)
        const recipeList = document.getElementById('recipe-list');
        recipeList.innerHTML = ''; // Clear existing content
        if (recipes.length > 0) {
          recipes.forEach(recipe => {
            const recipeItem = document.createElement('div');
            recipeItem.className = 'recipe-item';
            recipeItem.innerHTML = `
              <input type="radio" id="recipe-${recipe.recipe_id}" name="recipeId" value="${recipe.recipe_id}" class="recipe-radio">
              <label for="recipe-${recipe.recipe_id}" class="recipe-label">
                <h4>${recipe.recipe_name}</h4>
                <p>Page: ${recipe.page_number} | Category: ${recipe.category}</p>
                <p>Dietary: ${recipe.dietary_tags.join(', ')}</p>
                <p>Difficulty: ${recipe.difficulty}</p>
                <p>Ingredients: ${recipe.ingredients_preview.join(', ')}</p>
              </label>
            `;
            recipeList.appendChild(recipeItem);
          });
        } else {
          recipeList.innerHTML = '<p>No recipes available for claiming at this time.</p>';
        }

        Utils.showToast('Event data loaded!', 'success', 3000);
      } else {
        Utils.showToast(`Failed to load event data: ${result.message}`, 'error', 5000);
        console.error('Failed to load initial form data:', result.message);
      }
    } catch (error) {
      Utils.showToast(`Network error loading data: ${error.message}`, 'error', 5000);
      console.error('Error loading initial form data:', error);
    }
  }
  
  setupRealTimeValidation() {
    // Validate fields as user types (debounced)
    const validateField = Utils.debounce((field) => {
      this.validateSingleField(field);
    }, CONFIG.DEBOUNCE_DELAY);
    
    // Add validation to all form inputs
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        // Clear errors immediately on input
        Validation.clearFieldError(input);
      });
    });
  }
  
  validateSingleField(field) {
    const name = field.name;
    const value = field.value;
    
    let validation;
    
    switch (name) {
      case 'displayName':
        validation = Validation.validateDisplayName(value);
        break;
      case 'instagramHandle':
        validation = Validation.validateInstagramHandle(value);
        break;
      case 'email':
        validation = Validation.validateEmail(value);
        break;
      case 'guestCount':
        validation = Validation.validateGuestCount(value);
        break;
      case 'notes':
      case 'modifications':
        validation = Validation.validateNotes(value);
        break;
      default:
        return; // No validation for this field
    }
    
    if (validation) {
      Validation.showFieldError(field, validation.errors);
    }
  }
  
  handleUserTypeChange() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    // REMOVED: Direct style.display manipulation.
    // Step visibility is now controlled by showStep() via nextStep().
    
    this.formData.userType = userType;
    this.updateNavigationButtons();
  }
  
  handleMemberSelection() {
    const memberSelect = document.getElementById('member-select');
    const selectedOption = memberSelect.options[memberSelect.selectedIndex];
    const hiddenDisplayNameInput = document.getElementById('member-display-name-hidden');
    const hiddenDiscordIdInput = document.getElementById('member-discord-id-hidden');     
    
    if (selectedOption.value) {
      this.formData.memberId = selectedOption.value;
      this.formData.displayName = selectedOption.textContent;
      this.formData.discordId = selectedOption.dataset.discordId;

      // Update hidden fields so FormData picks them up
      if (hiddenDisplayNameInput) {
        hiddenDisplayNameInput.value = selectedOption.textContent;
      }
      if (hiddenDiscordIdInput) { 
        hiddenDiscordIdInput.value = selectedOption.dataset.discordId;
      }
    } else {
      // Clear hidden fields if no member is selected
      if (hiddenDisplayNameInput) hiddenDisplayNameInput.value = '';
      if (hiddenDiscordIdInput) hiddenDiscordIdInput.value = ''; 
    }
    
    this.updateNavigationButtons();
  }
  
  handleParticipationChange() {
    const cooking = document.querySelector('input[name="cooking"]:checked')?.value === 'true';
    
    this.formData.cooking = cooking;
    
    // Show/hide recipe modifications field
    const modificationsGroup = document.getElementById('recipe-modifications-group');
    if (cooking) {
      modificationsGroup.style.display = 'block';
    } else {
      modificationsGroup.style.display = 'none';
    }
    
    this.updateNavigationButtons();
  }
  
  showStep(stepNumber) {
    // Hide all steps
    this.steps.forEach(step => {
      step.style.display = 'none';
      step.setAttribute('aria-hidden', 'true');
    });
    
    // Show current step
    const currentStepElement = document.querySelector(`[data-step="${stepNumber}"]`);
    if (currentStepElement) {
      currentStepElement.style.display = 'block';
      currentStepElement.setAttribute('aria-hidden', 'false');
      
      // Focus first input in step
      const firstInput = currentStepElement.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
    
    this.currentStep = stepNumber;
    this.updateProgress();
    this.updateNavigationButtons();
    
    // Scroll to form
    Utils.scrollToElement(this.form, 20);
  }
  
  updateProgress() {
    const progress = (this.currentStep / this.totalSteps) * 100;
    this.progressFill.style.width = `${progress}%`;
    this.progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
  }
  
  updateNavigationButtons() {
    // Previous button
    if (this.currentStep > 1) {
      this.prevBtn.style.display = 'inline-block';
    } else {
      this.prevBtn.style.display = 'none';
    }
    
    // Next/Submit button logic
    const canProceed = this.canProceedFromCurrentStep();
    
    if (this.currentStep < this.totalSteps) {
      this.nextBtn.style.display = 'inline-block';
      this.nextBtn.disabled = !canProceed;
      this.submitBtn.style.display = 'none';
    } else {
      this.nextBtn.style.display = 'none';
      this.submitBtn.style.display = 'inline-block';
      this.submitBtn.disabled = !canProceed;
    }
  }
  
  canProceedFromCurrentStep() {
    switch (this.currentStep) {
      case 1: // User type selection
        return document.querySelector('input[name="userType"]:checked') !== null;
        
      case 2: // User information
        const userType = document.querySelector('input[name="userType"]:checked')?.value;
        if (userType === 'member') {
          const memberSelect = document.getElementById('member-select');
          const selectedMemberId = memberSelect.value;
          const hiddenDisplayName = document.getElementById('member-display-name-hidden')?.value;
          // Ensure a member is selected AND their display name is set in the hidden field
          return selectedMemberId !== '' && hiddenDisplayName !== '';
        } else if (userType === 'guest') {
          const name = document.getElementById('guest-name').value.trim();
          const email = document.getElementById('guest-email').value.trim(); // Email is now required
          return name !== '' && email !== ''; // Both name and email are required
        }
        return false;
        
      case 3: // Participation type
        return document.querySelector('input[name="cooking"]:checked') !== null;
        
      case 4: // Recipe selection (only if cooking)
        // Check the *currently selected* cooking radio button, not just this.formData.cooking
        const cookingSelected = document.querySelector('input[name="cooking"]:checked')?.value === 'true';
        if (cookingSelected) { 
          return document.querySelector('input[name="recipeId"]:checked') !== null;
        }
        return true; // Skip this step if not cooking
        
      case 5: // Additional details
        return true; // All fields are optional
        
      default:
        return false;
    }
  }
  
  nextStep() {
    if (!this.canProceedFromCurrentStep()) {
      this.showStepValidationErrors();
      return;
    }
    
    this.collectCurrentStepData(); // Collect data from current step before advancing
    
    let nextStep = this.currentStep + 1;

    // NEW LOGIC FOR STEP 1 TRANSITION: Show correct Step 2 based on userType
    if (this.currentStep === 1) {
        const userType = this.formData.userType; // Get userType from collected data
        if (userType === 'member') {
            document.getElementById('step-member-info').style.display = 'block';
            document.getElementById('step-guest-info').style.display = 'none';
        } else if (userType === 'guest') {
            document.getElementById('step-member-info').style.display = 'none';
            document.getElementById('step-guest-info').style.display = 'block';
        }
        // nextStep remains 2, which is correct for both member/guest info
    }
    
    // Skip recipe step if not cooking
    if (nextStep === 4 && !this.formData.cooking) {
      nextStep = 5;
    }
    
    if (nextStep <= this.totalSteps) {
      this.showStep(nextStep);
    }
  }
  
  previousStep() {
    let prevStep = this.currentStep - 1;
    
    // Skip recipe step if not cooking
    if (prevStep === 4 && !this.formData.cooking) {
      prevStep = 3;
    }
    
    if (prevStep >= 1) {
      this.showStep(prevStep);
    }
  }
  
  collectCurrentStepData() {
    const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (input.type === 'radio' || input.type === 'checkbox') {
        if (input.checked) {
          this.formData[input.name] = input.value;
        }
      } else {
        this.formData[input.name] = input.value;
      }
    });
  }
  
  showStepValidationErrors() {
    const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      this.validateSingleField(input);
    });
    
    // Show specific error message based on step
    let errorMessage = 'Please complete all required fields before continuing.';
    
    switch (this.currentStep) {
      case 1:
        errorMessage = 'Please select whether you are a member or guest.';
        break;
      case 2:
        if (this.formData.userType === 'member') {
          errorMessage = 'Please select your name from the member list.';
        } else {
          errorMessage = 'Please provide your name and email address.'; // Updated message
        }
        break;
      case 3:
        errorMessage = 'Please select whether you will be cooking or just attending.';
        break;
      case 4:
        errorMessage = 'Please select a recipe to cook.';
        break;
    }
    
    Utils.showToast(errorMessage, 'error', 5000);
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isSubmitting) return;
    
    // Collect all form data
    this.collectAllFormData();
    
    // Final validation
    const validation = Validation.validateFormData(this.formData);
    if (!validation.valid) {
      Utils.showToast('Please fix the errors before submitting.', 'error');
      this.showValidationErrors(validation.errors);
      return;
    }
    
    // Submit the form
    await this.submitForm();
  }
  
  collectAllFormData() {
    const formData = new FormData(this.form);

    // Clear previous formData and populate from the HTML form
    this.formData = {}; 
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
      this.formData[key] = value;
    }
    
    // Handle special cases
    this.formData.cooking = this.formData.cooking === 'true';
    this.formData.guestCount = parseInt(this.formData.guestCount) || 0;
    
    // Add member data if selected (this logic is already correct)
    if (this.formData.userType === 'member' && this.formData.memberId) {
      const memberSelect = document.getElementById('member-select');
      const selectedOption = memberSelect.options[memberSelect.selectedIndex];
      this.formData.discordId = selectedOption.dataset.discordId;
    }
  }
  
  // UPDATED: submitForm to use api.submitRSVP with no-cors
  async submitForm() {
    try {
      this.showSubmissionLoading();
      
      // api.submitRSVP is configured with mode: 'no-cors' in api.js
      // This means the response object will be opaque.
      const response = await api.submitRSVP(this.formData);
      
      // We assume success if the fetch didn't throw a network error.
      // The 'response' object here is the generic { success: true, message: '...' }
      // returned by api.makeRequest when mode is 'no-cors'.
      
      this.handleSubmitSuccess(response); 
      this.resetForm();
      
      // Trigger a delayed refresh to check if the submission was actually processed
      setTimeout(() => {
        if (window.menuDisplay) {
          window.menuDisplay.refresh();
        }
      }, 3000);
      
    } catch (error) {
      // Only network errors will be caught here
      this.showSubmissionError(`Network error: ${error.message}`);
    } finally {
      this.hideSubmissionLoading();
    }
  }
  
  // UPDATED: handleSubmitSuccess to call showSuccessMessage without 'data'
  handleSubmitSuccess(response) { 
    Utils.showToast('🎉 RSVP submitted successfully!', 'success', 8000);
    
    // Hide form and show success message
    // showSuccessMessage will now use this.formData directly
    this.showSuccessMessage(); 
    
    // Refresh menu data
    if (window.menuDisplay) {
      window.menuDisplay.loadMenuData(); 
    }
    
    // this.formData is cleared in resetForm()
  }
  
  handleSubmitError(message) {
    Utils.showToast(`❌ Failed to submit RSVP: ${message}`, 'error', 8000);
  }
  
  // UPDATED: showSuccessMessage to use this.formData and this.availableRecipes
  showSuccessMessage() { 
    const formContainer = document.querySelector('.form-container');
    
    // Use this.formData to reconstruct the success message
    const displayName = this.formData.displayName || 'Your Name';
    const responseType = this.formData.cooking ? 'Cooking' : 'Attending';
    let recipeName = '';

    // Look up recipe name from the stored availableRecipes
    if (this.formData.cooking && this.formData.recipeId && this.availableRecipes) {
        const selectedRecipe = this.availableRecipes.find(r => r.recipe_id == this.formData.recipeId);
        if (selectedRecipe) {
            recipeName = selectedRecipe.recipe_name;
        }
    }

    const successHTML = `
      <div class="success-message">
        <div class="success-icon">🎉</div>
        <h3 class="success-title">RSVP Submitted Successfully!</h3>
        <div class="success-details">
          <p><strong>Name:</strong> ${Utils.sanitizeHTML(displayName)}</p>
          <p><strong>Type:</strong> ${responseType}</p>
          ${recipeName ? `<p><strong>Recipe:</strong> ${Utils.sanitizeHTML(recipeName)}</p>` : ''}
        </div>
        <div class="success-actions">
          <button type="button" class="btn btn-primary" onclick="location.reload()">
            Submit Another RSVP
          </button>
        </div>
      </div>
    `;
    
    formContainer.innerHTML = successHTML;
    Utils.scrollToElement(formContainer, 20);
  }
  
  showValidationErrors(errors) {
    errors.forEach(error => {
      console.error('Validation error:', error);
    });
  }
  
  hasFormData() {
    return Object.keys(this.formData).length > 0 || 
           this.form.querySelector('input:not([type="radio"]):not([type="checkbox"])').value.trim() !== '';
  }

  // NEW: resetForm method
  resetForm() {
      this.form.reset(); // Resets all form fields to their initial state
      this.formData = {}; // Clear internal data
      this.currentStep = 1; // Go back to the first step
      this.updateProgress();
      // Also hide conditional steps if they were visible
      document.getElementById('step-member-info').style.display = 'none';
      document.getElementById('step-guest-info').style.display = 'none';
      document.getElementById('recipe-modifications-group').style.display = 'none';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.formHandler = new FormHandler();
  });
} else {
  window.formHandler = new FormHandler();
}
