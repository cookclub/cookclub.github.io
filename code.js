// MANUS's 1st ATTEMPT BELOW

// /**
//  * Recipe Sign-Up System - CORRECTED Google Apps Script Backend with CORS Support
//  * Updated with proper CORS headers to fix cross-origin request issues
//  */

// // Configuration - Update these values
// const CONFIG = {
//   SPREADSHEET_ID: '1ycT-jM3Glz7naJ7DY66pCRlXIiHBv6UpZ0dlSfyH_gg', // Your spreadsheet ID
//   SHEETS: {
//     MEMBERS: 'Members',
//     RECIPES: 'Recipes',
//     RSVPS: 'RSVPs'
//   },
//   EVENT_NAME: 'That Sounds So Good: 100 Real-Life Recipes for Every Day of the Week',
//   EVENT_DATE: '2025-06-21'
// };

// // CORRECTED Column mappings based on actual sheet structure
// const COLUMNS = {
//   MEMBERS: {
//     MEMBER_NAME: 0,      // A: Member Name
//     DISCORD_ID: 1,       // B: Discord ID
//     STATUS: 2            // C: Status (TRUE/FALSE)
//   },
//   RECIPES: {
//     ID: 0,               // A: ID
//     RECIPE_TITLE: 1,     // B: Recipe Title
//     PAGE: 2,             // C: Page
//     BOOK: 3,             // D: Book
//     AUTHOR: 4,           // E: Author
//     CATEGORIES: 5,       // F: Categories
//     INGREDIENTS: 6,      // G: Ingredients
//     ACCOMPANIMENTS: 7,   // H: Accompaniments
//     TIMESTAMP: 8,        // J: Timestamp
//     CLAIMED: 9,          // K: Claimed (TRUE/FALSE)
//     CLAIMED_BY: 10,      // M: Claimed By (Discord ID)
//     RECORD_URL: 11       // N: Record URL
//   },
//   RSVPS: {
//     CLAIM_ID: 0,         // A: Claim ID
//     RSVP_TYPE: 1,        // B: RSVP Type
//     RECIPE: 2,           // C: Recipe
//     RECIPE_ID: 3,        // D: RecipeID
//     MEMBER_NAME: 4,      // E: Member Name
//     DISCORD_ID: 5,       // F: Discord_ID
//     EMAIL: 6,            // G: Email
//     IS_DISCORD: 7,       // H: Is Discord
//     TIMESTAMP: 8,        // I: Timestamp
//     EVENT: 9,            // J: Event
//     EVENT_DATE: 10,      // K: Event Date
//     NOTES: 11            // L: Notes
//   }
// };

// /**
//  * CORS Helper Function - Creates responses with proper CORS headers
//  */
// function createCORSResponse(data, success = true) {
//   return ContentService
//     .createTextOutput(JSON.stringify(data))
//     .setMimeType(ContentService.MimeType.JSON)
//     .setHeaders({
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//       'Access-Control-Max-Age': '3600'
//     });
// }

// /**
//  * Handle OPTIONS requests (CORS preflight)
//  * This is crucial for fixing the CORS error
//  */
// function doOptions(e) {
//   return ContentService
//     .createTextOutput('')
//     .setMimeType(ContentService.MimeType.JSON)
//     .setHeaders({
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//       'Access-Control-Max-Age': '3600'
//     });
// }

// /**
//  * Handle POST requests with proper CORS headers
//  */
// function doPost(e) {
//   try {
//     // Parse the JSON body sent by fetch()
//     const data = JSON.parse(e.postData.contents);
    
//     // Validate the submission
//     const validation = validateSubmission(data);
//     if (!validation.valid) {
//       return createCORSResponse({
//         status: 'error',
//         message: validation.error
//       });
//     }
    
//     // Check for duplicate recipe claim if cooking
//     if (data.cooking && data.recipeId) {
//       const isDuplicate = checkDuplicateRecipe(data.recipeId);
//       if (isDuplicate) {
//         return createCORSResponse({
//           status: 'error',
//           message: 'This recipe has already been claimed. Please choose another one.'
//         });
//       }
      
//       // Mark recipe as claimed
//       markRecipeAsClaimed(data.recipeId, data.discordId);
//     }
    
//     // Append RSVP row to the sheet
//     appendRSVPRow(data);
    
//     // Send notifications
//     if (data.isDiscord === 'yes') {
//       sendDiscordNotification(data);
//     } else {
//       sendGuestEmail(data);
//     }

//     // Return success response with CORS headers
//     return createCORSResponse({
//       status: 'ok',
//       message: 'RSVP submitted successfully'
//     });

//   } catch (err) {
//     console.error('doPost error', err);
//     return createCORSResponse({
//       status: 'error',
//       message: err.message
//     });
//   }
// }

// /**
//  * Append RSVP row to the spreadsheet
//  */
// function appendRSVPRow(data) {
//   const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//   const sh = ss.getSheetByName(CONFIG.SHEETS.RSVPS);

//   // Ensure header row has enough columns
//   const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
//   if (header.length < 12) {
//     sh.insertColumnsAfter(header.length, 12 - header.length);
//   }

//   sh.appendRow([
//     new Date().getTime(),                    // Claim-ID as timestamp
//     data.cooking ? 'Cook' : 'Guest',        // RSVP Type
//     data.dish || '',                        // Recipe name
//     data.recipeId || '',                    // Recipe ID
//     data.displayName,                       // Member Name
//     data.discordId || '',                   // Discord ID
//     data.email || '',                       // Email
//     data.isDiscord,                         // "yes" / "no"
//     new Date(),                             // Timestamp
//     data.eventName || CONFIG.EVENT_NAME,    // Event
//     data.eventDate || CONFIG.EVENT_DATE,    // Event Date
//     data.note || ''                         // Notes
//   ]);
// }

// /**
//  * Handle GET requests with proper CORS headers
//  */
// function doGet(e) {
//   try {
//     const action = e.parameter.action;
    
//     if (action === 'getData') {
//       return getFormData();
//     }
    
//     return createCORSResponse({
//       success: false,
//       message: 'Unknown action'
//     });
    
//   } catch (error) {
//     console.error('Error in doGet:', error);
//     return createCORSResponse({
//       success: false,
//       message: 'Server error: ' + error.message
//     });
//   }
// }

// /**
//  * Get form data (members and available recipes) with enhanced descriptions
//  */
// function getFormData() {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
//     // Get active members
//     const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MEMBERS);
//     const membersData = membersSheet.getDataRange().getValues();
//     const members = [];

