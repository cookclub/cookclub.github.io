/**
 * RECIPE PICKER COMPONENT
 * Handles recipe selection, search, filtering, and display
 */

class RecipePicker {
    constructor() {
      this.recipes = [];
      this.filteredRecipes = [];
      this.selectedRecipe = null;
      this.claimedRecipes = new Set();
      
      this.recipeList = document.getElementById('recipe-list');
      this.searchInput = document.getElementById('recipe-search');
      this.categoryFilter = document.getElementById('category-filter');
      this.selectedRecipeDiv = document.getElementById('selected-recipe');
      
      this.init();
    }
    
    async init() {
      try {
        await this.loadRecipes();
        this.setupEventListeners();
        this.renderRecipes();
      } catch (error) {
        console.error('Failed to initialize recipe picker:', error);
        this.showRecipeLoadError();
      }
    }
    
    // ✅ UPDATED CODE:
    async loadRecipes() {
      try {
        // JSONP response is already parsed JSON
        const response = await api.getFormData();
        
        // For JSONP, response is the actual data object
        if (response.success && response.data.recipes) {
          this.recipes = response.data.recipes;
          this.filteredRecipes = [...this.recipes];
          
          // Load claimed recipes
          if (response.data.claimed_recipes) {
            this.claimedRecipes = new Set(response.data.claimed_recipes);
          }
          
          console.log(`✅ Loaded ${this.recipes.length} recipes`);
        } else {
          throw new Error(response.message || 'Failed to load recipes');
        }
      } catch (error) {
        console.error('Error loading recipes:', error);
        throw error;
      }
    }
    
    setupEventListeners() {
      // Search functionality
      if (this.searchInput) {
        this.searchInput.addEventListener('input', 
          Utils.debounce(() => this.handleSearch(), 300)
        );
      }
      
      // Category filter
      if (this.categoryFilter) {
        this.categoryFilter.addEventListener('change', () => this.handleFilter());
      }
    }
    
    handleSearch() {
      const searchTerm = this.searchInput.value.toLowerCase().trim();
      this.filterRecipes(searchTerm, this.categoryFilter.value);
    }
    
    handleFilter() {
      const searchTerm = this.searchInput.value.toLowerCase().trim();
      const category = this.categoryFilter.value;
      this.filterRecipes(searchTerm, category);
    }
    
    filterRecipes(searchTerm = '', category = '') {
      this.filteredRecipes = this.recipes.filter(recipe => {
        // Search filter
        const matchesSearch = !searchTerm || 
          recipe.recipe_name.toLowerCase().includes(searchTerm) ||
          recipe.category?.toLowerCase().includes(searchTerm) ||
          recipe.ingredients?.toLowerCase().includes(searchTerm) ||
          recipe.dietary_tags?.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !category || 
          recipe.category?.toLowerCase() === category.toLowerCase();
        
        return matchesSearch && matchesCategory;
      });
      
      this.renderRecipes();
    }
    
    renderRecipes() {
      if (!this.recipeList) return;
      
      if (this.filteredRecipes.length === 0) {
        this.recipeList.innerHTML = `
          <div class="no-recipes">
            <div class="no-recipes-icon">🔍</div>
            <div class="no-recipes-text">
              No recipes found matching your criteria.
              <br>
              <button type="button" class="link-button" onclick="window.recipePicker.clearFilters()">
                Clear filters
              </button>
            </div>
          </div>
        `;
        return;
      }
      
      const recipesHTML = this.filteredRecipes.map(recipe => {
        const isClaimed = this.claimedRecipes.has(recipe.recipe_id);
        const categoryEmoji = Utils.getCategoryEmoji(recipe.category);
        
        return `
          <div class="recipe-option ${isClaimed ? 'recipe-claimed' : ''}" 
               data-recipe-id="${recipe.recipe_id}">
            <input type="radio" 
                   id="recipe-${recipe.recipe_id}" 
                   name="recipeId" 
                   value="${recipe.recipe_id}" 
                   class="recipe-radio"
                   ${isClaimed ? 'disabled' : ''}
                   aria-describedby="recipe-${recipe.recipe_id}-details">
            
            <label for="recipe-${recipe.recipe_id}" class="recipe-label">
              <div class="recipe-header">
                <div class="recipe-title">
                  <span class="recipe-emoji">${categoryEmoji}</span>
                  <span class="recipe-name">${Utils.sanitizeHTML(recipe.recipe_name)}</span>
                  ${isClaimed ? '<span class="claimed-badge">Already claimed</span>' : ''}
                </div>
                ${recipe.difficulty ? `<div class="recipe-difficulty">${this.getDifficultyStars(recipe.difficulty)}</div>` : ''}
              </div>
              
              <div class="recipe-details" id="recipe-${recipe.recipe_id}-details">
                ${recipe.page_number ? `<span class="recipe-page">Page ${recipe.page_number}</span>` : ''}
                ${recipe.category ? `<span class="recipe-category">${Utils.sanitizeHTML(recipe.category)}</span>` : ''}
                ${recipe.dietary_tags ? `<span class="recipe-dietary">${Utils.sanitizeHTML(recipe.dietary_tags)}</span>` : ''}
              </div>
              
              ${recipe.description ? `
                <div class="recipe-description">
                  ${Utils.sanitizeHTML(recipe.description)}
                </div>
              ` : ''}
              
              ${recipe.ingredients ? `
                <div class="recipe-ingredients">
                  <strong>Key ingredients:</strong> ${Utils.sanitizeHTML(recipe.ingredients)}
                </div>
              ` : ''}
            </label>
          </div>
        `;
      }).join('');
      
      this.recipeList.innerHTML = recipesHTML;
      
      // Add event listeners to recipe options
      this.recipeList.querySelectorAll('.recipe-radio').forEach(radio => {
        radio.addEventListener('change', () => this.handleRecipeSelection(radio));
      });
      
      console.log(`✅ Rendered ${this.filteredRecipes.length} recipes`);
    }
    
