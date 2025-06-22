// Form validation utility functions

/**
 * Light-weight Instagram handle validator
 *  • must start with "@"
 *  • only letters, numbers, "." or "_"
 *  • 2–30 chars **after** the "@"
 */
function isValidInstagramHandle(handle) {
  const regex = /^@[A-Za-z0-9._]{2,30}$/;
  return regex.test(handle);
}

/**
 * Validate submission for members, guests, and Instagram handle
 */
function validateSubmission(formData) {
  if (!formData.displayName) {
    return { valid: false, error: 'Display name is required' };
  }

  if (formData.cooking === undefined) {
    return { valid: false, error: 'Cooking preference is required' };
  }

  if (formData.cooking && !formData.recipeId) {
    return { valid: false, error: 'Recipe selection is required when cooking' };
  }

  if (formData.audienceType === 'member') {
    if (!formData.discordId) {
      return { valid: false, error: 'Discord ID is required for members' };
    }

    if (!verifyMember(formData.discordId)) {
      return { valid: false, error: 'Invalid member – Discord ID not found in member list' };
    }

  } else if (formData.audienceType === 'guest') {
    // Guests have no extra mandatory fields currently.
  } else {
    return { valid: false, error: 'Invalid audience type – must be "member" or "guest"' };
  }

  if (formData.instagramHandle && !isValidInstagramHandle(formData.instagramHandle)) {
    return {
      valid: false,
      error: 'Invalid Instagram handle format. Please ensure it starts with @ and contains only letters, numbers, periods, or underscores, 2–30 characters long.'
    };
  }

  return { valid: true };
}