//     console.log('Members data rows:', membersData.length);
    
//     for (let i = 1; i < membersData.length; i++) { // Skip header row
//       const row = membersData[i];
//       const status = row[COLUMNS.MEMBERS.STATUS];
//       const discordId = row[COLUMNS.MEMBERS.DISCORD_ID];
//       const memberName = row[COLUMNS.MEMBERS.MEMBER_NAME];
      
//       if (status === true || status === 'TRUE' || status === 'true') {
//         members.push({
//           discordId: String(discordId), // Ensure it's a string
//           displayName: memberName,
//           active: true
//         });
//       }
//     }
    
//     const memberMap = {};
//     for (const member of members) {
//       memberMap[member.discordId] = member.displayName;
//     }
//     console.log('Active members found:', members.length);
    
//     // Get recipes (claimed and available) with enhanced descriptions
//     const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
//     const recipesData = recipesSheet.getDataRange().getValues();
//     const recipes = [];
    
//     console.log('Recipes data rows:', recipesData.length);
    
//     for (let i = 1; i < recipesData.length; i++) { // Skip header row
//       const row = recipesData[i];
//       const claimed = row[COLUMNS.RECIPES.CLAIMED];
//       const recipeId = row[COLUMNS.RECIPES.ID];
//       const recipeName = row[COLUMNS.RECIPES.RECIPE_TITLE];

//       // Parse out the raw sheet values
//       const rawCategories = row[COLUMNS.RECIPES.CATEGORIES] || '';
//       const rawIngredients = row[COLUMNS.RECIPES.INGREDIENTS] || '';
//       const rawAccompaniments = row[COLUMNS.RECIPES.ACCOMPANIMENTS] || '';
//       const recipePage = row[COLUMNS.RECIPES.PAGE] || '';

//       // Create enhanced description
//       let description = '';
//       if (row[COLUMNS.RECIPES.PAGE]) description += `Page ${row[COLUMNS.RECIPES.PAGE]}`;
//       if (row[COLUMNS.RECIPES.CATEGORIES]) {
//         if (description) description += ' | ';
//         description += `Categories: ${row[COLUMNS.RECIPES.CATEGORIES]}`;
//       }
//       if (row[COLUMNS.RECIPES.INGREDIENTS]) {
//         if (description) description += ' | ';
//         // Truncate ingredients if too long
//         const ingredients = String(row[COLUMNS.RECIPES.INGREDIENTS]);
//         const truncatedIngredients = ingredients.length > 100 ? 
//           ingredients.substring(0, 100) + '...' : ingredients;
//         description += `Ingredients: ${truncatedIngredients}`;
//       }
//       if (row[COLUMNS.RECIPES.ACCOMPANIMENTS]) {
//         if (description) description += ' | ';
//         description += `Accompaniments: ${row[COLUMNS.RECIPES.ACCOMPANIMENTS]}`;
//       }

//       // Split categories on semicolons, preserve commas inside each category
//       const categories = String(rawCategories)
//         .split(';')                   // Split only at semicolons
//         .map(c => c.trim())           // Trim whitespace
//         .filter(Boolean);             // Drop any empty entries

//       recipes.push({
//         id: row[COLUMNS.RECIPES.ID],
//         name: recipeName,
//         page: recipePage,
//         categories: categories,      // Semicolon-only array
//         ingredients: rawIngredients,   // Raw string as before
//         accompaniments: rawAccompaniments,
//         description,
//         book: row[COLUMNS.RECIPES.BOOK] || '',
//         author: row[COLUMNS.RECIPES.AUTHOR] || '',
//         recordUrl: row[COLUMNS.RECIPES.RECORD_URL],   
//         claimed: claimed === true || claimed === 'TRUE' || claimed === 'true',
//         claimedBy: memberMap[row[COLUMNS.RECIPES.CLAIMED_BY]] || '' // Resolve name
//       });
//     }
    
//     console.log('Available recipes found:', recipes.length);
    
//     return createCORSResponse({
//       success: true,
//       message: 'Data retrieved successfully',
//       data: {
//         members: members,
//         recipes: recipes
//       }
//     });
    
//   } catch (error) {
//     console.error('Error getting form data:', error);
//     return createCORSResponse({
//       success: false,
//       message: 'Failed to load data: ' + error.message
//     });
//   }
// }

// /**
//  * Validate form submission data
//  */
// function validateSubmission(formData) {
//   if (!formData.discordId) {
//     return { valid: false, error: 'Discord ID is required' };
//   }
  
//   if (!formData.displayName) {
//     return { valid: false, error: 'Display name is required' };
//   }
  
//   if (formData.cooking === undefined) {
//     return { valid: false, error: 'Cooking preference is required' };
//   }
  
//   if (formData.cooking && !formData.recipeId) {
//     return { valid: false, error: 'Recipe selection is required when cooking' };
//   }
  
//   // Verify member exists
//   const memberExists = verifyMember(formData.discordId);
//   if (!memberExists) {
//     return { valid: false, error: 'Invalid member' };
//   }
  
//   return { valid: true };
// }

// /**
//  * Verify that the Discord ID exists in the Members sheet
//  */
// function verifyMember(discordId) {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MEMBERS);
//     const membersData = membersSheet.getDataRange().getValues();
    
//     for (let i = 1; i < membersData.length; i++) {
//       const memberDiscordId = String(membersData[i][COLUMNS.MEMBERS.DISCORD_ID]);
//       const status = membersData[i][COLUMNS.MEMBERS.STATUS];
      
//       if (memberDiscordId === String(discordId) && 
//           (status === true || status === 'TRUE' || status === 'true')) {
//         return true;
//       }
//     }
    
//     return false;
//   } catch (error) {
//     console.error('Error verifying member:', error);
//     return false;
//   }
// }

// /**
//  * Check if a recipe is already claimed
//  */
// function checkDuplicateRecipe(recipeId) {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
//     const recipesData = recipesSheet.getDataRange().getValues();
    
//     for (let i = 1; i < recipesData.length; i++) {
//       if (String(recipesData[i][COLUMNS.RECIPES.ID]) === String(recipeId)) {
//         const claimed = recipesData[i][COLUMNS.RECIPES.CLAIMED];
//         return claimed === true || claimed === 'TRUE' || claimed === 'true';
//       }
//     }
    
//     return false;
//   } catch (error) {
//     console.error('Error checking duplicate recipe:', error);
//     return true; // Err on the side of caution
//   }
// }

// /**
//  * Mark a recipe as claimed
//  */
// function markRecipeAsClaimed(recipeId, discordId) {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
//     const recipesData = recipesSheet.getDataRange().getValues();
    
