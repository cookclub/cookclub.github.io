import { createClient } from '@supabase/supabase-js'

// --- ADD THIS FOR DEBUGGING ---
console.log("Supabase URL from env:", import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key from env is present:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
// -----------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Get the current event (upcoming or most recent past event)
export async function getCurrentEvent() {
  try {
    // First try to get upcoming events
    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from('events')
      .select('*')
      .gte('event_datetime', new Date().toISOString())
      .order('event_datetime', { ascending: true })
      .limit(1)

    if (upcomingError) throw upcomingError

    let selectedEvent = upcomingEvents?.[0]

    // If no upcoming events, get the most recent past event
    if (!selectedEvent) {
      const { data: pastEvents, error: pastError } = await supabase
        .from('events')
        .select('*')
        .lt('event_datetime', new Date().toISOString())
        .order('event_datetime', { ascending: false })
        .limit(1)

      if (pastError) throw pastError
      selectedEvent = pastEvents?.[0]
    }

    if (!selectedEvent) {
      return { data: null, error: null }
    }

    // Get the cookbook information separately
    const { data: cookbook, error: cookbookError } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('cookbook_id', selectedEvent.featured_cookbook_id)
      .single()

    if (cookbookError) {
      console.warn('Could not load cookbook:', cookbookError)
    }

    return {
      data: {
        id: selectedEvent.event_id,
        event_name: `Cookbook Club: ${cookbook?.title || 'Event'}`,
        event_datetime: selectedEvent.event_datetime,
        event_time: selectedEvent.event_time,
        location: selectedEvent.location,
        status: selectedEvent.event_status,
        description: selectedEvent.notes,
        cookbook_title: cookbook?.title,
        cookbook_author: cookbook?.author,
        cookbook_cover_url: cookbook?.cover_image_url
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching current event:', error)
    return { data: null, error }
  }
}

// Get event-specific recipes with claim status
export async function getEventRecipes(eventId) {
  try {
    // First get the event to find the featured cookbook
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('featured_cookbook_id')
      .eq('event_id', eventId)
      .single()

    if (eventError) throw eventError

    // Get all recipes for the featured cookbook
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('cookbook_id', event.featured_cookbook_id)

    if (recipesError) throw recipesError

    // Get claimed recipes with member info
    const { data: claimedRecipes, error: claimedError } = await supabase
      .from('event_recipe_claims')
      .select(`
        recipe_id,
        dish_notes,
        date_claimed,
        members (
          first_name
        )
      `)
      .eq('event_id', eventId)

    if (claimedError) throw claimedError

    // Create a map of claimed recipes
    const claimedMap = new Map()
    claimedRecipes.forEach(claim => {
      claimedMap.set(claim.recipe_id, {
        claimedBy: claim.members?.first_name || 'Unknown',
        notes: claim.dish_notes,
        dateClaimed: claim.date_claimed
      })
    })

    // Combine the data
    const recipesWithStatus = recipes.map(recipe => {
      const claimInfo = claimedMap.get(recipe.recipe_id)
      return {
        ...recipe,
        // Map database column names to expected names
        ingredients: recipe.ingredients_list,
        categories: recipe.categories || [],
        status: claimInfo ? 'claimed' : 'available',
        claimInfo: claimInfo || null
      }
    })

    return { data: recipesWithStatus, error: null }
  } catch (error) {
    console.error('Error fetching event recipes:', error)
    return { data: [], error }
  }
}

// Get menu for a specific event (claimed recipes only)
export async function getEventMenu(eventId) {
  try {
    const { data: recipes, error } = await getEventRecipes(eventId)
    if (error) throw error

    // Filter to only claimed recipes and group by category
    const claimedRecipes = recipes.filter(recipe => recipe.status === 'claimed')
    
    const groupedRecipes = claimedRecipes.reduce((groups, recipe) => {
      const categories = recipe.categories || ['Other']
      const primaryCategory = categories[0] || 'Other'
      
      if (!groups[primaryCategory]) {
        groups[primaryCategory] = []
      }
      groups[primaryCategory].push(recipe)
      return groups
    }, {})

    return { data: groupedRecipes, error: null }
  } catch (error) {
    console.error('Error fetching event menu:', error)
    return { data: {}, error }
  }
}

// Submit RSVP (existing function)
export async function submitRSVP(eventId, memberData, recipeId = null, dishNotes = '') {
  try {
    // Implementation for RSVP submission
    // This would handle creating member records, event attendees, and recipe claims
    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Error submitting RSVP:', error)
    return { data: null, error }
  }
}

