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
    appetizer: ['Appetizer'],
    main: ['Main course', 'Stews & one-pot meals', 'Grills & BBQ', 'Rice dishes', 'Pasta, doughs & sauces'],
    side: ['Side dish', 'Salads', 'Sauces, general', 'Dressings & marinades'],
    dessert: ['Dessert'],
    drink: ['Beverages / drinks (no-alcohol)']
};

const COURSE_ORDER = ['appetizer', 'main', 'side', 'dessert', 'drink'];
const COURSE_DISPLAY_NAMES = {
    appetizer: 'Appetizers',
    main: 'Main Courses',
    side: 'Side Dishes',
    dessert: 'Desserts',
    drink: 'Drinks'
};

const COURSE_KEYWORDS = {
    dessert: ['cake', 'pie', 'cookie', 'pudding', 'tart', 'brownie'],
    appetizer: ['dip', 'starter', 'appetizer'],
    main: ['roast', 'steak', 'pasta', 'curry', 'lasagna', 'stew'],
    side: ['salad', 'slaw', 'soup', 'dip', 'side'],
    drink: ['drink', 'beverage', 'juice', 'mocktail', 'smoothie']
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

// -------------------------------------------------------------
// Recipe ID generation & lookup utilities
// -------------------------------------------------------------

/**
 * Convert a string to a URL-safe slug.
 * Lowercases, replaces non-alphanumerics with hyphens and trims extras.
 */
function slugify(text) {
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Build a unique, URL-safe identifier for a recipe.
 * Combines page number and slugified name.
 */
function generateRecipeId(recipe) {
    const page = recipe.page ? String(recipe.page) : '0';
    const slug = slugify(getRecipeName(recipe));
    return `${page}-${slug}`;
}

/**
 * Lookup a recipe object from a generated ID.
 * Falls back to matching only on the page number if needed.
 */
function findRecipeById(recipeId) {
    if (!recipeId) return null;
    const form = window.recipeSignupForm;
    if (!form || !Array.isArray(form.allRecipes)) return null;
    const exact = form.allRecipes.find(r => generateRecipeId(r) === recipeId);
    if (exact) return exact;

    const page = parseInt(recipeId.split('-')[0], 10);
    if (isNaN(page)) return null;
    return form.allRecipes.find(r => parseInt(r.page, 10) === page) || null;
}

/** Update the hash portion of the URL for routing. */
let pendingNavSource = null;

function updateURL(recipeId, source = 'url') {
    pendingNavSource = source;
    if (recipeId) {
        window.location.hash = `#/recipe/${recipeId}`;
    } else {
        window.location.hash = '#/';
    }
}

function shouldShowModal(source) {
    return source === 'url';
}

/** Parse the current hash and extract the recipe ID, if any. */
function parseCurrentURL() {
    const hash = window.location.hash || '';
    const match = hash.match(/^#\/recipe\/(.+)$/);
    if (match) {
        return { type: 'recipe', id: match[1] };
    }
    return { type: 'home' };
}

/** Close all open recipe cards. */
function closeAllRecipeCards() {
    document.querySelectorAll('.dish-card.open').forEach(card => {
        card.classList.remove('open');
        const header = card.querySelector('.menu-item-header');
        const details = card.querySelector('.recipe-details');
        if (header) header.setAttribute('aria-expanded', 'false');
        if (details) details.style.display = 'none';
    });
}

let lastFocusedElement = null;

function openRecipeDetailModal(recipeId) {
    const modal = document.getElementById('recipeDetailModal');
    const content = document.getElementById('recipeDetailContent');
    const shareBtn = document.getElementById('shareRecipe');
    if (!modal || !content) return;
    const recipe = findRecipeById(recipeId);
    if (!recipe) return;

    content.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = getRecipeName(recipe);
    content.appendChild(title);

    const meta = buildRecipeDetails(recipe);
    meta.style.marginTop = '16px';
    content.appendChild(meta);

    const claimDiv = document.createElement('div');
    claimDiv.className = 'claim-status';
    if (recipe.claimed) {
        // Prefer the normalized claimerName field but fall back to older
        // "claimedBy" property if present.
        let claimedBy = recipe.claimerName || recipe.claimedBy || '';
        if (!claimedBy && recipe.claimedByDiscordId) {
            const form = window.recipeSignupForm;
            claimedBy = form ? form.getMemberName(recipe.claimedByDiscordId) || recipe.claimedByDiscordId : recipe.claimedByDiscordId;
        }
        claimDiv.textContent = `from ${claimedBy}`;
        if (!recipe.claimedByDiscordId) {
            claimDiv.classList.add('guest');
        }
    } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'share-btn';
        btn.textContent = 'Claim this recipe';
        btn.addEventListener('click', () => {
            const form = window.recipeSignupForm;
            if (form) {
                form.recipeInput.value = getRecipeName(recipe);
                form.handleRecipeChange();
            }
            closeRecipeDetailModal();
            if (form && form.recipeInput) form.recipeInput.focus();
        });
        claimDiv.appendChild(btn);
    }
    claimDiv.style.marginTop = '16px';
    content.appendChild(claimDiv);

    if (shareBtn) {
        shareBtn.textContent = 'Share';
        shareBtn.onclick = () => {
            const url = `${window.location.origin}${window.location.pathname}#/recipe/${recipeId}`;
            navigator.clipboard.writeText(url).then(() => {
                shareBtn.textContent = 'Copied!';
                setTimeout(() => { shareBtn.textContent = 'Share'; }, 2000);
            });
        };
    }

    lastFocusedElement = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const card = modal.querySelector('.recipe-detail-card');
    if (card) {
        card.focus();
        trapFocus(modal);
    }
}

function closeRecipeDetailModal() {
    const modal = document.getElementById('recipeDetailModal');
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement) lastFocusedElement.focus();
    updateURL('', 'modal');
}

/** Expand the card corresponding to the given recipe ID. */
function openRecipeCard(recipeId) {
    const card = document.querySelector(`.menu-item[data-recipe-id="${recipeId}"]`);
    if (!card) return;
    closeAllRecipeCards();
    const header = card.querySelector('.menu-item-header');
    const details = card.querySelector('.recipe-details');
    card.classList.add('open');
    if (header) header.setAttribute('aria-expanded', 'true');
    if (details) details.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Respond to hash changes by opening the appropriate card. */
function handleRouteChange() {
    const source = pendingNavSource || 'url';
    const route = parseCurrentURL();
    if (route.type === 'recipe') {
        if (shouldShowModal(source)) {
            openRecipeDetailModal(route.id);
        } else {
            openRecipeCard(route.id);
        }
    } else {
        if (shouldShowModal(source)) {
            closeRecipeDetailModal();
        } else {
            closeAllRecipeCards();
        }
    }
    pendingNavSource = null;
}

class RecipeSignupForm {
    constructor() {
        this.members = [];
        this.recipes = [];
        this.allRecipes = [];
        this.isLoading = false;

        // expose for routing helpers
        window.recipeSignupForm = this;

        this.initializeForm();
        this.loadData();
    }

    initializeForm() {
        // Get form elements
        this.form = document.getElementById('recipeForm');
        this.nameSelectGroup = document.getElementById('nameSelectGroup');
        this.nameInputGroup  = document.getElementById('nameInputGroup');
        this.nameSelect  = document.getElementById('nameSelect');
        this.nameInput   = document.getElementById('nameInput');
        this.backToList  = document.getElementById('backToList');
        // Instagram handle field shown when a guest enters their name
        this.instagramGroup = document.getElementById('instagramGroup');
        this.instagramInput = document.getElementById('instagramHandle');
        this.nameLabel = document.getElementById('nameLabel');
        this.nameHelp  = document.getElementById('nameHelp');
        this.audienceType = 'member';
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
        this.nameSelect.addEventListener('change', () => this.handleNameChange());
        this.nameInput.addEventListener('input', () => this.validateForm());
        if (this.backToList) {
            this.backToList.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNameSelect();
            });
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('audience') === 'instagram') {
            this.showInstagramSignup();
        } else {
            this.showNameSelect();
        }
        
        // Set event name
        document.getElementById('eventName').value = CONFIG.EVENT.name;
        
        // Set event date
        document.getElementById('eventDate').value = CONFIG.EVENT.date;
    }

    normalizeRecipeData(recipes, members) {
        const memberMap = new Map(members.map(m => [m.discordId, m.displayName]));

        return recipes.map(r => {
            const recipe = { ...r, id: parseInt(r.id, 10) };

            // STREAMLINED ATTRIBUTION: Create single claimer object
            recipe.claimer = this.createClaimerObject(r, memberMap);

            // Keep legacy fields for backward compatibility during transition
            recipe.claimerName = recipe.claimer.name;
            recipe.claimedByDiscordId = recipe.claimer.type === 'member' ? recipe.claimer.id : '';
            recipe.claimedByInstagramId = recipe.claimer.type === 'instagram' ? recipe.claimer.id : '';

            recipe.urlId = generateRecipeId(recipe);
            return recipe;
        });
    }

    createClaimerObject(recipe, memberMap) {
        if (!recipe.claimed) {
            return { name: '', type: 'none', id: '' };
        }

        if (recipe.claimerName) {
            if (recipe.claimedByDiscordId) {
                return { name: recipe.claimerName, type: 'member', id: recipe.claimedByDiscordId };
            } else if (recipe.claimedByInstagramId) {
                return { name: recipe.claimerName, type: 'instagram', id: recipe.claimedByInstagramId };
            }
            return { name: recipe.claimerName, type: 'guest', id: '' };
        }

        if (recipe.claimedByDiscordId) {
            const memberName = memberMap.get(recipe.claimedByDiscordId);
            return { name: memberName || recipe.claimedByDiscordId, type: 'member', id: recipe.claimedByDiscordId };
        }

        if (recipe.claimedByInstagramId) {
            const handle = recipe.claimedByInstagramId.startsWith('@')
                ? recipe.claimedByInstagramId
                : `@${recipe.claimedByInstagramId}`;
            return { name: handle, type: 'instagram', id: recipe.claimedByInstagramId };
        }

        if (recipe.claimedBy) {
            return { name: recipe.claimedBy, type: 'guest', id: '' };
        }

        if (recipe.memberName) {
            return { name: recipe.memberName, type: 'guest', id: '' };
        }

        return { name: 'Unknown', type: 'unknown', id: '' };
    }
    
    async loadData() {
        // Display the blocking overlay while we fetch recipes
        showLoadingOverlay();
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
        } finally {
            // Overlay goes away once all dropdowns are ready
            hideLoadingOverlay();
            this.validateForm();
        }
    }
    
    async loadSampleData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const activeMembers = CONFIG.SAMPLE_MEMBERS.filter(member => member.active);
        this.members = activeMembers;
        this.allRecipes = this.normalizeRecipeData(CONFIG.SAMPLE_RECIPES, activeMembers);
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

            // UPDATED: Use new normalization method
            this.allRecipes = this.normalizeRecipeData(recipes, activeMembers);
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
        if (!this.nameSelect) return;
        this.nameSelect.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select your name…';
        placeholder.disabled = true;
        placeholder.selected = true;
        this.nameSelect.appendChild(placeholder);

        this.nameSelect.appendChild(placeholder);
        
        const newOpt = document.createElement('option');
        newOpt.value = 'new';
        newOpt.textContent = "I'm new / type my name";
        this.nameSelect.appendChild(newOpt);
        
        this.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.discordId;
            option.textContent = member.displayName;
            this.nameSelect.appendChild(option);
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

    handleNameChange() {
        if (this.nameSelect.value === 'new') {
            this.showNameInput();
        } else {
            this.audienceType = 'member';
            if (this.instagramGroup) {
                this.instagramGroup.style.display = 'none';
                this.instagramInput.value = '';
            }
            this.validateForm();
        }
    }

    showNameInput() {
        this.audienceType = 'guest';
        if (this.nameSelectGroup) this.nameSelectGroup.style.display = 'none';
        if (this.nameInputGroup) this.nameInputGroup.style.display = 'block';
        if (this.instagramGroup) {
            this.instagramGroup.style.display = 'block';
            this.instagramInput.required = false;
        }
        if (this.nameHelp) this.nameHelp.style.display = 'none';
        if (this.nameLabel) this.nameLabel.textContent = 'Your Name *';
        const igLabel = document.getElementById('instagramLabel');
        if (igLabel) igLabel.textContent = 'Instagram handle (optional)';
        this.nameSelect.value = '';
        this.validateForm();
    }

    showInstagramSignup() {
        this.audienceType = 'instagram';
        if (this.nameSelectGroup) this.nameSelectGroup.style.display = 'none';
        if (this.nameInputGroup) this.nameInputGroup.style.display = 'block';
        if (this.instagramGroup) {
            this.instagramGroup.style.display = 'block';
            this.instagramInput.required = true;
        }
        if (this.nameHelp) this.nameHelp.style.display = 'block';
        if (this.nameLabel) this.nameLabel.textContent = 'Name (optional)';
        const igLabel = document.getElementById('instagramLabel');
        if (igLabel) igLabel.textContent = 'Instagram handle (required \u2013 used privately, never shown)';
        this.nameSelect.value = '';
        this.validateForm();
    }

    showNameSelect() {
        this.audienceType = 'member';
        if (this.nameSelectGroup) this.nameSelectGroup.style.display = 'block';
        if (this.nameInputGroup) this.nameInputGroup.style.display = 'none';
        if (this.instagramGroup) {
            this.instagramGroup.style.display = 'none';
            this.instagramInput.value = '';
            this.instagramInput.required = false;
        }
        this.nameInput.value = '';
        if (this.nameHelp) this.nameHelp.style.display = 'none';
        if (this.nameLabel) this.nameLabel.textContent = 'Your Name *';
        const igLabel2 = document.getElementById('instagramLabel');
        if (igLabel2) igLabel2.textContent = 'Instagram handle (optional)';
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
        let nameValid = false;

        if (this.audienceType === 'member') {
            nameValid = this.nameSelect.value && this.nameSelect.value !== 'new';
        } else if (this.audienceType === 'instagram') {
            nameValid = true; // optional name
        } else {
            nameValid = this.nameInput.value.trim() !== '';
        }

        const cookingValue = this.getCookingValue();
        const cookingSelected = cookingValue !== '';
        const recipeSelected = cookingValue === 'no' || this.recipes.some(r => getRecipeName(r) === this.recipeInput.value);

        let handleValid = true;
        if (this.audienceType === 'instagram') {
            handleValid = this.instagramInput.value.trim() !== '';
        }

        const isValid = nameValid && cookingSelected && recipeSelected && handleValid;
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
        const member      = this.members.find(m => m.discordId === this.nameSelect.value);
        const cookingFlag = this.getCookingValue() === 'yes';
        const recipeInput = this.recipeInput.value.trim();

        const selectedRecipe = cookingFlag
            ? this.recipes.find(r => getRecipeName(r) === recipeInput)
            : null;

        const note      = this.notesField.value.trim();
        const recordUrl = selectedRecipe ? (selectedRecipe.recordUrl || '') : '';

        const data = {
            eventName   : document.getElementById('eventName').value,
            eventDate   : document.getElementById('eventDate').value,
            audienceType: this.audienceType,
            displayName : this.audienceType === 'member' && member ? member.displayName : this.nameInput.value.trim(),
            cooking     : cookingFlag,
            recipeId    : selectedRecipe ? Number(selectedRecipe.id) : null,
            recipeName  : selectedRecipe ? getRecipeName(selectedRecipe) : '',
            recordUrl,
            note,
            timestamp   : new Date().toISOString()
        };

        // Only include the discordId for members to avoid server-side validation errors
        if (this.audienceType === 'member' && member) {
            data.discordId = member.discordId;
        }

        // FIXED: Properly handle Instagram handle for guests and instagram audience
        if ((this.audienceType === 'guest' || this.audienceType === 'instagram') && this.instagramInput.value.trim()) {
            let handle = this.instagramInput.value.trim();
            if (!handle.startsWith('@')) {
                handle = `@${handle}`;
            }
            data.instagramHandle = handle;
        }

        return data;
    }

    getClaimerDisplay(recipe) {
        if (!recipe.claimer) {
            return 'Unknown';
        }

        const { name, type } = recipe.claimer;

        if (!name) {
            // When a recipe is claimed by a guest but their name wasn't
            // recorded properly, fall back to the generic "Guest" label so
            // the menu still shows who is bringing the dish.
            if (recipe.claimed && type === 'guest') {
                return 'Guest';
            }
            return 'Unknown';
        }

        switch (type) {
            case 'member':
                return name;
            case 'instagram':
                return name.startsWith('@') ? name : `@${name}`;
            case 'guest':
                return name;
            default:
                return 'Unknown';
        }
    }

    // async submitToGoogleSheets(formData) {
    //     if (!CONFIG.SCRIPT_URL) {
    //         throw new Error('Google Apps Script URL not configured');
    //     }

    //     console.log('📡 Submitting to Google Apps Script...');

    //     // Send the form data as JSON so the server can parse it directly
    //     const response = await fetch(CONFIG.SCRIPT_URL, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(formData)
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

    async submitToGoogleSheets(formData) {
        if (!CONFIG.SCRIPT_URL) {
            throw new Error('Google Apps Script URL not configured');
        }
    
        console.log('📡 Submitting to Google Apps Script...');
    
        // Send JSON body WITHOUT Content-Type header
        // This avoids CORS preflight while keeping clean JSON format
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData)  // Pure JSON, no headers
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
        const params = new URLSearchParams(window.location.search);
        if (params.get('audience') === 'instagram') {
            this.showInstagramSignup();
        } else {
            this.showNameSelect();
        }
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
        updateDishCount(claimedRecipes.length);

        const groups = {};
        claimedRecipes.forEach(r => {
            const key = detectCourse(r) || 'other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        COURSE_ORDER.forEach(course => {
            const items = groups[course];
            if (!items || items.length === 0) return;
            const section = document.createElement('div');
            section.className = 'course-section';

            const heading = document.createElement('h3');
            heading.className = 'course-heading';
            heading.textContent = COURSE_DISPLAY_NAMES[course] || course;
            section.appendChild(heading);

            items.forEach(recipe => {
                const item = this.renderDishCard(recipe);
                section.appendChild(item);
            });

            menuList.appendChild(section);
        });

        if (claimedRecipes.length === 0) {
            renderEmptyMenuMessage();
        }

        // open any recipe referenced in the URL
        handleRouteChange();
    }

    renderDishCard(recipe) {
        const item = document.createElement('div');
        item.className = 'menu-item dish-card';
        const recipeId = recipe.urlId || generateRecipeId(recipe);
        item.dataset.recipeId = recipeId;

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

        // SIMPLIFIED: Use new claimer display logic
        const claimedBy = this.getClaimerDisplay(recipe);
        if (claimedBy && claimedBy !== 'Unknown') {
            const claimDiv = document.createElement('div');
            claimDiv.className = 'claimed-by';
            
            // Add guest styling for non-members
            if (recipe.claimer.type !== 'member') {
                claimDiv.classList.add('guest');
            }
            
            claimDiv.textContent = `from ${claimedBy}`;
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
            const current = parseCurrentURL();
            if (current.type === 'recipe' && current.id === recipeId) {
                updateURL('', 'card');
            } else {
                updateURL(recipeId, 'card');
            }
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
    new RecipeSignupForm();
    renderEmptyMenuMessage();
    updateDishCount(0);
    // respond to initial hash route after menu renders
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
    // pull accent color from the displayed book cover
    setAccentFromImage('.cover-column img');

    const detailModal = document.getElementById('recipeDetailModal');
    const detailClose = document.getElementById('detailClose');
    if (detailClose) detailClose.addEventListener('click', () => closeRecipeDetailModal());
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) closeRecipeDetailModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRecipeDetailModal();
        }
    });
});

function updateDishCount(count) {
    const el = document.getElementById('dishCount');
    if (el) {
        el.textContent = `${count} Dish${count === 1 ? '' : 'es'} Confirmed!`;
    }
}

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

function trapFocus(modal) {
    const focusableSelectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(modal.querySelectorAll(focusableSelectors));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        } else if (e.key === 'Escape') {
            closeRecipeDetailModal();
        }
    });
}

// -------------------------------------------------------------
// Loading Overlay helpers
// -------------------------------------------------------------

/** Disable or enable all form controls during data fetch */
function toggleFormDisabled(disabled) {
    const form = document.getElementById('recipeForm');
    if (!form) return;
    const elements = form.querySelectorAll('input, button, textarea, select');
    elements.forEach(el => {
        el.disabled = disabled;
    });
}

/** Show the full-page loading overlay */
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
    toggleFormDisabled(true);
}

/** Hide the loading overlay and re-enable the form */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
    toggleFormDisabled(false);
}