//     for (let i = 1; i < recipesData.length; i++) {
//       if (String(recipesData[i][COLUMNS.RECIPES.ID]) === String(recipeId)) {
//         const row = i + 1; // Convert to 1-based indexing
//         recipesSheet.getRange(row, COLUMNS.RECIPES.CLAIMED + 1).setValue(true);
//         recipesSheet.getRange(row, COLUMNS.RECIPES.CLAIMED_BY + 1).setValue(discordId);
//         recipesSheet.getRange(row, COLUMNS.RECIPES.TIMESTAMP + 1).setValue(new Date());
//         break;
//       }
//     }
//   } catch (error) {
//     console.error('Error marking recipe as claimed:', error);
//     throw error;
//   }
// }

// /**
//  * Send Discord notification
//  */
// function sendDiscordNotification(formData) {
//   if (!CONFIG.DISCORD_WEBHOOK_URL) {
//     console.log('Discord webhook not configured, skipping notification');
//     return;
//   }
  
//   try {
//     let message;
//     if (formData.cooking) {
//       message = `🍽️ **${formData.displayName}** has claimed **${formData.dish}** for ${CONFIG.EVENT_NAME}!`;
//       if (formData.recordUrl) {
//         message += `\n📋 Recipe details: ${formData.recordUrl}`;
//       }
//     } else {
//       message = `👋 **${formData.displayName}** is attending ${CONFIG.EVENT_NAME} (not cooking).`;
//     }
    
//     if (formData.note) {
//       message += `\n💬 Note: ${formData.note}`;
//     }
    
//     const payload = {
//       content: message,
//       username: 'Recipe Bot'
//     };
    
//     const options = {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       payload: JSON.stringify(payload)
//     };
    
//     const response = UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, options);
//     console.log('Discord notification sent:', response.getResponseCode());
    
//   } catch (error) {
//     console.error('Error sending Discord notification:', error);
//     // Don't throw error - notification failure shouldn't break the submission
//   }
// }

// /**
//  * Send guest email confirmation (placeholder)
//  */
// function sendGuestEmail(formData) {
//   // Placeholder for email functionality
//   console.log('Email notification would be sent to:', formData.email);
//   // You can implement email sending using GmailApp or other email services
// }

// /**
//  * Test function for Discord notifications
//  */
// function testDiscordNotification() {
//   const testData = {
//     displayName: "Test User",
//     cooking: true,
//     dish: "Test Recipe",
//     recordUrl: "https://example.com/recipe",
//     note: "This is a test notification"
//   };
//   sendDiscordNotification(testData);
// }


// FIRST VERSION BELOW (OG)

// /**
//  * Recipe Sign-Up System - CORRECTED Google Apps Script Backend
//  * Updated with correct column mappings based on actual sheet structure
//  */

// // Configuration - Update these values
// const CONFIG = {
//   SPREADSHEET_ID: '1ycT-jM3Glz7naJ7DY66pCRlXIiHBv6UpZ0dlSfyH_gg', // Your spreadsheet ID
//   SHEETS: {
//     MEMBERS: 'Members',
//     RECIPES: 'Recipes',
//     RSVPS: 'RSVPs'
//   },
//   EVENT_NAME: 'That Sounds So Good: 100 Real-Life Recipes for Every Day of the Week'
// };

// // CORRECTED Column mappings based on actual sheet structure
// const COLUMNS = {
//   MEMBERS: {
//     MEMBER_NAME: 0,      // A: Member Name
//     DISCORD_ID: 1,       // B: Discord ID
//     STATUS: 2            // C: Status (TRUE/FALSE)
//   },
//   RECIPES: {
//     ID: 0,               // A: ID
//     RECIPE_TITLE: 1,     // B: Recipe Title
//     PAGE: 2,             // C: Page
//     BOOK: 3,             // D: Book
//     AUTHOR: 4,           // E: Author
//     CATEGORIES: 5,       // F: Categories
//     INGREDIENTS: 6,      // G: Ingredients
//     ACCOMPANIMENTS: 7,   // H: Accompaniments
//     TIMESTAMP: 8,        // J: Timestamp
//     CLAIMED: 9,          // K: Claimed (TRUE/FALSE)
//     CLAIMED_BY: 10,      // M: Claimed By (Discord ID)
//     RECORD_URL: 11       // N: Record URL
//   },
//   RSVPS: {
//     CLAIM_ID: 0,         // A: Claim ID
//     RSVP_TYPE: 1,        // B: RSVP Type
//     RECIPE: 2,           // C: Recipe
//     RECIPE_ID: 3,        // D: RecipeID
//     MEMBER_NAME: 4,      // E: Member Name
//     DISCORD_ID: 5,       // F: Discord_ID
//     EMAIL: 6,            // G  ← NEW
//     IS_DISCORD: 7,       // H  ← NEW
//     TIMESTAMP: 8,        // G: Timestamp
//     EVENT: 9,            // I: Event
//     EVENT_DATE: 10,       // J: Event Date
//     NOTES: 11            // K: Notes
//   }
// };


// function doOptions(e) {
//   // no special headers; just return an empty JSON body
//   return ContentService.createTextOutput('')
//           .setMimeType(ContentService.MimeType.JSON);
// }


// /**
//  * Handle POST requests  
//  */
// // function doPost(e) {
// //   try {
// //     const action = e.parameter.action;
    
// //     if (action === 'submitRSVP') {
// //       const data = JSON.parse(e.parameter.data);
// //       return handleRSVPSubmission(data);
// //     }
    
// //     return ContentService.createTextOutput(JSON.stringify({
// //       success: false, 
// //       message: 'Unknown action'
// //     })).setMimeType(ContentService.MimeType.JSON);
    
// //   } catch (error) {
// //     console.error('Error in doPost:', error);
// //     return ContentService.createTextOutput(JSON.stringify({
// //       success: false, 
// //       message: 'Server error: ' + error.message
// //     })).setMimeType(ContentService.MimeType.JSON);
// //   }
// // }

// function doPost(e) {
//   try {
//     // A. parse the body sent by fetch()
//     const data = JSON.parse(e.postData.contents);   // ← no action param any more

//     // B. append one simple row (creates columns if they don’t exist)
//     appendRSVPRow(data);                            // helper just below

//     // C. branch: Discord ping vs. e-mail confirm
//     if (data.isDiscord === 'yes') {
//       sendDiscordNotification(data);
//     } else {
//       sendGuestEmail(data);
//     }