    handleRecipeSelection(radio) {
      if (radio.checked) {
        const recipeId = radio.value;
        this.selectedRecipe = this.recipes.find(r => r.recipe_id === recipeId);
        this.showSelectedRecipe();
        
        // Update form handler
        if (window.formHandler) {
          window.formHandler.formData.recipeId = recipeId;
          window.formHandler.updateNavigationButtons();
        }
      }
    }
    
    showSelectedRecipe() {
      if (!this.selectedRecipe || !this.selectedRecipeDiv) return;
      
      const recipe = this.selectedRecipe;
      const categoryEmoji = Utils.getCategoryEmoji(recipe.category);
      
      const selectedHTML = `
        <div class="selected-recipe-card">
          <div class="selected-recipe-header">
            <span class="selected-recipe-emoji">${categoryEmoji}</span>
            <h5 class="selected-recipe-name">${Utils.sanitizeHTML(recipe.recipe_name)}</h5>
          </div>
          
          <div class="selected-recipe-meta">
            ${recipe.page_number ? `<span class="meta-item">📖 Page ${recipe.page_number}</span>` : ''}
            ${recipe.category ? `<span class="meta-item">🏷️ ${Utils.sanitizeHTML(recipe.category)}</span>` : ''}
            ${recipe.difficulty ? `<span class="meta-item">⭐ ${recipe.difficulty}</span>` : ''}
          </div>
          
          ${recipe.description ? `
            <div class="selected-recipe-description">
              ${Utils.sanitizeHTML(recipe.description)}
            </div>
          ` : ''}
          
          ${recipe.ingredients ? `
            <div class="selected-recipe-ingredients">
              <strong>Ingredients:</strong> ${Utils.sanitizeHTML(recipe.ingredients)}
            </div>
          ` : ''}
          
          ${recipe.dietary_tags ? `
            <div class="selected-recipe-dietary">
              <strong>Dietary info:</strong> ${Utils.sanitizeHTML(recipe.dietary_tags)}
            </div>
          ` : ''}
          
          ${recipe.accompaniments ? `
            <div class="selected-recipe-accompaniments">
              <strong>Suggested accompaniments:</strong> ${Utils.sanitizeHTML(recipe.accompaniments)}
            </div>
          ` : ''}
          
          <div class="selected-recipe-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.recipePicker.clearSelection()">
              Choose Different Recipe
            </button>
          </div>
        </div>
      `;
      
      this.selectedRecipeDiv.innerHTML = selectedHTML;
      this.selectedRecipeDiv.style.display = 'block';
      
      // Scroll to show selection
      Utils.scrollToElement(this.selectedRecipeDiv, 20);
    }
    
    clearSelection() {
      this.selectedRecipe = null;
      this.selectedRecipeDiv.style.display = 'none';
      
      // Clear radio selection
      const checkedRadio = this.recipeList.querySelector('.recipe-radio:checked');
      if (checkedRadio) {
        checkedRadio.checked = false;
      }
      
      // Update form handler
      if (window.formHandler) {
        window.formHandler.formData.recipeId = '';
        window.formHandler.updateNavigationButtons();
      }
    }
    
    clearFilters() {
      this.searchInput.value = '';
      this.categoryFilter.value = '';
      this.filteredRecipes = [...this.recipes];
      this.renderRecipes();
    }
    
    getDifficultyStars(difficulty) {
      const difficultyMap = {
        'easy': '⭐',
        'medium': '⭐⭐',
        'hard': '⭐⭐⭐',
        'expert': '⭐⭐⭐⭐'
      };
      
      return difficultyMap[difficulty?.toLowerCase()] || difficulty;
    }
    
    showRecipeLoadError() {
      if (!this.recipeList) return;
      
      this.recipeList.innerHTML = `
        <div class="recipe-error">
          <div class="error-icon">❌</div>
          <div class="error-text">
            Failed to load recipes. Please refresh the page.
            <br>
            <button type="button" class="btn btn-secondary btn-sm" onclick="location.reload()">
              Refresh Page
            </button>
          </div>
        </div>
      `;
      
      Utils.showToast('Failed to load recipe list. Please refresh the page.', 'error');
    }
    
    getSelectedRecipe() {
      return this.selectedRecipe;
    }
    
    updateClaimedRecipes(claimedRecipeIds) {
      this.claimedRecipes = new Set(claimedRecipeIds);
      this.renderRecipes();
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.recipePicker = new RecipePicker();
    });
  } else {
    window.recipePicker = new RecipePicker();
  }