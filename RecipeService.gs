// Recipe and claiming utility functions

/**
 * Check if a recipe is already claimed
 */
function checkDuplicateRecipe(recipeId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const recipesSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.RECIPES);
    if (!recipesSheet) {
      throw new Error('Recipes sheet not found');
    }
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
    if (!recipesSheet) {
      throw new Error('Recipes sheet not found');
    }
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