//     // D. return OK for the browser
//     return ContentService.createTextOutput(
//       JSON.stringify({ status: 'ok' })
//     ).setMimeType(ContentService.MimeType.JSON);

//   } catch (err) {
//     console.error('doPost error', err);
//     return ContentService.createTextOutput(
//       JSON.stringify({ status: 'error', message: err.message })
//     ).setMimeType(ContentService.MimeType.JSON);
//   }
// }

// function appendRSVPRow(d) {
//   const ss  = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//   const sh  = ss.getSheetByName(CONFIG.SHEETS.RSVPS);

//   // make sure header row is long enough (1-based col numbers)
//   const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
//   if (header.length < 12) sh.insertColumnsAfter(header.length, 12 - header.length);

//   sh.appendRow([
//     new Date().getTime(),        // Claim-ID as timestamp
//     d.cooking ? 'Cook' : 'Guest',
//     d.dish || '',
//     d.recipeId || '',
//     d.name,
//     d.discordId || '',
//     d.email || '',
//     d.isDiscord,                 // “yes” / “no”
//     new Date(),                  // Timestamp
//     CONFIG.EVENT_NAME,
//     CONFIG.EVENT_DATE || '',
//     d.note || ''
//   ]);
// }


// /**
//  * Handle GET requests
//  */
// function doGet(e) {
//   try {
//     const action = e.parameter.action;
    
//     if (action === 'getData') {
//       return getFormData();
//     }
    
//     return createResponse(false, 'Unknown action');
//   } catch (error) {
//     console.error('Error in doGet:', error);
//     return createResponse(false, 'Server error: ' + error.message);
//   }
// }


// /**
//  * Handle RSVP form submission
//  */
// function handleRSVPSubmission(formData) {
//   const lock = LockService.getScriptLock();
  
//   try {
//     // Acquire lock to prevent race conditions
//     lock.waitLock(10000); // Wait up to 10 seconds
    
//     // Validate the submission
//     const validation = validateSubmission(formData);
//     if (!validation.valid) {
//       return createResponse(false, validation.error);
//     }
    
//     // Check for duplicate recipe claim
//     if (formData.cooking && formData.recipeId) {
//       const isDuplicate = checkDuplicateRecipe(formData.recipeId);
//       if (isDuplicate) {
//         return createResponse(false, 'This recipe has already been claimed. Please choose another one.');
//       }
      
//       // Mark recipe as claimed
//       markRecipeAsClaimed(formData.recipeId, formData.discordId);
//     }
    
//     // Record the RSVP
//     recordRSVP(formData);
    
//     // Send notifications (if Discord webhook is configured)
//     if (CONFIG.DISCORD_WEBHOOK_URL) {
//       sendDiscordNotification(formData);
//     }
    
//     return createResponse(true, 'RSVP submitted successfully');
    
//   } catch (error) {
//     console.error('Error handling RSVP submission:', error);
//     return createResponse(false, 'Failed to submit RSVP: ' + error.message);
//   } finally {
//     lock.releaseLock();
//   }
// }

// /**
//  * Get form data (members and available recipes) with enhanced descriptions
//  */
// function getFormData() {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
//     // Get active members
//     const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MEMBERS);
//     const membersData = membersSheet.getDataRange().getValues();
//     const members = [];

//     console.log('Members data rows:', membersData.length);
//     console.log('First member row:', membersData[1]); // Log for debugging
    
//     for (let i = 1; i < membersData.length; i++) { // Skip header row
//       const row = membersData[i];
//       const status = row[COLUMNS.MEMBERS.STATUS];
//       const discordId = row[COLUMNS.MEMBERS.DISCORD_ID];
//       const memberName = row[COLUMNS.MEMBERS.MEMBER_NAME];
      
//       console.log(`Row ${i}: Status=${status}, DiscordID=${discordId}, Name=${memberName}`);
      
//       if (status === true || status === 'TRUE' || status === 'true') {
//         members.push({
//           discordId: String(discordId), // Ensure it's a string
//           displayName: memberName,
//           active: true
//         });
//       }
//     }
    
//     const memberMap = {};
//     for (const member of members) {
//       memberMap[member.discordId] = member.displayName;
//     }
//     console.log('Active members found:', members.length);
    
//     // Get recipes (claimed and available) with enhanced descriptions
//     const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
//     const recipesData = recipesSheet.getDataRange().getValues();
//     const recipes = [];
    
//     console.log('Recipes data rows:', recipesData.length);
//     console.log('First recipe row:', recipesData[1]); // Log for debugging
    
//     for (let i = 1; i < recipesData.length; i++) { // Skip header row
//       const row = recipesData[i];
//       const claimed = row[COLUMNS.RECIPES.CLAIMED];
//       const recipeId = row[COLUMNS.RECIPES.ID];
//       const recipeName      = row[COLUMNS.RECIPES.RECIPE_TITLE];

//       console.log(`Recipe ${i}: ID=${recipeId}, Name=${recipeName}, Claimed=${claimed}`);
    
//       // parse out the raw sheet values
//       const rawCategories   = row[COLUMNS.RECIPES.CATEGORIES] || '';
//       const rawIngredients  = row[COLUMNS.RECIPES.INGREDIENTS] || '';
//       const rawAccompaniments  = row[COLUMNS.RECIPES.ACCOMPANIMENTS] || '';
//       const recipePage      = row[COLUMNS.RECIPES.PAGE] || '';

//       // Create enhanced description
//       let description = '';
//       if (row[COLUMNS.RECIPES.PAGE]) description += `Page ${row[COLUMNS.RECIPES.PAGE]}`;
//       if (row[COLUMNS.RECIPES.CATEGORIES]) {
//         if (description) description += ' | ';
//         description += `Categories: ${row[COLUMNS.RECIPES.CATEGORIES]}`;
//       }
//       if (row[COLUMNS.RECIPES.INGREDIENTS]) {
//         if (description) description += ' | ';
//         // Truncate ingredients if too long
//         const ingredients = String(row[COLUMNS.RECIPES.INGREDIENTS]);
//         const truncatedIngredients = ingredients.length > 100 ? 
//           ingredients.substring(0, 100) + '...' : ingredients;
//         description += `Ingredients: ${truncatedIngredients}`;
//       }
//       if (row[COLUMNS.RECIPES.ACCOMPANIMENTS]) {
//         if (description) description += ' | ';
//         description += `Accompaniments: ${row[COLUMNS.RECIPES.ACCOMPANIMENTS]}`;
//       }

