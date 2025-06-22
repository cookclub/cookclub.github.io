// User-related utility functions

/**
 * Verify that the Discord ID exists in the Users sheet
 */
function verifyMember(discordId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const membersSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.USERS);
    const membersData = membersSheet.getDataRange().getValues();

    for (let i = 1; i < membersData.length; i++) {
      const memberDiscordId = String(membersData[i][COLUMNS.USERS.DISCORD_ID]);
      const status = membersData[i][COLUMNS.USERS.STATUS];

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
