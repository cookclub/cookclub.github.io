// Configuration for the Recipe Sign-Up System
const CONFIG = {
    // Google Sheets Configuration
    SPREADSHEET_ID: '1ycT-jM3Glz7naJ7DY66pCRlXIiHBv6UpZ0dlSfyH_gg',
    
    // Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzwJyBZxKmowav0SOHl7tzcSEJ5XlbU2NFYkXaz5lI6bN5zySqi4wzTOmTg5lirSnl5/exec',
    
    // Sheet names
    SHEETS: {
        MEMBERS: 'Members',
        RECIPES: 'Recipes', 
        RSVPS: 'RSVPs'
    },
    
    // API endpoints for reading data (using Google Sheets public API)
    API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',
    
    // Sample data for testing (will be replaced with real Google Sheets data)
    SAMPLE_MEMBERS: [
        { discordId: '123456789012345678', displayName: 'AliceChef', active: true },
        { discordId: '234567890123456789', displayName: 'BobCooks', active: true },
        { discordId: '345678901234567890', displayName: 'CarolKitchen', active: true },
        { discordId: '456789012345678901', displayName: 'DavidBakes', active: true },
        { discordId: '567890123456789012', displayName: 'EmmaEats', active: true }
    ],
    
    SAMPLE_RECIPES: [
        {
            id: 1,
            name: 'Caesar Salad',
            description: 'Fresh romaine lettuce with homemade dressing',
            page: 63,
            categories: ['Salad'],
            ingredients: 'romaine lettuce; croutons; parmesan; Caesar dressing',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        },
        {
            id: 2,
            name: 'Garlic Bread',
            description: 'Crispy bread with garlic butter',
            page: 72,
            categories: ['Side'],
            ingredients: 'baguette; garlic; butter; parsley',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        },
        {
            id: 3,
            name: 'Chocolate Brownies',
            description: 'Rich and fudgy brownies',
            page: 105,
            categories: ['Dessert'],
            ingredients: 'chocolate; flour; sugar; eggs; butter',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        },
        {
            id: 4,
            name: 'Vegetable Stir Fry',
            description: 'Mixed vegetables with soy sauce',
            page: 88,
            categories: ['Main course'],
            ingredients: 'assorted vegetables; soy sauce; sesame oil',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        },
        {
            id: 5,
            name: 'Fruit Salad',
            description: 'Fresh seasonal fruits',
            page: 12,
            categories: ['Dessert'],
            ingredients: 'mixed fresh fruit',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        },
        {
            id: 6,
            name: 'Pasta Primavera',
            description: 'Pasta with fresh vegetables',
            page: 144,
            categories: ['Main course'],
            ingredients: 'pasta; seasonal vegetables; olive oil; parmesan',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        },
        {
            id: 7,
            name: 'Chicken Wings',
            description: 'Spicy buffalo wings',
            page: 175,
            categories: ['Appetizer'],
            ingredients: 'chicken wings; hot sauce; butter',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        },
        {
            id: 8,
            name: 'Cheese Platter',
            description: 'Assorted cheeses and crackers',
            page: 5,
            categories: ['Appetizer'],
            ingredients: 'assorted cheese; crackers; fruit',
            claimed: false,
            claimedByDiscordId: '',
            claimedAt: ''
        }
    ],
    
    // Event configuration
    EVENT: {
        name: 'That Sounds So Good: 100 Real-Life Recipes for Every Day of the Week',
        date: '2025-06-21'
    },
    
    // UI Messages
    MESSAGES: {
        SUCCESS: 'Your RSVP has been submitted successfully! 🎉',
        ERROR: 'There was an error submitting your RSVP. Please try again.',
        DUPLICATE: 'This recipe has already been claimed. Please choose another one.',
        LOADING: 'Loading available recipes...',
        NO_RECIPES: 'No recipes available at the moment.',
        FORM_INCOMPLETE: 'Please fill in all required fields.'
    }
};

