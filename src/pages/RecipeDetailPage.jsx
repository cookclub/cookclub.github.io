import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ChefHat, User, Clock, BookOpen } from 'lucide-react'

export function RecipeDetailPage() {
  const { recipeId } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [claimedBy, setClaimedBy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadRecipe() {
      try {
        setLoading(true)
        
        // Get recipe details
        const { data: recipeData, error: recipeError } = await supabase
          
          .from('recipes')
          .select('*')
          .eq('recipe_id', recipeId)
          .single()

        if (recipeError) throw recipeError

        // Check if recipe is claimed
        const { data: claimData, error: claimError } = await supabase
          
          .from('event_recipe_claims')
          .select(`
            members (first_name)
          `)
          .eq('recipe_id', recipeId)
          .single()

        if (claimError && claimError.code !== 'PGRST116') {
          throw claimError
        }

        setRecipe(recipeData)
        setClaimedBy(claimData?.members?.first_name || null)
      } catch (err) {
        console.error('Error loading recipe:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (recipeId) {
      loadRecipe()
    }
  }, [recipeId])

  const handleClaimRecipe = () => {
    navigate('/rsvp', { state: { selectedRecipe: recipe } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">
          {error || 'Recipe not found'}
        </p>
        <Link
          to="/recipes"
          className="inline-flex items-center text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Recipes
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/recipes"
          className="inline-flex items-center text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Recipes
        </Link>
        
        {!claimedBy && (
          <button
            onClick={handleClaimRecipe}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Claim This Recipe
          </button>
        )}
      </div>

      {/* Recipe Details */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {recipe.recipe_name}
            </h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>Page {recipe.page_number}</span>
              </div>
              {claimedBy && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  <span>Claimed by {claimedBy}</span>
                </div>
              )}
            </div>
          </div>
          
          {claimedBy ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
              Claimed
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Available
            </span>
          )}
        </div>

        {/* Categories */}
        {recipe.categories && recipe.categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.categories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Ingredients</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <ul className="space-y-1">
              {recipe.ingredients_list.split('\n').filter(ingredient => ingredient.trim()).map((ingredient, index) => (
                <li key={index} className="text-foreground">
                  • {ingredient.trim()}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Accompaniments */}
        {recipe.accompaniments && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Suggested Accompaniments</h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-foreground">{recipe.accompaniments}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!claimedBy && (
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleClaimRecipe}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              <ChefHat className="w-5 h-5 mr-2" />
              Claim This Recipe & RSVP
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

