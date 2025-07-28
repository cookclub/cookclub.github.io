import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Calendar, Users } from 'lucide-react';
import { getCurrentEvent, getEventRecipes } from '../lib/supabase';
import { getCategoryColor, getCategoryTags } from '../utils/categoryColors';
import { parseISO } from 'date-fns';
import { utcToZonedTime, format as tzFormat } from 'date-fns-tz';

export function RecipesPage() {
  const navigate = useNavigate();
  const [currentEvent, setCurrentEvent] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and view options
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [viewDensity, setViewDensity] = useState('compact'); // 'compact' or 'comfortable'
  const [expandedIngredients, setExpandedIngredients] = useState(new Set());

  // Load event and recipes
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get current event
        const { data: event, error: eventError } = await getCurrentEvent();
        if (eventError) throw eventError;
        
        if (!event) {
          setError('No active event found');
          setLoading(false); // Stop loading if no event
          return;
        }
        
        setCurrentEvent(event);
        
        // Get event-specific recipes
        const { data: eventRecipes, error: recipesError } = await getEventRecipes(event.id);
        if (recipesError) throw recipesError;
        
        setRecipes(eventRecipes);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const categorySet = new Set();
    recipes.forEach(recipe => {
      if (recipe.categories) {
        recipe.categories.forEach(cat => categorySet.add(cat));
      }
    });
    return Array.from(categorySet).sort();
  }, [recipes]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          recipe.recipe_name.toLowerCase().includes(searchLower) ||
          (recipe.ingredients && recipe.ingredients.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategory) {
        if (!recipe.categories || !recipe.categories.includes(selectedCategory)) {
          return false;
        }
      }
      
      // Availability filter
      if (showAvailableOnly && recipe.status !== 'available') {
        return false;
      }
      
      return true;
    });
  }, [recipes, searchTerm, selectedCategory, showAvailableOnly]);

  const handleClaimRecipe = (recipe) => {
    navigate('/rsvp', { state: { preSelectedRecipe: recipe } });
  };

  const toggleIngredients = (recipeId) => {
    const newExpanded = new Set(expandedIngredients);
    if (newExpanded.has(recipeId)) {
      newExpanded.delete(recipeId);
    } else {
      newExpanded.add(recipeId);
    }
    setExpandedIngredients(newExpanded);
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading recipes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Event Context Header - CORRECTED */}
      {currentEvent && (
        <div className="mb-6 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            Showing recipes for:
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {/* FIX: Use event_name instead of title */}
            {currentEvent.event_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {/* FIX: Use robust date-fns formatting with event_datetime */}
            {(currentEvent.event_datetime &&
              tzFormat(
                utcToZonedTime(parseISO(currentEvent.event_datetime), 'America/New_York'),
                "eeee, MMMM d, yyyy 'at' h:mm a zzz",
                { timeZone: 'America/New_York' }
              )) || 'Date not available'}
          </p>
        </div>
      )}

      {/* Sticky Filters Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background min-w-[150px]"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Available Only Toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <button
                type="button"
                onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                className="flex items-center"
              >
                {showAvailableOnly ? (
                  <ToggleRight className="w-5 h-5 text-primary" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              Available only
            </label>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-4">
            {/* Recipe Count */}
            <div className="text-sm text-muted-foreground">
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
            </div>

            {/* Density Toggle */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">View:</span>
              <button
                onClick={() => setViewDensity('compact')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewDensity === 'compact' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setViewDensity('comfortable')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewDensity === 'comfortable' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Comfortable
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <div className="space-y-1">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg text-foreground mb-2">No recipes found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const { visible: visibleCategories, hidden: hiddenCategories } = getCategoryTags(recipe.categories, 3);
            const isIngredientsExpanded = expandedIngredients.has(recipe.recipe_id);
            
            return (
              <div
                key={recipe.recipe_id}
                className={`bg-card border border-border rounded-lg transition-colors hover:bg-muted/30 ${
                  viewDensity === 'compact' ? 'p-3' : 'p-4'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Recipe Title and Categories */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`font-medium text-foreground truncate ${
                        viewDensity === 'compact' ? 'text-sm' : 'text-base'
                      }`}>
                        {recipe.recipe_name}
                      </h3>
                      
                      {/* Page Number */}
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        p. {recipe.page_number}
                      </span>
                    </div>

                    {/* Category Tags */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {visibleCategories.map((category) => {
                        const colors = getCategoryColor(category);
                        return (
                          <span
                            key={category}
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text
                            }}
                          >
                            {category}
                          </span>
                        );
                      })}
                      {hiddenCategories.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +{hiddenCategories.length} more
                        </span>
                      )}
                    </div>

                    {/* Ingredients (expandable) */}
                    {recipe.ingredients && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleIngredients(recipe.recipe_id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isIngredientsExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Hide ingredients
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              {truncateText(recipe.ingredients, 60)}
                            </>
                          )}
                        </button>
                        {isIngredientsExpanded && (
                          <p className="text-xs text-muted-foreground mt-1 pl-4">
                            {recipe.ingredients}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status and Action */}
                  <div className="flex items-center gap-3">
                    {recipe.status === 'claimed' ? (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Claimed by</div>
                        <div className="text-sm font-medium text-foreground">
                          {recipe.claimInfo?.claimedBy || 'Unknown'}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimRecipe(recipe)}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
