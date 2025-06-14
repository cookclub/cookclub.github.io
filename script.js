// Recipe Sign-Up Form JavaScript
class RecipeSignupForm {
    constructor() {
        this.members = [];
        this.recipes = [];
        this.isLoading = false;
        
        this.initializeForm();
        this.loadData();
    }
    
    initializeForm() {
        // Get form elements
        this.form = document.getElementById('recipeForm');
        this.memberSelect = document.getElementById('member');
        this.cookingSelect = document.getElementById('cooking');
        this.recipeSelect = document.getElementById('recipe');
        this.recipeGroup = document.getElementById('recipeGroup');
        this.recipeInfo = document.getElementById('recipeInfo');
        this.submitBtn = document.getElementById('submitBtn');
        this.messageDiv = document.getElementById('message');
        
        // Add event listeners
        this.cookingSelect.addEventListener('change', () => this.handleCookingChange());
        this.recipeSelect.addEventListener('change', () => this.handleRecipeChange());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.memberSelect.addEventListener('change', () => this.validateForm());
        
        // Set event name
        document.getElementById('eventName').value = CONFIG.EVENT.name;
    }
    
    async loadData() {
        this.showMessage('Loading data...', 'info');
        
        try {
            // Load real data from Google Sheets
            await this.loadFromGoogleSheets();
            
            this.populateMemberDropdown();
            this.populateRecipeDropdown();
            
            this.hideMessage();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showMessage('Error loading data. Using sample data.', 'error');
            // Fallback to sample data if Google Sheets fails
            await this.loadSampleData();
            this.populateMemberDropdown();
            this.populateRecipeDropdown();
        }
    }
    
