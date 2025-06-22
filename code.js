/**
 * CLEAN BACKEND SOLUTION: Handle JSON body without CORS issues
 * This works with the frontend that sends JSON without Content-Type header
 */

// Your existing configuration and column mappings stay the same
const CONFIG = {
  SPREADSHEET_ID: '1ycT-jM3Glz7naJ7DY66pCRlXIiHBv6UpZ0dlSfyH_gg',
  SHEETS: {
    USERS: 'Users',
    EVENTS: 'Events',
    RECIPES: 'Recipes',
    RSVPS: 'RSVPs',
    RECIPE_CLAIMS: 'Claims'
  },
  CURRENT_EVENT_ID: 'EVT_2025_07',

  get DISCORD_WEBHOOK_URL() {
    const scriptProperties = PropertiesService.getScriptProperties();
    return scriptProperties.getProperty('DISCORD_WEBHOOK_URL');
  }
};

const COLUMNS = {
  USERS: {                 // sheet “Users”
    USER_ID:           0,
    USER_TYPE:         1,
    DISPLAY_NAME:      2,
    DISCORD_ID:        3,
    INSTAGRAM_HANDLE:  4,
    EMAIL:             5,
    STATUS:            6,
    JOINED_DATE:       7,
    NOTES:             8
  },

  EVENTS: {                // sheet “Events”
    EVENT_ID:          0,
    EVENT_NAME:        1,
    EVENT_DATE:        2,
    COOKBOOK_TITLE:    3,
    BOOK_PICKER_ID:    4,
    STATUS:            5,
    MAX_ATTENDEES:     6,
    RSVP_DEADLINE:     7,
    LOCATION:          8,
    NOTES:             9
  },

  RECIPES: {               // sheet “Recipes”
    RECIPE_ID:         0,
    COOKBOOK_TITLE:    1,
    RECIPE_NAME:       2,
    PAGE_NUMBER:       3,
    CATEGORY:          4,
    INGREDIENTS:       5,
    ACCOMPANIMENTS:    6,
    DIETARY_TAGS:      7,
    NOTES:             8,
    RECORD_URL:        9
  },

  RSVPS: {                 // sheet “RSVPs”
    RSVP_ID:            0,
    EVENT_ID:           1,
    USER_ID:            2,
    RESPONSE_TYPE:      3,
    GUEST_COUNT:        4,
    DIETARY_RESTRICTIONS:5,
    SUBMITTED_AT:       6,
    STATUS:             7,
    NOTES:              8
    // columns 9-11 are blank/unused
  },

  CLAIMS: {                // sheet “Claims”
    CLAIM_ID:          0,
    EVENT_ID:          1,
    RECIPE_ID:         2,
    USER_ID:           3,
    CLAIMED_AT:        4,
    STATUS:            5,
    MODIFICATIONS:     6,
    NOTES:             7
  }
};

function debugSheetNames() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheets = spreadsheet.getSheets();
  console.log('Available sheets:');
  sheets.forEach(sheet => {
    console.log('- ' + sheet.getName());
  });
}

/**
 * UPDATED: Handle POST requests with proper member/guest flow
 */
