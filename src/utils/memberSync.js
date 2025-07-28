import { supabase } from '@/supabaseClient'

/**
 * Links a Discord OAuth session to an existing member record
 * This runs after successful OAuth login
 */
export async function linkUserToMember(session) {
  if (!session?.user) {
    console.error('No session provided to linkUserToMember')
    return null
  }

  const discordId = session.user.user_metadata?.provider_id
  const discordDisplayName = session.user.user_metadata?.full_name
  const authUserId = session.user.id
  const userEmail = session.user.email

  if (!discordId) {
    console.error('No Discord ID found in user metadata')
    return null
  }

  try {
    // First, try to find an existing member record created by the bot
    const { data: existingMember, error: findError } = await supabase
      .from('members')
      .select('*')
      .eq('discord_id', discordId)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 is "not found" - other errors are real problems
      throw findError
    }

    if (existingMember) {
      // Member exists (created by bot) - update with auth info
      const { data, error } = await supabase
        .from('members')
        .update({
          // Update with any new info from OAuth
          discord_display_name: discordDisplayName || existingMember.discord_display_name,
          email: userEmail || existingMember.email,
          // Add a field to link to Supabase auth (you'll need to add this column)
          auth_user_id: authUserId,
        })
        .eq('discord_id', discordId)
        .select()
        .single()

      if (error) throw error
      
      console.log('Successfully linked OAuth session to existing member:', data)
      return data
    } else {
      // Member doesn't exist yet (they haven't joined Discord server)
      // Create a minimal record that will be updated when they join
      const { data, error } = await supabase
        .from('members')
        .insert({
          discord_id: discordId,
          discord_display_name: discordDisplayName,
          email: userEmail,
          auth_user_id: authUserId,
          is_active: false, // They haven't joined the server yet
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      
      console.log('Created preliminary member record:', data)
      return data
    }
  } catch (error) {
    console.error('Error linking user to member:', error)
    return null
  }
}

/**
 * Gets the current user's member record
 */
export async function getCurrentMember(session) {
  if (!session?.user) return null

  const discordId = session.user.user_metadata?.provider_id
  if (!discordId) return null

  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('discord_id', discordId)
      .single()

    if (error) {
      console.error('Error fetching member:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getCurrentMember:', error)
    return null
  }
}