    async loadSampleData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.members = CONFIG.SAMPLE_MEMBERS.filter(member => member.active);
        this.recipes = CONFIG.SAMPLE_RECIPES.filter(recipe => !recipe.claimed);
    }
    
    async loadFromGoogleSheets() {
        // This method will be implemented when Google Apps Script is set up
        // For now, it's a placeholder for the real implementation
        
        if (!CONFIG.SCRIPT_URL) {
            throw new Error('Google Apps Script URL not configured');
        }
        
        try {
            const response = await fetch(`${CONFIG.SCRIPT_URL}?action=getData`);
            const data = await response.json();
            console.log('🚀 raw payload:', data);
            this.members = data.members.filter(member => member.active);
            this.recipes = data.recipes.filter(recipe => !recipe.claimed);
        } catch (error) {
            console.error('Error fetching from Google Sheets:', error);
            throw error;
        }
    }
    
    populateMemberDropdown() {
        // Clear existing options except the first one
        this.memberSelect.innerHTML = '<option value="">Select your name...</option>';
        
        this.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.discordId;
            option.textContent = member.displayName;
            this.memberSelect.appendChild(option);
        });
    }
    
    populateRecipeDropdown() {
        // Clear existing options except the first one
        this.recipeSelect.innerHTML = '<option value="">Select a recipe...</option>';
        
        if (this.recipes.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No recipes available';
            option.disabled = true;
            this.recipeSelect.appendChild(option);
            return;
        }
        
        this.recipes.forEach(recipe => {
            const option = document.createElement('option');
            option.value = recipe.id;
            option.textContent = recipe.name;
            this.recipeSelect.appendChild(option);
        });
    }
    
    handleCookingChange() {
        const isCooking = this.cookingSelect.value === 'yes';
        
        if (isCooking) {
            this.recipeGroup.style.display = 'block';
            this.recipeSelect.required = true;
        } else {
            this.recipeGroup.style.display = 'none';
            this.recipeSelect.required = false;
            this.recipeSelect.value = '';
            this.recipeInfo.style.display = 'none';
        }
        
        this.validateForm();
    }
    
    handleRecipeChange() {
        const selectedRecipeId = parseInt(this.recipeSelect.value);
        
        if (selectedRecipeId) {
            const recipe = this.recipes.find(r => r.id === selectedRecipeId);
            if (recipe) {
                this.recipeInfo.textContent = recipe.description;
                this.recipeInfo.style.display = 'block';
            }
        } else {
            this.recipeInfo.style.display = 'none';
        }
        
        this.validateForm();
    }
    
    validateForm() {
        const memberSelected = this.memberSelect.value !== '';
        const cookingSelected = this.cookingSelect.value !== '';
        const recipeSelected = this.cookingSelect.value === 'no' || this.recipeSelect.value !== '';
        
        const isValid = memberSelected && cookingSelected && recipeSelected;
        this.submitBtn.disabled = !isValid;
        
        return isValid;
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm() || this.isLoading) {
            return;
        }
        
        this.isLoading = true;
        this.setLoadingState(true);
        
        try {
            const formData = this.getFormData();
            
            // Submit to Google Apps Script
            await this.submitToGoogleSheets(formData);
            
            this.showMessage(CONFIG.MESSAGES.SUCCESS, 'success');
            this.resetForm();
            
            // Reload data to get updated recipe list
            await this.loadData();
            
        } catch (error) {
            console.error('Submission error:', error);
            
            if (error.message.includes('duplicate')) {
                this.showMessage(CONFIG.MESSAGES.DUPLICATE, 'error');
            } else {
                this.showMessage(CONFIG.MESSAGES.ERROR, 'error');
            }
        } finally {
            this.isLoading = false;
            this.setLoadingState(false);
        }
    }
    
    getFormData() {
        const discordId = this.memberSelect.value;
        const member = this.members.find(m => m.discordId === discordId);
        
        const formData = {
            eventName: document.getElementById('eventName').value,
            discordId: discordId,
            displayName: member ? member.displayName : '',
            cooking: this.cookingSelect.value === 'yes',
            recipeId: this.cookingSelect.value === 'yes' ? parseInt(this.recipeSelect.value) : null,
            recipeName: '',
            timestamp: new Date().toISOString()
        };
        
        if (formData.recipeId) {
            const recipe = this.recipes.find(r => r.id === formData.recipeId);
            formData.recipeName = recipe ? recipe.name : '';
        }
        
        return formData;
    }
    
    async simulateSubmission(formData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate random failure (10% chance)
        if (Math.random() < 0.1) {
            throw new Error('Network error');
        }
        
        // Simulate duplicate check (5% chance)
        if (formData.recipeId && Math.random() < 0.05) {
            throw new Error('Recipe already claimed - duplicate');
        }
        
        // If cooking, mark recipe as claimed
        if (formData.cooking && formData.recipeId) {
            const recipe = this.recipes.find(r => r.id === formData.recipeId);
            if (recipe) {
                recipe.claimed = true;
                recipe.claimedByDiscordId = formData.discordId;
                recipe.claimedAt = formData.timestamp;
                
                // Remove from available recipes and update dropdown
                this.recipes = this.recipes.filter(r => r.id !== formData.recipeId);
                this.populateRecipeDropdown();
            }
        }
        
        console.log('Form submitted successfully:', formData);
    }
    
    async submitToGoogleSheets(formData) {
        // This method will be implemented when Google Apps Script is set up
        if (!CONFIG.SCRIPT_URL) {
            throw new Error('Google Apps Script URL not configured');
        }
        
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'submitRSVP',
                data: formData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Submission failed');
        }
        
        return result;
    }
    
    setLoadingState(loading) {
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoading = this.submitBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            this.submitBtn.disabled = true;
            this.submitBtn.classList.add('loading');
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            this.submitBtn.classList.remove('loading');
            this.validateForm(); // Re-enable if form is valid
        }
    }
    
    showMessage(text, type) {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type}`;
        this.messageDiv.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 5000);
        }
    }
    
    hideMessage() {
        this.messageDiv.style.display = 'none';
        this.messageDiv.className = 'message';
    }
    
    resetForm() {
        this.form.reset();
        this.recipeGroup.style.display = 'none';
        this.recipeInfo.style.display = 'none';
        this.recipeSelect.required = false;
        this.submitBtn.disabled = true;
        document.getElementById('eventName').value = CONFIG.EVENT.name;
    }
}

// Initialize the form when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RecipeSignupForm();
});