//     // **NEW:** only split on semicolons, preserve commas inside each category
//     const categories = String(rawCategories)
//       .split(';')                   // ← split only at semicolons
//       .map(c => c.trim())           // ← trim whitespace
//       .filter(Boolean);             // ← drop any empty entries

//     recipes.push({
//       id:          row[COLUMNS.RECIPES.ID],
//       name:        recipeName,
//       page:        recipePage,
//       categories:  categories,      // ← semicolon-only array
//       ingredients: rawIngredients,   // ← raw string as before
//       accompaniments: rawAccompaniments,
//       description,
//       claimed:     false,
//       book:        row[COLUMNS.RECIPES.BOOK]   || '',
//       author:      row[COLUMNS.RECIPES.AUTHOR] || '',
//       recordUrl:   row[COLUMNS.RECIPES.RECORD_URL],   
//       claimed:     claimed === true || claimed === 'TRUE' || claimed === 'true',
//       claimedBy: memberMap[row[COLUMNS.RECIPES.CLAIMED_BY]] || '' // Resolve name
//     });
//     }
    
//     console.log('Available recipes found:', recipes.length);
    
//     return createResponse(true, 'Data retrieved successfully', {
//       members: members,
//       recipes: recipes
//     });
    
//   } catch (error) {
//     console.error('Error getting form data:', error);
//     return createResponse(false, 'Failed to load data: ' + error.message);
//   }
// }

// /**
//  * Validate form submission data
//  */
// function validateSubmission(formData) {
//   if (!formData.discordId) {
//     return { valid: false, error: 'Discord ID is required' };
//   }
  
//   if (!formData.displayName) {
//     return { valid: false, error: 'Display name is required' };
//   }
  
//   if (formData.cooking === undefined) {
//     return { valid: false, error: 'Cooking preference is required' };
//   }
  
//   if (formData.cooking && !formData.recipeId) {
//     return { valid: false, error: 'Recipe selection is required when cooking' };
//   }
  
//   // Verify member exists
//   const memberExists = verifyMember(formData.discordId);
//   if (!memberExists) {
//     return { valid: false, error: 'Invalid member' };
//   }
  
//   return { valid: true };
// }

// /**
//  * Verify that the Discord ID exists in the Members sheet
//  */
// function verifyMember(discordId) {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MEMBERS);
//     const membersData = membersSheet.getDataRange().getValues();
    
//     for (let i = 1; i < membersData.length; i++) {
//       const memberDiscordId = String(membersData[i][COLUMNS.MEMBERS.DISCORD_ID]);
//       const status = membersData[i][COLUMNS.MEMBERS.STATUS];
      
//       if (memberDiscordId === String(discordId) && 
//           (status === true || status === 'TRUE' || status === 'true')) {
//         return true;
//       }
//     }
    
//     return false;
//   } catch (error) {
//     console.error('Error verifying member:', error);
//     return false;
//   }
// }

// /**
//  * Check if a recipe is already claimed
//  */
// function checkDuplicateRecipe(recipeId) {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
//     const recipesData = recipesSheet.getDataRange().getValues();
    
//     for (let i = 1; i < recipesData.length; i++) {
//       if (String(recipesData[i][COLUMNS.RECIPES.ID]) === String(recipeId)) {
//         const claimed = recipesData[i][COLUMNS.RECIPES.CLAIMED];
//         return claimed === true || claimed === 'TRUE' || claimed === 'true';
//       }
//     }
    
//     return false;
//   } catch (error) {
//     console.error('Error checking duplicate recipe:', error);
//     return true; // Err on the side of caution
//   }
// }

// /**
//  * Mark a recipe as claimed
//  */
// function markRecipeAsClaimed(recipeId, discordId) {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
//     const recipesData = recipesSheet.getDataRange().getValues();
    
//     for (let i = 1; i < recipesData.length; i++) {
//       if (String(recipesData[i][COLUMNS.RECIPES.ID]) === String(recipeId)) {
//         const row = i + 1; // Convert to 1-based indexing
//         recipesSheet.getRange(row, COLUMNS.RECIPES.CLAIMED + 1).setValue(true);
//         recipesSheet.getRange(row, COLUMNS.RECIPES.CLAIMED_BY + 1).setValue(discordId);
//         recipesSheet.getRange(row, COLUMNS.RECIPES.TIMESTAMP + 1).setValue(new Date());
//         break;
//       }
//     }
//   } catch (error) {
//     console.error('Error marking recipe as claimed:', error);
//     throw error;
//   }
// }

// /**
//  * Record the RSVP in the RSVPs sheet
//  */
// function recordRSVP(formData) {
//   try {
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     const rsvpsSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RSVPS);
    
//     // Generate a simple ID (timestamp-based)
//     const id = Date.now();
    
//     const newRow = [
//       id,                                           // A: Claim ID
//       formData.cooking ? 'Cook' : 'Guest',         // B: RSVP Type
//       formData.recipeName || '',                   // C: Recipe
//       formData.cooking ? formData.recipeId : '',   // D: RecipeID
//       formData.displayName,                        // E: Member Name
//       formData.discordId,                          // F: Discord_ID
//       new Date(),                                  // G: Timestamp
//       formData.eventName || CONFIG.EVENT_NAME,     // I: Event
//       formData.eventDate || CONFIG.EVENT_DATE,     // J: Event Date
//       formData.note || ''                          // K: Notes
//     ];
    
//     rsvpsSheet.appendRow(newRow);
//   } catch (error) {
//     console.error('Error recording RSVP:', error);
//     throw error;
//   }
// }

// /**
//  * Test Discord notification
//  */
// function testDiscordNotification() {
//   const testData = {
//     displayName: "Test User",
//     cooking: true,
//     recipeName: "Test Recipe",
//     recordUrl: "https://airtable.com/appIAkfA9Dy3C2a3b/shr5gKBVPHqwJarBB/tbl0xVdExeNgWdPxm/viw2mxZ2oRhqCSJUQ/rectJ6AewWUmtSgdn"
//   };
//   sendDiscordNotification(testData);
// }

// // /**
// //  * Send Discord notification
// //  */
// // function sendDiscordNotification(formData) {
// //   if (!CONFIG.DISCORD_WEBHOOK_URL) {
// //     console.log('Discord webhook not configured, skipping notification');
// //     return;
// //   }
  
// //   try {
// //     let message;
// //     if (formData.cooking) {
// //       message = `🍽️ **${formData.displayName}** has claimed **${formData.recipeName}** for ${CONFIG.EVENT_NAME}!`;
// //     } else {
// //       message = `👋 **${formData.displayName}** is attending ${CONFIG.EVENT_NAME} (not cooking).`;
// //     }
    
