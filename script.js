// Recipe Sign-Up Form JavaScript

// Pastel palette for category pills
const PILL_COLORS = [
    '#F8D7DA', // soft rose
    '#FFF3CD', // pale gold
    '#D1ECF1', // baby aqua
    '#D4EDDA', // mint
    '#E2D6F8', // lavender
    '#FDE2E4', // peach
    '#E8F0FE', // light sky
    '#F0F3F5', // light gray
    '#FFEBE5', // blush
    '#EAF7E0'  // pistachio
];

// Map to keep a deterministic color for each category
const categoryColorMap = new Map();
let nextColorIndex = 0;

// Recognized guest codes passed via the "g" query parameter
// Extend this array with new guest groups as needed
const guestCodes = ["cltgalpals"];

// -------------------------------------------------------------
// Audience type detection
// -------------------------------------------------------------
(() => {
    // Check for ?g= query param when the script loads
    const params = new URLSearchParams(window.location.search);
    const code = params.get('g');
    const stored = localStorage.getItem('audienceType');

    if (code && guestCodes.includes(code.toLowerCase())) {
        // Recognized guest code => treat as guest
        window.audienceType = 'guest';
        localStorage.setItem('audienceType', 'guest');
    } else if (stored) {
        // Reuse the previously stored audience type
        window.audienceType = stored;
    } else {
        // Default to member for all other cases
        window.audienceType = 'member';
    }
})();

/**
 * Determine if the current viewer is a guest.
 * This utility runs early so other UI steps can rely on it.
 */
function isGuest() {
    return window.audienceType === 'guest';
}

// -------------------------------------------------------------
// Accent color extraction utilities
// -------------------------------------------------------------
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function rgbToHex(r, g, b) {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function extractAccentColor(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let best = { sat: 0, r: 0, g: 0, b: 0 };
    for (let i = 0; i < data.length; i += 40) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const [, s, l] = rgbToHsl(r, g, b);
        if (s > best.sat && l > 0.2 && l < 0.8) {
            best = { sat: s, r, g, b };
        }
    }
    return rgbToHex(best.r, best.g, best.b);
}

function setAccentFromImage(selector) {
    const img = document.querySelector(selector);
    if (!img) return;
    if (img.complete) {
        const color = extractAccentColor(img);
        document.documentElement.style.setProperty('--accent', color);
    } else {
        img.onload = () => {
            const color = extractAccentColor(img);
            document.documentElement.style.setProperty('--accent', color);
        };
    }
}

/**
 * Render pastel category pills into the given container.
 * Each new category gets the next color from the palette.
 */
function renderCategoryPills(categories, container) {
    // Remove any existing pills to avoid duplicates
    container.querySelectorAll('.pill').forEach(p => p.remove());

    categories.forEach(cat => {
        const key = String(cat).trim();

        if (!categoryColorMap.has(key)) {
            categoryColorMap.set(key, PILL_COLORS[nextColorIndex]);
            nextColorIndex = (nextColorIndex + 1) % PILL_COLORS.length;
        }

        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = key;
        pill.style.backgroundColor = categoryColorMap.get(key);

        container.appendChild(pill);
    });
}

// Course and diet helpers ---------------------------------------
const COURSE_CATEGORIES = {
    main: ['Main course', 'Stews & one-pot meals', 'Grills & BBQ', 'Rice dishes', 'Pasta, doughs & sauces'],
    side: ['Side dish', 'Salads', 'Sauces, general', 'Dressings & marinades'],
    dessert: ['Dessert']
};

const COURSE_KEYWORDS = {
    dessert: ['cake', 'pie', 'cookie', 'pudding', 'tart', 'brownie'],
    main: ['roast', 'steak', 'pasta', 'curry', 'lasagna', 'stew'],
    side: ['salad', 'slaw', 'soup', 'dip', 'side']
};

