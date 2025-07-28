import { useState, useEffect } from 'react'
// import { getEventMenu } from '../lib/supabase'
import { RecipeCard } from './RecipeCard'
import { Utensils, AlertCircle, Loader2 } from 'lucide-react'

export function MenuDisplay({ eventId, onMenuUpdate }) {
  const [menuData, setMenuData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    // For testing Phase 2, use sample menu data
    async function loadSampleMenu() {
      try {
        setLoading(true)
        setError(null)
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Sample menu data
        const sampleData = [
          {
            recipes: {
              id: 1,
              recipe_name: "Classic Beef Stew",
              category: "main courses",
              ingredients: ["2 lbs beef chuck", "4 carrots, chopped", "3 potatoes, cubed", "1 onion, diced", "2 cups beef broth", "2 tbsp tomato paste"],
              accompaniments: ["Crusty bread", "Red wine"],
              page_number: 142
            },
            members: { first_name: "Sarah" }
          },
          {
            recipes: {
              id: 2,
              recipe_name: "Honey Glazed Carrots",
              category: "side dishes",
              ingredients: ["1 lb baby carrots", "3 tbsp honey", "2 tbsp butter", "1 tsp thyme", "Salt and pepper"],
              accompaniments: ["Roasted meats"],
              page_number: 89
            },
            members: { first_name: "Mike" }
          },
          {
            recipes: {
              id: 3,
              recipe_name: "Apple Crisp",
              category: "desserts",
              ingredients: ["6 apples, sliced", "1 cup oats", "1/2 cup flour", "1/2 cup brown sugar", "1/4 cup butter", "1 tsp cinnamon"],
              accompaniments: ["Vanilla ice cream", "Whipped cream"],
              page_number: 234
            },
            members: { first_name: "Emma" }
          },
          {
            recipes: {
              id: 4,
              recipe_name: "Spinach and Artichoke Dip",
              category: "appetizers",
              ingredients: ["1 bag spinach", "1 can artichokes", "8 oz cream cheese", "1/2 cup mayo", "1/2 cup parmesan", "2 cloves garlic"],
              accompaniments: ["Tortilla chips", "Baguette slices"],
              page_number: 45
            },
            members: { first_name: "Alex" }
          }
        ]
        
        setMenuData(sampleData)
        
        // Notify parent component of menu update
        if (onMenuUpdate) {
          onMenuUpdate(sampleData)
        }
      } catch (err) {
        console.error('Failed to load menu:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadSampleMenu()
  }, [eventId, onMenuUpdate])

  // Group recipes by category
  const groupedRecipes = menuData.reduce((groups, item) => {
    const category = item.recipes?.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push({
      recipe: item.recipes,
      memberName: item.members?.first_name || 'Unknown'
    })
    return groups
  }, {})

  // Sort categories for consistent display
  const sortedCategories = Object.keys(groupedRecipes).sort((a, b) => {
    const categoryOrder = ['appetizers', 'main courses', 'side dishes', 'desserts', 'beverages']
    const aIndex = categoryOrder.findIndex(cat => a.toLowerCase().includes(cat))
    const bIndex = categoryOrder.findIndex(cat => b.toLowerCase().includes(cat))
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })

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

  if (menuData.length === 0) {
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
          {menuData.length} {menuData.length === 1 ? 'dish' : 'dishes'} claimed
        </span>
      </div>

      <div className="space-y-6">
        {sortedCategories.map(category => (
          <div key={category}>
            <h4 className="text-lg font-medium text-foreground mb-3 capitalize">
              {category}
            </h4>
            <div className="space-y-3">
              {groupedRecipes[category].map((item, index) => (
                <RecipeCard
                  key={`${category}-${index}`}
                  recipe={item.recipe}
                  memberName={item.memberName}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

