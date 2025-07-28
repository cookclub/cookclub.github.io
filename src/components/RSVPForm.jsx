import { useState, useEffect } from 'react'
import { User, Mail, MessageSquare, ChefHat, Loader2 } from 'lucide-react'
import { getAvailableRecipes, submitRSVP } from '../lib/supabase'

export function RSVPForm({ eventId, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    discord_id: ''
  })
  const [selectedRecipe, setSelectedRecipe] = useState('')
  const [dishNotes, setDishNotes] = useState('')
  const [availableRecipes, setAvailableRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // 1: Personal Info, 2: Recipe Selection

  // Load available recipes when component mounts
  useEffect(() => {
    async function loadRecipes() {
      try {
        setLoadingRecipes(true)
        const recipes = await getAvailableRecipes(eventId)
        setAvailableRecipes(recipes)
      } catch (err) {
        setError('Failed to load available recipes: ' + err.message)
      } finally {
        setLoadingRecipes(false)
      }
    }
    
    if (eventId) {
      loadRecipes()
    }
  }, [eventId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await submitRSVP(eventId, formData, selectedRecipe, dishNotes)
      const selectedRecipeData = availableRecipes.find(r => r.id === selectedRecipe)
      onSuccess(formData.first_name, selectedRecipeData?.recipe_name || 'Unknown Recipe')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = formData.first_name.trim() && (formData.email.trim() || formData.discord_id.trim())

  if (loadingRecipes) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-foreground mb-6">
          RSVP for This Event
        </h3>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading available recipes...
        </div>
      </div>
    )
  }

  if (availableRecipes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-foreground mb-6">
          RSVP for This Event
        </h3>
        <div className="text-center py-8">
          <ChefHat className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg text-foreground mb-2">All recipes have been claimed!</p>
          <p className="text-sm text-muted-foreground">
            Check back later in case someone changes their mind, or contact the organizer about bringing a side dish.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-xl font-semibold text-foreground mb-6">
        RSVP for This Event
      </h3>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                placeholder="Your first name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Discord ID (Preferred for privacy)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={formData.discord_id}
                onChange={(e) => setFormData({...formData, discord_id: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                placeholder="@username or User#1234"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              We prefer Discord IDs for member privacy
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email (Alternative contact)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                placeholder="your.email@example.com"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only needed if you don't provide Discord ID
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedToStep2}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Recipe Selection
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Choose Your Recipe *
            </label>
            <select
              required
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
              className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            >
              <option value="">Select a recipe...</option>
              {availableRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.recipe_name} (Page {recipe.page_number}) - {recipe.category}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {availableRecipes.length} recipe{availableRecipes.length !== 1 ? 's' : ''} still available
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dish Notes (Optional)
            </label>
            <textarea
              value={dishNotes}
              onChange={(e) => setDishNotes(e.target.value)}
              className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              rows={3}
              placeholder="Any modifications, dietary notes, or special preparations..."
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg hover:bg-muted/80 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRecipe}
              className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Claim Recipe & RSVP
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

