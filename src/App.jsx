import { Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { EventMenuPage } from './pages/EventMenuPage'
import { RecipesPage } from './pages/RecipesPage'
import { RSVPPage } from './pages/RSVPPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Cookbook Club RSVP & Menu
          </h1>
          <p className="text-muted-foreground">
            Join us for delicious adventures in cooking and community
          </p>
        </header>

        <Navigation />

        <main>
          <Routes>
            <Route path="/" element={<EventMenuPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
            <Route path="/rsvp" element={<RSVPPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App

