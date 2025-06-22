// Notification utility functions (Discord, email, etc.)

function getEmojiForCategory(category) {
  switch (category?.toLowerCase()) {
    case 'main':    return '🍽️';
    case 'side':    return '🥗';
    case 'dessert': return '🍰';
    case 'drink':   return '🍹';
    default:        return '🍴';
  }
}

function sendDiscordNotification(formData) {
  if (!CONFIG.DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook not configured, skipping notification');
    return;
  }

  try {
    const mention = formData.discordId
      ? `<@${formData.discordId}>`
      : `**${formData.displayName}**`;

    let content;
    if (formData.cooking) {
      const link = formData.recordUrl
        ? `[${formData.recipeName}](${formData.recordUrl})`
        : formData.recipeName;

      content = `${mention} is bringing ${link}!`;
    } else {
      content = `${mention} will be at the table!`;
    }

    let suppressEmbeds = false;
    if (formData.instagramHandle) {
      const clean = formData.instagramHandle.replace(/^@/, '');
      content += ` <:instagram:1385493882774487181> [@${clean}](https://instagram.com/${clean})`;
      suppressEmbeds = true;
    }

    const note = (formData.note || '').toString().trim();
    if (note) content += `\n> ${note}`;

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

    GmailApp.sendEmail(formData.email, subject, body);
    console.log('Guest email sent to:', formData.email);

  } catch (error) {
    console.error('Error sending guest email:', error);
  }
}