const VEG_KEYWORDS = ['tofu', 'broccoli', 'cauliflower', 'tempeh', 'seitan'];
const NON_VEG_WORDS = ['chicken', 'beef', 'pork', 'bacon', 'shrimp', 'turkey'];

function normalizeCategories(list) {
    if (Array.isArray(list)) return list.map(c => String(c).trim());
    if (typeof list === 'string') return list.split(';').map(c => c.trim());
    return [];
}

function detectCourse(recipe) {
    const cats = normalizeCategories(recipe.categories);
    for (const [course, options] of Object.entries(COURSE_CATEGORIES)) {
        for (const c of cats) {
            if (options.some(opt => opt.toLowerCase() === c.toLowerCase())) {
                return course;
            }
        }
    }

    const title = String(recipe.title || recipe.name || '').toLowerCase();
    for (const [course, words] of Object.entries(COURSE_KEYWORDS)) {
        if (words.some(w => title.includes(w))) {
            return course;
        }
    }
    return '';
}

function getVegStatus(recipe) {
    const cats = normalizeCategories(recipe.categories).map(c => c.toLowerCase());
    if (cats.includes('vegan')) return 'Vegan';
    if (cats.includes('vegetarian')) return 'Vegetarian';

    const text = `${recipe.title || recipe.name || ''} ${recipe.description || ''}`.toLowerCase();
    if (NON_VEG_WORDS.some(w => text.includes(w))) return '';
    if (VEG_KEYWORDS.some(w => text.includes(w))) return 'Vegetarian';
    return '';
}

function isVegRecipe(recipe) {
    return !!getVegStatus(recipe);
}

// Utility to get a recipe's display name, accommodating different property keys
function getRecipeName(recipe) {
    return recipe.name || recipe.title || '';
}

class RecipeSignupForm {
    constructor() {
        this.members = [];
        this.recipes = [];
        this.allRecipes = [];
        this.isLoading = false;
        
        this.initializeForm();
        this.loadData();
    }
    