// //     const payload = {
// //       content: message,
// //       embeds: [{
// //         title: "Recipe Sign-Up Update",
// //         description: message,
// //         color: formData.cooking ? 0x00ff00 : 0x0099ff,
// //         timestamp: new Date().toISOString()
// //       }]
// //     };
    
// //     const options = {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json'
// //       },
// //       payload: JSON.stringify(payload)
// //     };
    
// //     UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, options);
// //   } catch (error) {
// //     console.error('Error sending Discord notification:', error);
// //     // Don't throw error - notification failure shouldn't break the submission
// //   }
// // }

// /**
//  * Enhanced Discord Notification Function with User Pings
//  * Add this to your Google Apps Script to replace the existing sendDiscordNotification function
//  */

// /**
//  * Send Discord notification with user ping for confirmation
//  */
// // function sendDiscordNotification(formData) {
// //   if (!CONFIG.DISCORD_WEBHOOK_URL) {
// //     console.log('Discord webhook not configured, skipping notification');
// //     return;
// //   }
  
// //   try {
// //     let message;
// //     let embedColor;
// //     let embedTitle;
    
// //     if (formData.cooking) {
// //       // Recipe claim notification with user ping
// //       message = `🍽️ **${formData.displayName}** has claimed **${formData.recipeName}** for ${CONFIG.EVENT_NAME}!\n\n<@${formData.discordId}> Your recipe has been confirmed! 🎉`;
// //       embedColor = 0x00ff00; // Green for cooking
// //       embedTitle = "Recipe Claimed!";
// //     } else {
// //       // Guest RSVP notification with user ping
// //       message = `👋 **${formData.displayName}** is attending ${CONFIG.EVENT_NAME} (not cooking).\n\n<@${formData.discordId}> Your RSVP has been confirmed! ✅`;
// //       embedColor = 0x0099ff; // Blue for guest
// //       embedTitle = "RSVP Confirmed!";
// //     }
    
// //     const payload = {
// //       content: message,
// //       embeds: [{
// //         title: embedTitle,
// //         description: formData.cooking ? 
// //           `Recipe: **${formData.recipeName}**\nEvent: ${CONFIG.EVENT_NAME}` :
// //           `Event: ${CONFIG.EVENT_NAME}`,
// //         color: embedColor,
// //         timestamp: new Date().toISOString(),
// //         footer: {
// //           text: "Recipe Sign-Up System"
// //         }
// //       }]
// //     };
    
// //     const options = {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json'
// //       },
// //       payload: JSON.stringify(payload)
// //     };
    
// //     UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, options);
// //     console.log('Discord notification sent successfully');
// //   } catch (error) {
// //     console.error('Error sending Discord notification:', error);
// //     // Don't throw error - notification failure shouldn't break the submission
// //   }
// // }
// /**
//  * Send Discord notification with user ping for confirmation
//  * Four variants based on cooking vs guest and note vs no-note.
//  */
// function sendDiscordNotification(formData) {
//   if (!CONFIG.DISCORD_WEBHOOK_URL) {
//     console.log('Discord webhook not configured, skipping notification');
//     return;
//   }

//   try {
//     // 1) Choose emoji and mention/text
//     const emoji = formData.cooking ? '🍽️' : '🪑';

//     const mention = (formData.isDiscord === 'yes' && formData.discordId)
//       ? `<@${formData.discordId}>`
//       : `${formData.displayName || formData.name} (guest)`;

//     // 2) Build the base message
//     let content;
//     if (formData.cooking) {
//       // link if we have a URL, else bold
//       const link = formData.recordUrl
//         ? `[${formData.recipeName}](${formData.recordUrl})`
//         : `**${formData.recipeName}**`;
//       content = `${emoji} ${mention} is bringing ${link}!`;
//     } else {
//       // just attending
//       content = `${emoji} ${mention} will be at the table!`;
//     }

//     // 3) Append note if present
//     const note = (formData.note || '').toString().trim();
//     if (note) content += `\n> ${note}`;

//     // 4) Dispatch (plain content)
//     const payload = { content };

//     UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, {
//       method: 'post',
//       contentType: 'application/json',
//       payload: JSON.stringify(payload)
//     });

//     console.log('Discord notification sent:', content);

//   } catch (err) {
//     console.error('Error sending Discord notification:', err);
//   }
// }

// function sendGuestEmail({name, email, dish}) {
//  if (!email) return;                         // safety
//  const subject  = '🌟 You’re on the menu – Cookbook Club';
//  const htmlBody = `
//    <p>Hey ${name},</p>
//    <p>Thanks for claiming <strong>${dish}</strong>!<br>
//       We’ll see you on <em>June 12 @ 7 PM</em>.</p>
//    <p>Live menu & details:<br>
//       <a href='https://cookclub.github.io'>cookclub.github.io</a></p>`;
//  MailApp.sendEmail({to:email,name:'Cookbook Club',subject,htmlBody});
// }


// function sendDiscordNotification(formData) {
//   if (!CONFIG.DISCORD_WEBHOOK_URL) {
//     console.log('Discord webhook not configured, skipping notification');
//     return;
//   }

//   try {
//     // 1) Choose emoji and mention
//     const emoji   = formData.cooking ? '🍽️' : '🪑';
//     const mention = `<@${formData.discordId}>`;

//     // 2) Build the base message
//     let content;
//     if (formData.cooking) {
//       // Cooking: link the recipe name if we have a URL, else bold text
//       const link = formData.recordUrl
//         ? `[${formData.recipeName}](${formData.recordUrl})`
//         : `**${formData.recipeName}**`;
//       content = `${emoji} ${mention} is bringing ${link}!`;
//     } else {
//       // Guest
//       content = `${emoji} ${mention} will be at the table!`;
//     }

//     // 3) Append blockquote if there's a note
//     const note = (formData.note || '').toString().trim();
//     if (note) {
//       content += `\n> ${note}`;
//     }

//     // 4) Dispatch as plain content (no embeds)
//     const payload = {
//       content:     content,
//       embeds:      null,
//       attachments: []
//     };

//     UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, {
//       method:      'post',
//       contentType: 'application/json',
//       payload:     JSON.stringify(payload)
//     });

//     console.log('Discord notification sent:', content);

//   } catch (err) {
//     console.error('Error sending Discord notification:', err);
//   }
// }


