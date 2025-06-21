/**
 * CLEAN BACKEND SOLUTION: Handle JSON body without CORS issues
 * This works with the frontend that sends JSON without Content-Type header
 */

// Your existing configuration and column mappings stay the same
const CONFIG = {
  SPREADSHEET_ID: '1ycT-jM3Glz7naJ7DY66pCRlXIiHBv6UpZ0dlSfyH_gg',
  SHEETS: {
    MEMBERS: 'Members',
    RECIPES: 'Recipes',
    RSVPS: 'RSVPs'
  },
  EVENT_NAME: 'That Sounds So Good: 100 Real-Life Recipes for Every Day of the Week',
  EVENT_DATE: '2025-06-21',

  get DISCORD_WEBHOOK_URL() {
    const scriptProperties = PropertiesService.getScriptProperties();
    return scriptProperties.getProperty('DISCORD_WEBHOOK_URL');
  }
};

// Your existing COLUMNS mapping stays the same
const COLUMNS = {
  MEMBERS: {
    MEMBER_NAME: 0,
    DISCORD_ID: 1,
    STATUS: 2
  },
  RECIPES: {
    ID: 0,
    RECIPE_TITLE: 1,
    PAGE: 2,
    BOOK: 3,
    AUTHOR: 4,
    CATEGORIES: 5,
    INGREDIENTS: 6,
    ACCOMPANIMENTS: 7,
    TIMESTAMP: 8,
    CLAIMED: 9,
    CLAIMED_BY: 10,
    RECORD_URL: 11
  },
  RSVPS: {
    CLAIM_ID: 0,
    RSVP_TYPE: 1,
    RECIPE: 2,
    RECIPE_ID: 3,
    MEMBER_NAME: 4,
    DISCORD_ID: 5,
    INSTAGRAM_ID: 6,
    IS_DISCORD: 7,
    TIMESTAMP: 8,
    EVENT: 9,
    EVENT_DATE: 10,
    NOTES: 11
  }
};


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
 * Light-weight Instagram handle validator
 *  • must start with “@”
 *  • only letters, numbers, “.” or “_”
 *  • 2–30 chars **after** the “@”
 */
function isValidInstagramHandle(handle) {
  const regex = /^@[A-Za-z0-9._]{2,30}$/;
  return regex.test(handle);
}


/**
 * FINAL: Validate submission for members, guests, and Instagram handle
 *        (no email field required or examined)
 */
function validateSubmission(formData) {

  /* ── Common checks ───────────────────────────── */
  if (!formData.displayName) {
    return { valid: false, error: 'Display name is required' };
  }

  if (formData.cooking === undefined) {
    return { valid: false, error: 'Cooking preference is required' };
  }

  if (formData.cooking && !formData.recipeId) {
    return { valid: false, error: 'Recipe selection is required when cooking' };
  }

  /* ── Audience-specific checks ─────────────────── */
  if (formData.audienceType === 'member') {

    if (!formData.discordId) {
      return { valid: false, error: 'Discord ID is required for members' };
    }

    if (!verifyMember(formData.discordId)) {
      return { valid: false, error: 'Invalid member – Discord ID not found in member list' };
    }

  } else if (formData.audienceType === 'guest') {

    // Guests have no extra mandatory fields now.
    // (Add guest-specific checks here later if needed.)

  } else {
    return { valid: false, error: 'Invalid audience type – must be "member" or "guest"' };
  }

  /* ── Optional Instagram handle check ─────────── */
  if (formData.instagramHandle && !isValidInstagramHandle(formData.instagramHandle)) {
    return {
      valid: false,
      error: 'Invalid Instagram handle format. Please ensure it starts with @ and contains only letters, numbers, periods, or underscores, 2–30 characters long.'
    };
  }

  return { valid: true };
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


function getEmojiForCategory(category) {
  switch (category?.toLowerCase()) {
    case 'main':    return '🍽️';
    case 'side':    return '🥗';
    case 'dessert': return '🍰';
    case 'drink':   return '🍹';
    default:        return '🍴'; // fallback
  }
}

function sendDiscordNotification(formData) {
  if (!CONFIG.DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook not configured, skipping notification');
    return;
  }

  try {
    // 1️⃣ Use Discord mention if available, otherwise bolded display name
    const mention = formData.discordId
      ? `<@${formData.discordId}>`
      : `**${formData.displayName}**`;

    // 2️⃣ Main message content
    let content;
    if (formData.cooking) {
      const link = formData.recordUrl
        ? `[${formData.recipeName}](${formData.recordUrl})`
        : formData.recipeName;

      content = `${mention} is bringing ${link}!`;
    } else {
      content = `${mention} will be at the table!`;
    }

    // 3️⃣ Optional Instagram handle (inline, no embeds)
    let suppressEmbeds = false;
    if (formData.instagramHandle) {
      const clean = formData.instagramHandle.replace(/^@/, '');
      content += ` <:instagram:1385493882774487181> [@${clean}](https://instagram.com/${clean})`;
      suppressEmbeds = true;
    }

    // 4️⃣ Optional freeform note
    const note = (formData.note || '').toString().trim();
    if (note) content += `\n> ${note}`;

    // 5️⃣ Build and send payload
    const payload = suppressEmbeds
      ? { content: content, flags: 4 }
      : { content: content };

    UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, {
      method:      'post',
      contentType: 'application/json',
      payload:     JSON.stringify(payload)
    });

    console.log('Discord notification sent:', content);

  } catch (err) {
    console.error('Error sending Discord notification:', err);
  }
}