    initializeForm() {
        // Get form elements
        this.form = document.getElementById('recipeForm');
        this.memberInput = document.getElementById('member');
        this.memberList = document.getElementById('member-list');
        this.guestName = document.getElementById('guestName');
        this.guestEmail = document.getElementById('guestEmail');
        this.audienceField = document.getElementById('audienceType');
        this.cookingRadios = document.querySelectorAll('input[name="cooking"]');
        this.recipeInput = document.getElementById('recipe');
        this.recipeGroup = document.getElementById('recipeGroup');
        this.recipeEntry = document.getElementById('recipeEntry');
        this.changeRecipeLink = document.getElementById('changeRecipe');
        this.recipeModal = document.getElementById('recipeModal');
        this.recipeModalList = document.getElementById('recipeModalList');
        this.recipeModalClose = document.getElementById('recipeModalClose');
        this.recipeSearch = document.getElementById('recipeSearch');
        this.cachedSearch = '';
        this.cachedScroll = 0;
        this.submitBtn = document.getElementById('submitBtn');
        this.messageDiv = document.getElementById('message');
        this.notesField = document.getElementById('notes');
        
        // Add event listeners
        this.cookingRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleCookingChange());
        });
        this.recipeInput.addEventListener('click', (e) => {
            e.preventDefault();
            this.openRecipeModal();
        });
        this.recipeInput.addEventListener('focus', (e) => {
            e.preventDefault();
            this.openRecipeModal();
        });
        if (this.changeRecipeLink) {
            this.changeRecipeLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openRecipeModal();
            });
        }
        if (this.recipeModalClose) {
            this.recipeModalClose.addEventListener('click', () => this.closeRecipeModal());
        }
        if (this.recipeSearch) {
            this.recipeSearch.addEventListener('input', () => this.renderRecipeModalList());
        }
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.memberInput.addEventListener('input', () => this.validateForm());
        this.memberInput.addEventListener('change', () => this.validateForm());
        if (this.guestName) {
            this.guestName.addEventListener('input', () => this.validateForm());
            this.guestName.addEventListener('change', () => this.validateForm());
        }
        if (this.guestEmail) {
            this.guestEmail.addEventListener('input', () => this.validateForm());
        }
        
        // Set event name
        document.getElementById('eventName').value = CONFIG.EVENT.name;
        
        // Set event date
        document.getElementById('eventDate').value = CONFIG.EVENT.date;        
    }
    
    async loadData() {
        this.showMessage('Loading data...', 'info');
        
        try {
            // Load real data from Google Sheets
            await this.loadFromGoogleSheets();
            
            this.populateMemberDropdown();
            this.populateRecipeDropdown();
            this.renderMenu();

            this.hideMessage();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showMessage('Error loading data. Using sample data.', 'error');
            // Fallback to sample data if Google Sheets fails
            await this.loadSampleData();
            this.populateMemberDropdown();
            this.populateRecipeDropdown();
            this.renderMenu();
            this.hideMessage();
        }
    }
    
    async loadSampleData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.members = CONFIG.SAMPLE_MEMBERS.filter(member => member.active);
        this.allRecipes = CONFIG.SAMPLE_RECIPES.map(r => ({ ...r }));
        this.recipes = this.allRecipes.filter(recipe => !recipe.claimed);
    }
    
    async loadFromGoogleSheets() {
        if (!CONFIG.SCRIPT_URL) {
            throw new Error('Google Apps Script URL not configured');
        }
        
        try {
            const url = `${CONFIG.SCRIPT_URL}?action=getData&cb=${Date.now()}`;
            console.log('🔄 Fetching data from:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 1. Log the raw response
            const raw = await response.json();
            console.log('🚀 raw payload:', raw);
            
            // Check if the response indicates success
            if (!raw.success) {
                throw new Error(raw.message || 'API returned error');
            }
            
            // 2. Guard against unexpected shapes
            if (!raw.data || !Array.isArray(raw.data.members) || !Array.isArray(raw.data.recipes)) {
                console.error('❌ Unexpected payload shape. Expected: {success: true, data: {members: [], recipes: []}}');
                console.error('❌ Received:', raw);
                throw new Error('Unexpected payload shape');
            }
            
            // 3. Destructure the nested data envelope
            const { members, recipes } = raw.data;
            
            console.log('📊 Members found:', members.length);
            console.log('🍽️ Recipes found:', recipes.length);
            
            // 4. Filter the clean arrays
            const activeMembers = members.filter(m => m.active);
            this.allRecipes = recipes.map(r => ({ ...r, id: parseInt(r.id, 10) }));
            const availableRecipes = this.allRecipes.filter(r => !r.claimed);
            
            console.log('✅ Active members:', activeMembers.length);
            console.log('🆓 Available recipes:', availableRecipes.length);
            
            this.members = activeMembers;
            this.recipes = availableRecipes;
            
            if (this.members.length === 0) {
                throw new Error('No active members found');
            }
            
            if (this.recipes.length === 0) {
                console.warn('⚠️ No available recipes found - all may be claimed');
            }
            
        } catch (error) {
            console.error('❌ Error fetching from Google Sheets:', error);
            throw error;
        }
    }
    
    populateMemberDropdown() {
        // Populate datalist for member names
        if (this.memberList) this.memberList.innerHTML = '';

        this.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.displayName;
            this.memberList.appendChild(option);
        });

        console.log('👥 Populated member list with', this.members.length, 'members');
    }

    populateRecipeDropdown() {
        // Render list in modal on initial load
        this.renderRecipeModalList();
        console.log('🍽️ Prepared recipe picker with', this.recipes.length, 'recipes');
    }

    getCookingValue() {
        const checked = document.querySelector('input[name="cooking"]:checked');
        return checked ? checked.value : '';
    }

    handleCookingChange() {
        const value = this.getCookingValue();
        this.cookingRadios.forEach(radio => {
            if (radio.checked) {
                radio.parentElement.classList.add('selected');
            } else {
                radio.parentElement.classList.remove('selected');
            }
        });
        const isCooking = value === 'yes';

        if (isCooking) {
            this.recipeGroup.style.display = 'block';
            this.recipeInput.required = true;
        } else {
            this.recipeGroup.style.display = 'none';
            this.recipeInput.required = false;
            this.recipeInput.value = '';
            this.recipeEntry.style.display = 'none';
            this.recipeEntry.innerHTML = '';
            if (this.changeRecipeLink) this.changeRecipeLink.style.display = 'none';
        }
        
        this.validateForm();
    }
    
    handleRecipeChange() {
        const inputName = this.recipeInput.value;

        const recipe = this.recipes.find(r => getRecipeName(r) === inputName);
        if (recipe) {
            this.renderRecipeEntry(recipe);
            this.recipeEntry.style.display = 'block';
            if (this.changeRecipeLink) this.changeRecipeLink.style.display = 'block';
        } else {
            this.recipeEntry.style.display = 'none';
            this.recipeEntry.innerHTML = '';
            if (this.changeRecipeLink) this.changeRecipeLink.style.display = 'none';
        }

        this.validateForm();
    }

    renderRecipeEntry(recipe) {
        const entry = buildRecipeDetails(recipe);

        this.recipeEntry.innerHTML = '';
        this.recipeEntry.appendChild(entry);
    }
    
    validateForm() {
        const audience = this.audienceField ? this.audienceField.value : 'member';
        let nameValid = false;
        if (audience === 'member') {
            nameValid = this.members.some(m => m.displayName === this.memberInput.value);
        } else {
            nameValid = this.guestName && this.guestName.value.trim() !== '';
        }

        const cookingValue = this.getCookingValue();
        const cookingSelected = cookingValue !== '';
        const recipeSelected = cookingValue === 'no' || this.recipes.some(r => getRecipeName(r) === this.recipeInput.value);

        const isValid = nameValid && cookingSelected && recipeSelected;
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
            console.log('📤 Submitting form data:', formData);
            
            // Submit to Google Apps Script
            await this.submitToGoogleSheets(formData);
            
            this.showConfirmation();
            this.resetForm();

            // Reload data to get updated recipe list
            await this.loadData();
            
        } catch (error) {
            console.error('❌ Submission error:', error);
            
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
    
    // getFormData() {
    //     const member = this.members.find(m => m.displayName === this.memberInput.value);
    //     const discordId = member ? member.discordId : '';
        
    //     const cookingValue = this.getCookingValue();
    //     const formData = {
    //         eventName: document.getElementById('eventName').value,
    //         discordId: discordId,
    //         displayName: member ? member.displayName : '',
    //         cooking: cookingValue === 'yes',
    //         recipeId: cookingValue === 'yes' ? (() => {
    //             const r = this.recipes.find(rc => rc.name === this.recipeInput.value);
    //             return r ? parseInt(r.id, 10) : null;
    //         })() : null,
    //         recipeName: '',
    //         notes: this.notesField.value.trim(),
    //         timestamp: new Date().toISOString()
    //     };

    getFormData() {
        const audience    = this.audienceField ? this.audienceField.value : 'member';
        const member      = this.members.find(m => m.displayName === this.memberInput.value.trim());
        const cookingFlag = this.getCookingValue() === 'yes';
        const recipeInput = this.recipeInput.value.trim();

        const selectedRecipe = cookingFlag
            ? this.recipes.find(r => getRecipeName(r) === recipeInput)
            : null;

        const note      = this.notesField.value.trim();
        const recordUrl = selectedRecipe ? (selectedRecipe.recordUrl || '') : '';

        return {
            eventName   : document.getElementById('eventName').value,
            eventDate   : document.getElementById('eventDate').value,
            audienceType: audience,
            audienceCode: document.getElementById('audienceCode') ? document.getElementById('audienceCode').value : '',
            discordId   : audience === 'member' && member ? member.discordId : '',
            displayName : audience === 'member' && member ? member.displayName : (this.guestName ? this.guestName.value.trim() : ''),
            guestEmail  : audience === 'guest' && this.guestEmail ? this.guestEmail.value.trim() : '',
            cooking     : cookingFlag,
            recipeId    : selectedRecipe ? Number(selectedRecipe.id) : null,
            recipeName  : selectedRecipe ? getRecipeName(selectedRecipe) : '',
            recordUrl,
            note,
            timestamp   : new Date().toISOString()
        };
    }

    async submitToGoogleSheets(formData) {
      if (!CONFIG.SCRIPT_URL) {
        throw new Error('Google Apps Script URL not configured');
      }
      
      console.log('📡 Submitting to Google Apps Script...');
      
      // Create form data (no JSON, no custom headers = no CORS preflight)
      const formBody = new URLSearchParams();
      formBody.append('action', 'submitRSVP');
      formBody.append('data', JSON.stringify(formData));
      
      const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        body: formBody  // No headers = simple request
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 Submission result:', result);
      
      if (!result.success) {
        throw new Error(result.error || result.message || 'Submission failed');
      }
      
      return result;
    }


    
    // async submitToGoogleSheets(formData) {
    //     if (!CONFIG.SCRIPT_URL) {
    //         throw new Error('Google Apps Script URL not configured');
    //     }
        
    //     console.log('📡 Submitting to Google Apps Script...');
        
    //     const response = await fetch(CONFIG.SCRIPT_URL, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             action: 'submitRSVP',
    //             data: formData
    //         })
    //     });
        
    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }
        
    //     const result = await response.json();
    //     console.log('📥 Submission result:', result);
        
    //     if (!result.success) {
    //         throw new Error(result.error || result.message || 'Submission failed');
    //     }
        
    //     return result;
    // }
    
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

    showConfirmation() {
        const formCard = document.querySelector('.form-card');
        const confirm = document.getElementById('confirmation');
        if (!formCard || !confirm) return;
        formCard.classList.add('fade-out');
        formCard.addEventListener('transitionend', () => {
            formCard.style.display = 'none';
            confirm.style.display = 'block';
            confirm.classList.add('fade-in');
            if (window.confetti) {
                window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
        }, { once: true });
    }
    
    resetForm() {
        this.form.reset();
        this.recipeGroup.style.display = 'none';
        this.recipeEntry.style.display = 'none';
        this.recipeEntry.innerHTML = '';
        this.recipeInput.required = false;
        if (this.changeRecipeLink) this.changeRecipeLink.style.display = 'none';
        this.submitBtn.disabled = true;
        this.cookingRadios.forEach(r => r.parentElement.classList.remove('selected'));
        if (this.notesField) this.notesField.value = '';
        document.getElementById('eventName').value = CONFIG.EVENT.name;
    }
    
    renderMenu() {
        const menuList = document.querySelector('.menu-list');
        if (!menuList) return;

        menuList.innerHTML = '';
        const claimedRecipes = this.allRecipes.filter(r => r.claimed);

        claimedRecipes.forEach(r => {
            const item = this.renderDishCard(r);
            menuList.appendChild(item);
        });

        if (claimedRecipes.length === 0) {
            renderEmptyMenuMessage();
        }
    }

    renderDishCard(recipe) {
        const item = document.createElement('div');
        item.className = 'menu-item dish-card';

        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'menu-item-header';
        header.setAttribute('aria-expanded', 'false');

        const headerInfo = document.createElement('div');
        headerInfo.className = 'menu-header-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'recipe-name';
        nameDiv.textContent = getRecipeName(recipe);
        headerInfo.appendChild(nameDiv);

        let claimedBy = recipe.claimedBy || '';
        if (!claimedBy && recipe.claimedByDiscordId) {
            claimedBy = this.getMemberName(recipe.claimedByDiscordId) || recipe.claimedByDiscordId;
        }
        if (claimedBy) {
            const claimDiv = document.createElement('div');
            claimDiv.className = 'claimed-by';
            claimDiv.textContent = `Claimed by ${claimedBy}`;
            headerInfo.appendChild(claimDiv);
        }

        header.appendChild(headerInfo);

        // Page number is shown within expanded details only

        item.appendChild(header);

        const course = detectCourse(recipe);
        if (course) {
            item.classList.add(`dish-card--${course}`);
        }

        const diet = getVegStatus(recipe);
        if (diet) {
            item.classList.add('dish-card--veg');
            const flag = document.createElement('span');
            flag.className = 'veg-flag';
            flag.setAttribute('role', 'img');
            flag.setAttribute('aria-label', diet);
            flag.textContent = '🌱';
            item.appendChild(flag);
        }

        const details = buildRecipeDetails(recipe);
        details.classList.add('recipe-details');
        details.style.display = 'none';
        item.appendChild(details);

        header.addEventListener('click', () => {
            const expanded = item.classList.toggle('open');
            header.setAttribute('aria-expanded', expanded);
            details.style.display = expanded ? 'block' : 'none';
        });

        return item;
    }

    openRecipeModal() {
        if (!this.recipeModal) return;
        this.recipeModal.classList.add('open');
        this.recipeModal.setAttribute('aria-hidden', 'false');
        if (this.recipeSearch) {
            this.recipeSearch.value = this.cachedSearch;
        }
        this.renderRecipeModalList();
        if (this.recipeModalList) {
            this.recipeModalList.scrollTop = this.cachedScroll;
        }
    }

    closeRecipeModal() {
        if (!this.recipeModal) return;
        this.cachedSearch = this.recipeSearch ? this.recipeSearch.value : '';
        this.cachedScroll = this.recipeModalList ? this.recipeModalList.scrollTop : 0;
        this.recipeModal.classList.remove('open');
        this.recipeModal.setAttribute('aria-hidden', 'true');
    }

    renderRecipeModalList() {
        if (!this.recipeModalList) return;
        this.recipeModalList.innerHTML = '';
        const query = (this.recipeSearch ? this.recipeSearch.value : '').toLowerCase();
        const filtered = this.recipes.filter(r => getRecipeName(r).toLowerCase().includes(query));
        filtered.forEach(recipe => {
            const item = document.createElement('div');
            item.className = 'modal-recipe-item';
            item.textContent = getRecipeName(recipe);
            item.addEventListener('click', () => {
                this.recipeInput.value = getRecipeName(recipe);
                this.handleRecipeChange();
                this.closeRecipeModal();
                if (this.changeRecipeLink) this.changeRecipeLink.style.display = 'block';
            });
            this.recipeModalList.appendChild(item);
        });
    }

    getMemberName(discordId) {
        const m = this.members.find(mem => mem.discordId === discordId);
        return m ? m.displayName : '';
    }
}