// /**
//  * Test function for enhanced Discord notifications
//  */
// function testEnhancedDiscordNotification() {
//   // Test cooking notification
//   const cookingTestData = {
//     displayName: "Test User",
//     discordId: "385633397378121729", // Use a real Discord ID from your members
//     cooking: true,
//     recipeName: "Test Recipe - Pasta with cacio e walnut"
//   };
  
//   console.log('Testing cooking notification...');
//   sendDiscordNotification(cookingTestData);
  
//   // Wait a moment, then test guest notification
//   Utilities.sleep(2000);
  
//   const guestTestData = {
//     displayName: "Test Guest",
//     discordId: "869577830290296912", // Use another real Discord ID
//     cooking: false
//   };
  
//   console.log('Testing guest notification...');
//   sendDiscordNotification(guestTestData);
  
//   console.log('Enhanced Discord notification tests completed!');
// }

// /**
//  * Create response with CORS headers
//  */
// // function createResponse(success, message, data = null) {
// //   const response = {
// //     success: success,
// //     message: message
// //   };
  
// //   if (data) {
// //     response.data = data;
// //   }
  
// //   return ContentService
// //     .createTextOutput(JSON.stringify(response))
// //     .setMimeType(ContentService.MimeType.JSON)
// //     .setHeader('Access-Control-Allow-Origin', '*')
// //     .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
// //     .setHeader('Access-Control-Allow-Headers', 'Content-Type');
// // }

// // function createResponse(success, message, data = null) {
// //   const payload = { success, message };
// //   if (data !== null) payload.data = data;

// //   const out = ContentService.createTextOutput(JSON.stringify(payload))
// //               .setMimeType(ContentService.MimeType.JSON);

// //   const res = out.getResponse();                 // ← now an HttpResponse
// //   res.setHeader('Access-Control-Allow-Origin',  '*');
// //   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
// //   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
// //   return res;
// // }

// function createResponse(success, message, data) {
//   const payload = { success, message };
//   if (data !== undefined) payload.data = data;
//   return ContentService.createTextOutput(JSON.stringify(payload))
//           .setMimeType(ContentService.MimeType.JSON);
// }


// /**
//  * Test function to verify setup with corrected structure
//  */
// function testSetup() {
//   try {
//     console.log('Testing CORRECTED Google Apps Script setup...');
    
//     // Test spreadsheet access
//     const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
//     console.log('✓ Spreadsheet access successful');
    
//     // Test sheet access
//     const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.MEMBERS);
//     const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
//     const rsvpsSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RSVPS);
    
//     console.log('✓ All sheets accessible');
    
//     // Test corrected data retrieval
//     const formData = getFormData();
//     console.log('✓ Corrected data retrieval test completed');
    
//     // Test member verification with a known Discord ID
//     const testDiscordId = '385633397378121729'; // Iman's ID from your data
//     const memberExists = verifyMember(testDiscordId);
//     console.log(`✓ Member verification test: ${memberExists ? 'PASS' : 'FAIL'}`);
    
//     console.log('CORRECTED setup test completed successfully!');
//     return true;
//   } catch (error) {
//     console.error('Corrected setup test failed:', error);
//     return false;
//   }
// }

// MANUS 2nD ATTEMPT
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

// /**
//  * Handle POST requests - Clean JSON body parsing
//  */
// function doPost(e) {
//   try {
//     // Parse the JSON body directly (as you originally intended)
//     const formData = JSON.parse(e.postData.contents);
    
//     console.log('📥 Received form data:', formData);
    
//     // Validate the submission
//     const validation = validateSubmission(formData);
//     if (!validation.valid) {
//       return createResponse(false, validation.error);
//     }
    
//     // Check for duplicate recipe claim
//     if (formData.cooking && formData.recipeId) {
//       const isDuplicate = checkDuplicateRecipe(formData.recipeId);
//       if (isDuplicate) {
//         return createResponse(false, 'This recipe has already been claimed. Please choose another one.');
//       }
      
//       // Mark recipe as claimed
//       markRecipeAsClaimed(formData.recipeId, formData.discordId);
//     }
    
//     // Record the RSVP
//     recordRSVP(formData);
    
//     // Send notifications
//     if (CONFIG.DISCORD_WEBHOOK_URL) {
//       sendDiscordNotification(formData);
//     }
    
//     return createResponse(true, 'RSVP submitted successfully');
    
//   } catch (error) {
//     console.error('Error in doPost:', error);
//     return createResponse(false, 'Server error: ' + error.message);
//   }
// }

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

// /**
//  * CORRECTED: Validate form submission data for both members and guests
//  */
// function validateSubmission(formData) {
//   // Common validation for all submissions
//   if (!formData.displayName) {
//     return { valid: false, error: 'Display name is required' };
//   }
  
//   if (formData.cooking === undefined) {
//     return { valid: false, error: 'Cooking preference is required' };
//   }
  
//   if (formData.cooking && !formData.recipeId) {
//     return { valid: false, error: 'Recipe selection is required when cooking' };
//   }
  
//   // Audience-specific validation
//   if (formData.audienceType === 'member') {
//     // Member validation
//     if (!formData.discordId) {
//       return { valid: false, error: 'Discord ID is required for members' };
//     }
    
//     // Verify member exists in Members sheet
//     const memberExists = verifyMember(formData.discordId);
//     if (!memberExists) {
//       return { valid: false, error: 'Invalid member - Discord ID not found in member list' };
//     }
    
//   } else if (formData.audienceType === 'guest') {
//     // Guest validation
//     if (!formData.email) {
//       return { valid: false, error: 'Email is required for guests' };
//     }
    
//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(formData.email)) {
//       return { valid: false, error: 'Please provide a valid email address' };
//     }
    
//   } else {
//     return { valid: false, error: 'Invalid audience type - must be "member" or "guest"' };
//   }
  
//   return { valid: true };
// }

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

// /**
//  * UPDATED: Send notifications based on audience type
//  */
// function sendDiscordNotification(formData) {
//   if (!CONFIG.DISCORD_WEBHOOK_URL) {
//     console.log('Discord webhook not configured, skipping notification');
//     return;
//   }

//   try {
//     /* ---------- existing “content” message ---------- */
//     const userIdentifier = formData.audienceType === 'member'
//       ? `**${formData.displayName}** (Discord member)`
//       : `**${formData.displayName}** (guest)`;

//     let message;
//     if (formData.cooking) {
//       message = `🍽️ ${userIdentifier} has claimed **${formData.recipeName}** for ${CONFIG.EVENT_NAME}!`;
//     } else {
//       message = `👋 ${userIdentifier} is attending ${CONFIG.EVENT_NAME} (not cooking).`;
//     }
//     if (formData.note) {
//       message += `\n💬 Note: ${formData.note}`;
//     }
//     /* ------------------------------------------------- */