/**
 * NEW: Send email confirmation to guests
 */
function sendGuestEmail(formData) {
  if (formData.audienceType !== 'guest' || !formData.email) {
    return;
  }
  
  try {
    const subject = `RSVP Confirmation - ${CONFIG.EVENT_NAME}`;
    let body = `Hi ${formData.displayName},\n\n`;
    body += `Thank you for your RSVP to ${CONFIG.EVENT_NAME}!\n\n`;
    
    if (formData.cooking) {
      body += `You've signed up to cook: ${formData.recipeName}\n\n`;
    } else {
      body += `You've signed up as a guest (not cooking).\n\n`;
    }
    
    body += `Event Date: ${formData.eventDate || CONFIG.EVENT_DATE}\n\n`;
    
    if (formData.note) {
      body += `Your note: ${formData.note}\n\n`;
    }
    
    body += `We look forward to seeing you there!\n\n`;
    body += `Best regards,\nThe Cook Club Team`;
    
    // Send email using Gmail API (requires Gmail service to be enabled)
    GmailApp.sendEmail(formData.email, subject, body);
    console.log('Guest email sent to:', formData.email);
    
  } catch (error) {
    console.error('Error sending guest email:', error);
    // Don't throw - email failure shouldn't break the submission
  }
}




/**
 * Verify that the Discord ID exists in the Members sheet
 */
function verifyMember(discordId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MEMBERS);
    const membersData = membersSheet.getDataRange().getValues();
    
    for (let i = 1; i < membersData.length; i++) {
      const memberDiscordId = String(membersData[i][COLUMNS.MEMBERS.DISCORD_ID]);
      const status = membersData[i][COLUMNS.MEMBERS.STATUS];
      
      if (memberDiscordId === String(discordId) && 
          (status === true || status === 'TRUE' || status === 'true')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying member:', error);
    return false;
  }
}

/**
 * Check if a recipe is already claimed
 */
function checkDuplicateRecipe(recipeId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
    const recipesData = recipesSheet.getDataRange().getValues();
    
    for (let i = 1; i < recipesData.length; i++) {
      if (String(recipesData[i][COLUMNS.RECIPES.ID]) === String(recipeId)) {
        const claimed = recipesData[i][COLUMNS.RECIPES.CLAIMED];
        return claimed === true || claimed === 'TRUE' || claimed === 'true';
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking duplicate recipe:', error);
    return true; // Err on the side of caution
  }
}

/**
 * Mark a recipe as claimed
 */
function markRecipeAsClaimed(recipeId, claimedBy) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
    const recipesData = recipesSheet.getDataRange().getValues();
    
    for (let i = 1; i < recipesData.length; i++) {
      if (String(recipesData[i][COLUMNS.RECIPES.ID]) === String(recipeId)) {
        const row = i + 1; // Convert to 1-based indexing
        recipesSheet.getRange(row, COLUMNS.RECIPES.CLAIMED + 1).setValue(true);
        // Store either the member's Discord ID or the guest name
        recipesSheet
          .getRange(row, COLUMNS.RECIPES.CLAIMED_BY + 1)
          .setValue(claimedBy);
        recipesSheet.getRange(row, COLUMNS.RECIPES.TIMESTAMP + 1).setValue(new Date());
        break;
      }
    }
  } catch (error) {
    console.error('Error marking recipe as claimed:', error);
    throw error;
  }
}


/**
 * Get form data (members and available recipes) with enhanced descriptions
 */
