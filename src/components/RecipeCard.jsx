import { useState } from 'react'
import { ChevronDown, ChevronRight, User, BookOpen } from 'lucide-react'

// Category color mapping using CSS custom properties
const getCategoryColor = (category) => {
  const categoryMap = {
    'main courses': 'var(--chart-1)', // Terracotta
    'main course': 'var(--chart-1)',
    'mains': 'var(--chart-1)',
    'side dishes': 'var(--chart-2)', // Green
    'sides': 'var(--chart-2)',
    'side dish': 'var(--chart-2)',
    'desserts': 'var(--chart-3)', // Orange
    'dessert': 'var(--chart-3)',
    'appetizers': 'var(--chart-4)', // Purple
    'appetizer': 'var(--chart-4)',
    'apps': 'var(--chart-4)',
    'beverages': 'var(--chart-5)', // Blue
    'drinks': 'var(--chart-5)',
    'beverage': 'var(--chart-5)'
  }
  
  const normalizedCategory = category?.toLowerCase() || ''
  return categoryMap[normalizedCategory] || 'var(--chart-1)' // Default to terracotta
}

export function RecipeCard({ recipe, memberName }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const categoryColor = getCategoryColor(recipe.category)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Category color bar */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: categoryColor }}
      />
      
      {/* Main card content */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg leading-tight mb-1">
              {recipe.recipe_name}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="w-3 h-3 mr-1" />
              <span>Brought by {memberName}</span>
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: categoryColor }} />
                Ingredients
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 mr-2 flex-shrink-0" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accompaniments */}
          {recipe.accompaniments && recipe.accompaniments.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Goes well with:</h4>
              <div className="flex flex-wrap gap-2">
                {recipe.accompaniments.map((accompaniment, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                  >
                    {accompaniment}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Page number */}
          {recipe.page_number && (
            <div className="flex items-center text-sm text-muted-foreground pt-2 border-t border-border">
              <BookOpen className="w-4 h-4 mr-2" />
              <span>Find it on page {recipe.page_number}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