//     /* ─── NEW: build an embed with optional Instagram field ─── */
//     const embedFields = [];
//     if (formData.instagramHandle) {             // already validated upstream
//       embedFields.push({
//         name: 'Instagram Handle',
//         value: formData.instagramHandle,
//         inline: true
//       });
//     }

//     const embeds = embedFields.length
//       ? [{ fields: embedFields }]
//       : [];                                      // send no embed when empty
//     /* ───────────────────────────────────────────────────────── */

//     const payload = {
//       content: message,
//       username: 'Recipe Bot',
//       embeds: embeds                             // ← NEW property (can be empty)
//     };

//     const response = UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, {
//       method: 'POST',
//       contentType: 'application/json',
//       payload: JSON.stringify(payload)
//     });

//     console.log('Discord notification sent:', response.getResponseCode());

//   } catch (error) {
//     console.error('Error sending Discord notification:', error);
//   }
// // }
// /**
//  * Send a Discord webhook notification (new concise style)
//  *   • 🍽️ for cooks, 🪑 for guests
//  *   • Mentions the user when we have a Discord-ID; otherwise bolds their name
//  *   • Links recipe title if recordUrl exists
//  *   • Adds IG handle line when provided
//  *   • Notes appear as Markdown block-quote
//  */
// function sendDiscordNotification(formData) {
//   if (!CONFIG.DISCORD_WEBHOOK_URL) {
//     console.log('Discord webhook not configured, skipping notification');
//     return;
//   }

//   try {
//     /* ── 1) Emoji + mention ───────────────────────────── */
//     const emoji   = formData.cooking ? '🍽️' : '🪑';
//     const mention = formData.discordId
//       ? `<@${formData.discordId}>`
//       : `**${formData.displayName}**`;

//     /* ── 2) Base content line ─────────────────────────── */
//     let content;
//     if (formData.cooking) {
//       const link = formData.recordUrl
//         ? `[${formData.recipeName}](${formData.recordUrl})`
//         : `**${formData.recipeName}**`;
//       content = `${emoji} ${mention} is bringing ${link}!`;
//     } else {
//       content = `${emoji} ${mention} will be at the table!`;
//     }

//     /* ── 3) Optional Instagram handle ─────────────────── */
//     if (formData.instagramHandle) {
//       const clean = formData.instagramHandle.replace(/^@/, '');        // drop “@”
//       content += `\n📸 Instagram: [${formData.instagramHandle}](https://instagram.com/${clean})`;
//     }

//     /* ── 4) Optional note as block-quote ──────────────── */
//     const note = (formData.note || '').toString().trim();
//     if (note) {
//       content += `\n> ${note}`;
//     }

//     /* ── 5) Dispatch ─────────────────────────────────── */
//     const payload = { content: content };

//     UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, {
//       method:      'post',
//       contentType: 'application/json',
//       payload:     JSON.stringify(payload)
//     });

//     console.log('Discord notification sent:', content);

//   } catch (err) {
//     console.error('Error sending Discord notification:', err);
//   }
// }
/**
 * Send a Discord webhook notification (concise style, no embeds)
 *  • Links recipe when recordUrl exists
 *  • Clickable IG handle – preview suppressed with SUPPRESS_EMBEDS flag
//  */
// function sendDiscordNotification(formData) {
//   if (!CONFIG.DISCORD_WEBHOOK_URL) {
//     console.log('Discord webhook not configured, skipping notification');
//     return;
//   }

//   try {
//     /* 1️⃣  Emoji + mention (or bold name for guests without Discord-ID) */
//     const emoji = getEmojiForCategory(formData.category);
//     const emoji   = formData.cooking ? '🍽️' : '🥂';
//     const mention = formData.discordId
//       ? `<@${formData.discordId}>`
//       : `**${formData.displayName}**`;

//     /* 2️⃣  Main line */
//     let content;
//     if (formData.cooking) {
//       const link = formData.recordUrl
//         ? `[${formData.recipeName}](${formData.recordUrl})`
//         : `**${formData.recipeName}**`;
//       content = `${emoji} ${mention} is bringing ${link}!`;
//     } else {
//       content = `${emoji} ${mention} will be at the table!`;
//     }

//     /* 3️⃣  Optional Instagram handle */
//     let suppressEmbeds = false;
//     if (formData.instagramHandle) {
//       const clean = formData.instagramHandle.replace(/^@/, '');
//       content += `\n📸 Instagram: [${formData.instagramHandle}](https://instagram.com/${clean})`;
//       suppressEmbeds = true;                         // turn off all previews
//     }

//     /* 4️⃣  Optional note */
//     const note = (formData.note || '').toString().trim();
//     if (note) content += `\n> ${note}`;

//     /* 5️⃣  Assemble payload
//           SUPPRESS_EMBEDS flag = 4  :contentReference[oaicite:0]{index=0} */
//     const payload = suppressEmbeds
//       ? { content: content, flags: 4 }   // 4 = MessageFlags.SUPPRESS_EMBEDS
//       : { content: content };

//     UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, {
//       method:      'post',
//       contentType: 'application/json',
//       payload:     JSON.stringify(payload)
//     });

//     console.log('Discord notification sent:', content);

//   } catch (err) {
//     console.error('Error sending Discord notification:', err);
//   }
// }

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


// function sendDiscordNotification(formData) {
//   if (!CONFIG.DISCORD_WEBHOOK_URL) {
//     console.log('Discord webhook not configured, skipping notification');
//     return;
//   }
  
//   try {
//     let message;
//     const userIdentifier = formData.audienceType === 'member' 
//       ? `**${formData.displayName}** (Discord member)`
//       : `**${formData.displayName}** (guest)`;
    
//     if (formData.cooking) {
//       message = `🍽️ ${userIdentifier} has claimed **${formData.recipeName}** for ${CONFIG.EVENT_NAME}!`;
//     } else {
//       message = `👋 ${userIdentifier} is attending ${CONFIG.EVENT_NAME} (not cooking).`;
//     }
    
//     if (formData.note) {
//       message += `\n💬 Note: ${formData.note}`;
//     }
    
//     const payload = {
//       content: message,
//       username: 'Recipe Bot'
//     };
    
//     const options = {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       payload: JSON.stringify(payload)
//     };
    
//     const response = UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, options);
//     console.log('Discord notification sent:', response.getResponseCode());
    
//   } catch (error) {
//     console.error('Error sending Discord notification:', error);
//   }
// }

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