function getFormData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Get active members
    const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MEMBERS);
    const membersData = membersSheet.getDataRange().getValues();
    const members = [];

    console.log('Members data rows:', membersData.length);
    console.log('First member row:', membersData[1]); // Log for debugging
    
    for (let i = 1; i < membersData.length; i++) { // Skip header row
      const row = membersData[i];
      const status = row[COLUMNS.MEMBERS.STATUS];
      const discordId = row[COLUMNS.MEMBERS.DISCORD_ID];
      const memberName = row[COLUMNS.MEMBERS.MEMBER_NAME];
      
      console.log(`Row ${i}: Status=${status}, DiscordID=${discordId}, Name=${memberName}`);
      
      if (status === true || status === 'TRUE' || status === 'true') {
        members.push({
          discordId: String(discordId), // Ensure it's a string
          displayName: memberName,
          active: true
        });
      }
    }
    
    const memberMap = {};
    for (const member of members) {
      memberMap[member.discordId] = member.displayName;
    }
    console.log('Active members found:', members.length);
    
    // Get recipes (claimed and available) with enhanced descriptions
    const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
    const recipesData = recipesSheet.getDataRange().getValues();
    const recipes = [];

    // Map recipeId -> claimer name from RSVP sheet (most recent entry wins)
    const rsvpsSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RSVPS);
    const rsvpsData = rsvpsSheet.getDataRange().getValues();
    const claimerMap = {};
    for (let i = 1; i < rsvpsData.length; i++) {
      const row = rsvpsData[i];
      const rId = String(row[COLUMNS.RSVPS.RECIPE_ID] || '').trim();
      const name = (row[COLUMNS.RSVPS.MEMBER_NAME] || row[COLUMNS.RSVPS.NAME] || '').toString().trim();
      if (rId && name) {
        claimerMap[rId] = name; // last occurrence wins
      }
    }
    const missingNames = [];
    
    console.log('Recipes data rows:', recipesData.length);
    console.log('First recipe row:', recipesData[1]); // Log for debugging
    
    for (let i = 1; i < recipesData.length; i++) { // Skip header row
      const row = recipesData[i];
      const claimed = row[COLUMNS.RECIPES.CLAIMED];
      const recipeId = row[COLUMNS.RECIPES.ID];
      const recipeName      = row[COLUMNS.RECIPES.RECIPE_TITLE];

      console.log(`Recipe ${i}: ID=${recipeId}, Name=${recipeName}, Claimed=${claimed}`);
    
      // parse out the raw sheet values
      const rawCategories   = row[COLUMNS.RECIPES.CATEGORIES] || '';
      const rawIngredients  = row[COLUMNS.RECIPES.INGREDIENTS] || '';
      const rawAccompaniments  = row[COLUMNS.RECIPES.ACCOMPANIMENTS] || '';
      const recipePage      = row[COLUMNS.RECIPES.PAGE] || '';

      // Create enhanced description
      let description = '';
      if (row[COLUMNS.RECIPES.PAGE]) description += `Page ${row[COLUMNS.RECIPES.PAGE]}`;
      if (row[COLUMNS.RECIPES.CATEGORIES]) {
        if (description) description += ' | ';
        description += `Categories: ${row[COLUMNS.RECIPES.CATEGORIES]}`;
      }
      if (row[COLUMNS.RECIPES.INGREDIENTS]) {
        if (description) description += ' | ';
        // Truncate ingredients if too long
        const ingredients = String(row[COLUMNS.RECIPES.INGREDIENTS]);
        const truncatedIngredients = ingredients.length > 100 ? 
          ingredients.substring(0, 100) + '...' : ingredients;
        description += `Ingredients: ${truncatedIngredients}`;
      }
      if (row[COLUMNS.RECIPES.ACCOMPANIMENTS]) {
        if (description) description += ' | ';
        description += `Accompaniments: ${row[COLUMNS.RECIPES.ACCOMPANIMENTS]}`;
      }

    // **NEW:** only split on semicolons, preserve commas inside each category
    const categories = String(rawCategories)
      .split(';')                   // ← split only at semicolons
      .map(c => c.trim())           // ← trim whitespace
      .filter(Boolean);             // ← drop any empty entries

    recipes.push({
      id:          row[COLUMNS.RECIPES.ID],
      name:        recipeName,
      page:        recipePage,
      categories:  categories,      // ← semicolon-only array
      ingredients: rawIngredients,   // ← raw string as before
      accompaniments: rawAccompaniments,
      description,
      claimed:     false,
      book:        row[COLUMNS.RECIPES.BOOK]   || '',
      author:      row[COLUMNS.RECIPES.AUTHOR] || '',
      recordUrl:   row[COLUMNS.RECIPES.RECORD_URL],
      claimed:     claimed === true || claimed === 'TRUE' || claimed === 'true',
      // Resolve the name. If the value matches a member's Discord ID, use
      // their display name; otherwise assume it's already a plain name (guest).
      claimedBy: (function() {
        const raw = row[COLUMNS.RECIPES.CLAIMED_BY] || '';
        let name = memberMap[raw] || raw;
        if (!name && claimerMap[String(recipeId)]) {
          name = claimerMap[String(recipeId)];
        }
        if (claimed && !name) missingNames.push(recipeId);
        return name;
      })(),
      // Preserve the raw Discord ID for members so the client can link it.
      claimedByDiscordId: memberMap[row[COLUMNS.RECIPES.CLAIMED_BY]] ? row[COLUMNS.RECIPES.CLAIMED_BY] : '',
      // convenience for the client
      claimerName: (function() {
        const raw = row[COLUMNS.RECIPES.CLAIMED_BY] || '';
        let name = memberMap[raw] || raw;
        if (!name && claimerMap[String(recipeId)]) {
          name = claimerMap[String(recipeId)];
        }
        return name;
      })()
    });
    }
    
    console.log('Available recipes found:', recipes.length);
    if (missingNames.length > 0) {
      console.warn('Missing claimer names for recipes:', missingNames.join(', '));
    }
    
    return createResponse(true, 'Data retrieved successfully', {
      members: members,
      recipes: recipes
    });
    
  } catch (error) {
    console.error('Error getting form data:', error);
    return createResponse(false, 'Failed to load data: ' + error.message);
  }
}
