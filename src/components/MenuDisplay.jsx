import { useState, useEffect } from 'react'
import { getEventMenu } from '../lib/supabase'
import { RecipeCard } from './RecipeCard'
import { Utensils, AlertCircle, Loader2 } from 'lucide-react'

export function MenuDisplay({ eventId, onMenuUpdate }) {
  const [menuData, setMenuData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    async function loadMenu() {
      try {
        setLoading(true)
        setError(null)
        const { data, error: menuError } = await getEventMenu(eventId)
        if (menuError) {
          throw new Error(menuError.message || 'Failed to load menu')
        }
        setMenuData(data)
        
        // Notify parent component of menu update (for live updates after RSVP)
        if (onMenuUpdate) {
          onMenuUpdate(data)
        }
      } catch (err) {
        console.error('Failed to load menu:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [eventId, onMenuUpdate])

  // Sort categories for consistent display
  const sortedCategories = Object.keys(menuData).sort((a, b) => {
    const categoryOrder = ['appetizers', 'main courses', 'side dishes', 'desserts', 'beverages']
    const aIndex = categoryOrder.findIndex(cat => a.toLowerCase().includes(cat))
    const bIndex = categoryOrder.findIndex(cat => b.toLowerCase().includes(cat))
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })

  // Calculate total dishes
  const totalDishes = Object.values(menuData).reduce((total, recipes) => total + recipes.length, 0)

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Utensils className="w-5 h-5 mr-2" />
          Menu in Progress
        </h3>
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading menu...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Utensils className="w-5 h-5 mr-2" />
          Menu in Progress
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center text-destructive">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Failed to load menu: {error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (totalDishes === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Utensils className="w-5 h-5 mr-2" />
          Menu in Progress
        </h3>
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="text-center text-muted-foreground">
            <Utensils className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No dishes claimed yet!</p>
            <p className="text-sm">Be the first to RSVP and claim a recipe below.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground flex items-center">
          <Utensils className="w-5 h-5 mr-2" />
          Menu in Progress
        </h3>
        <span className="text-sm text-muted-foreground">
          {totalDishes} {totalDishes === 1 ? 'dish' : 'dishes'} claimed
        </span>
      </div>

      <div className="space-y-6">
        {sortedCategories.map(category => (
          <div key={category}>
            <h4 className="text-lg font-medium text-foreground mb-3 capitalize">
              {category}
            </h4>
            <div className="space-y-3">
              {menuData[category].map((recipe, index) => (
                <RecipeCard
                  key={`${category}-${index}`}
                  recipe={recipe}
                  memberName={recipe.claimInfo?.claimedBy || 'Unknown'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