// Initialize the form when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramCode = urlParams.get('g');
    let guestCode = null;
    if (paramCode) {
        const normalized = paramCode.toLowerCase();
        if (guestCodes.includes(normalized) || normalized === 'public') {
            guestCode = normalized;
        }
    }
    const memberForm = document.getElementById('member-form');
    const guestForm = document.getElementById('guest-form');
    const switchToGuestBtn = document.getElementById('switch-to-guest-btn');
    const audienceField = document.getElementById('audienceType');
    const audienceCodeField = document.getElementById('audienceCode');

    function showMemberUI() {
        if (memberForm) memberForm.style.display = 'block';
        if (guestForm) guestForm.style.display = 'none';
        if (audienceField) audienceField.value = 'member';
        if (audienceCodeField) audienceCodeField.value = '';
        localStorage.removeItem('audienceMode');
        localStorage.removeItem('audienceCode');
    }

    function showGuestUI(code = 'public') {
        if (memberForm) memberForm.style.display = 'none';
        if (guestForm) guestForm.style.display = 'block';
        if (audienceField) audienceField.value = 'guest';
        if (audienceCodeField) audienceCodeField.value = code;
        localStorage.setItem('audienceMode', 'guest');
        localStorage.setItem('audienceCode', code);
        console.log(`Showing Guest UI for code: ${code}`);
    }

    if (guestCode) {
        showGuestUI(guestCode);
    } else if (localStorage.getItem('audienceMode') === 'guest') {
        const storedCode = localStorage.getItem('audienceCode') || 'public';
        showGuestUI(storedCode);
    } else {
        showMemberUI();
    }

    if (switchToGuestBtn) {
        switchToGuestBtn.addEventListener('click', () => {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('g', 'public');
            window.location.href = newUrl.toString();
        });
    }

    new RecipeSignupForm();
    renderEmptyMenuMessage();
    // pull accent color from the displayed book cover
    setAccentFromImage('.cover-column img');
});