function doPost(e) {
  try {
    const instagramHandleFromParams = e.parameter?.instagramHandle || '';

    // Parse the JSON body directly
    const formData = JSON.parse(e.postData.contents || '{}');

    if (instagramHandleFromParams) {
      formData.instagramHandle = instagramHandleFromParams.trim();
    }
    console.log('📥 Received form data:', formData);
    
    // Validate the submission (now handles both members and guests)
    const validation = validateSubmission(formData);
    if (!validation.valid) {
      return createResponse(false, validation.error);
    }
    
    // Check for duplicate recipe claim (only for cooking submissions)
    if (formData.cooking && formData.recipeId) {
      const isDuplicate = checkDuplicateRecipe(formData.recipeId);
      if (isDuplicate) {
        return createResponse(false, 'This recipe has already been claimed. Please choose another one.');
      }
      
      // Mark recipe as claimed. Store the Discord ID for members or the
      // guest's name directly if no Discord ID was provided.
      markRecipeAsClaimed(
        formData.recipeId,
        formData.discordId || formData.displayName
      );
    }
    
    // ─── NEW: light validation for Instagram handle ───
    if (formData.instagramHandle && !isValidInstagramHandle(formData.instagramHandle)) {
      return createResponse(
        false,
        'Invalid Instagram handle format. Please ensure it starts with @ and contains only letters, numbers, periods, or underscores, and is 2–30 characters long.'
      );
    }

    // Record the RSVP
    recordRSVP(formData);
    
    // Send appropriate notifications based on audience type
    if (formData.audienceType === 'member') {
      // Send Discord notification for members
      if (CONFIG.DISCORD_WEBHOOK_URL) {
        sendDiscordNotification(formData);
      }
    } else if (formData.audienceType === 'guest') {
      // Send email confirmation for guests
      sendGuestEmail(formData);
      
      // Also send Discord notification about guest RSVP
      if (CONFIG.DISCORD_WEBHOOK_URL) {
        sendDiscordNotification(formData);
      }
    }
    
    return createResponse(true, 'RSVP submitted successfully');
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Handle GET requests (unchanged)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getData') {
      return getFormData();
    }
    
    return createResponse(false, 'Unknown action');
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Create standardized response
 */
function createResponse(success, message, data = null) {
  const response = { success, message };
  if (data) response.data = data;
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * UPDATED: Record RSVP with proper guest/member handling
 */
function recordRSVP(formData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const rsvpsSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RSVPS);
    
    const id = Date.now();
    
    const discordId = formData.audienceType === 'member'
      ? (formData.discordId || '')
      : '';
    const instagram = formData.audienceType === 'guest'
      ? (formData.instagramHandle || '')
      : '';

    const newRow = [
      id,                                           // A: Claim ID
      formData.cooking ? 'Cook' : 'Guest',          // B: RSVP Type
      formData.recipeName || '',                    // C: Recipe
      formData.cooking ? formData.recipeId : '',    // D: RecipeID
      formData.displayName,                         // E: Member Name
      discordId,                                    // F: Discord ID
      instagram,                                    // G: Instagram Handle
      formData.audienceType === 'member' ? 'yes' : 'no', // H: Is Discord
      new Date(),                                   // I: Timestamp
      formData.eventName || CONFIG.EVENT_NAME,      // J: Event
      formData.eventDate || CONFIG.EVENT_DATE,      // K: Event Date
      formData.note || ''                           // L: Notes
    ];
    
    rsvpsSheet.appendRow(newRow);
  } catch (error) {
    console.error('Error recording RSVP:', error);
    throw error;
  }
}








/**
 * Get form data (members and available recipes) with enhanced descriptions
 */

/**
 * Read a sheet and return an array of objects where keys come from the
 * header row. Useful for generic sheet parsing when column positions may
 * change.
 */
function parseSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.error('Sheet not found:', sheetName);
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[i][idx];
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Convert an array of objects into a map keyed by an "id" column if present.
 */
function mapById(arr) {
  const map = {};
  arr.forEach(obj => {
    const id = obj.id || obj.ID || obj.Id;
    if (id !== undefined && id !== '') {
      map[id] = obj;
    }
  });
  return map;
}

function getFormData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    // ─── Read five sheets generically ──────────────────────────────
    const users   = parseSheet(spreadsheet, CONFIG.SHEETS.USERS);
    const events  = parseSheet(spreadsheet, CONFIG.SHEETS.EVENTS);
    const recipes = parseSheet(spreadsheet, CONFIG.SHEETS.RECIPES);
    const rsvps   = parseSheet(spreadsheet, CONFIG.SHEETS.RSVPS);
    const claims  = parseSheet(spreadsheet, CONFIG.SHEETS.RECIPE_CLAIMS);

    // ─── Normalize each set by ID for easier lookups ───────────────
    const data = {
      users:   mapById(users),
      events:  mapById(events),
      recipes: mapById(recipes),
      rsvps:   mapById(rsvps),
      claims:  mapById(claims)
    };

    // ─── Basic relationship linking (best-effort) ──────────────────
    Object.values(data.rsvps).forEach(r => {
      const uId = r.userId || r.DISCORD_ID;
      const eId = r.eventId || r.EVENT;
      const rcId = r.recipeId || r.RECIPE_ID;
      if (uId && data.users[uId]) r.user = data.users[uId];
      if (eId && data.events[eId]) r.event = data.events[eId];
      if (rcId && data.recipes[rcId]) r.recipe = data.recipes[rcId];
    });

    Object.values(data.claims).forEach(c => {
      const uId = c.userId || c.DISCORD_ID;
      const eId = c.eventId || c.EVENT;
      const rcId = c.recipeId || c.RECIPE_ID;
      if (uId && data.users[uId]) c.user = data.users[uId];
      if (eId && data.events[eId]) c.event = data.events[eId];
      if (rcId && data.recipes[rcId]) c.recipe = data.recipes[rcId];
    });

    return createResponse(true, 'Data retrieved successfully', data);

    
  } catch (error) {
    console.error('Error getting form data:', error);
    return createResponse(false, 'Failed to load data: ' + error.message);
  }
}