function renderEmptyMenuMessage() {
    const menuList = document.querySelector('.menu-list');
    if (menuList && menuList.children.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-menu-message';
        p.textContent = 'No dishes claimed yet. Be the first!';
        p.style.fontStyle = 'italic';
        p.style.color = '#888';
        p.style.textAlign = 'center';
        menuList.appendChild(p);
    }
}

function toggleIngredientText() {
    const text = document.getElementById('ingredient-text');
    const button = document.querySelector('.toggle-button');
    if (!text || !button) return;
    const expanded = text.classList.toggle('expanded');
    if (expanded) {
        text.classList.remove('collapsed');
    } else {
        text.classList.add('collapsed');
    }
    button.textContent = expanded ? 'Show less' : 'Show more';
    button.setAttribute('aria-expanded', expanded);
}

// Build a DOM node with full recipe details
function buildRecipeDetails(recipe) {
    const entry = document.createElement('div');
    entry.className = 'recipe-entry';

    // Title already displayed in the card header

    if (recipe.page) {
        const row = document.createElement('div');
        row.className = 'meta-row';

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = 'Page';
        row.appendChild(label);

        const pill = document.createElement('span');
        pill.className = 'page-pill';
        pill.textContent = recipe.page;
        row.appendChild(pill);

        entry.appendChild(row);
    }

    let categories = recipe.categories;
    if (Array.isArray(categories)) {
        categories = categories.flatMap(cat => String(cat).split(';'));
    } else if (typeof categories === 'string') {
        categories = categories.split(';');
    }
    categories = categories.map(c => String(c).trim()).filter(Boolean);
    if (categories.length) {
        const row = document.createElement('div');
        row.className = 'meta-row';

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = 'Categories';
        row.appendChild(label);

        const pillContainer = document.createElement('span');
        row.appendChild(pillContainer);
        renderCategoryPills(categories, pillContainer);

        entry.appendChild(row);
    }

    let ingredientsText = recipe.ingredients;
    if (Array.isArray(ingredientsText)) {
        ingredientsText = ingredientsText.join('; ');
    }
    if (ingredientsText) {
        const row = document.createElement('div');
        row.className = 'meta-row';

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = 'Ingredients';
        row.appendChild(label);

        const textSpan = document.createElement('span');
        textSpan.textContent = ingredientsText;
        row.appendChild(textSpan);

        entry.appendChild(row);
    }

    let accompanimentsText = recipe.accompaniments;
    if (Array.isArray(accompanimentsText)) {
        accompanimentsText = accompanimentsText.join('; ');
    }
    if (accompanimentsText) {
        const row = document.createElement('div');
        row.className = 'meta-row';

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = 'Accompaniments';
        row.appendChild(label);

        const textSpan = document.createElement('span');
        textSpan.textContent = accompanimentsText;
        row.appendChild(textSpan);

        entry.appendChild(row);
    }

    if (recipe.note) {
        const row = document.createElement('div');
        row.className = 'meta-row';

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = 'Note';
        row.appendChild(label);

        const textSpan = document.createElement('span');
        textSpan.textContent = recipe.note;
        row.appendChild(textSpan);

        entry.appendChild(row);
    }

    return entry;
}

