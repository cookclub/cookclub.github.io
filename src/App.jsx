import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { EventMenuPage } from './pages/EventMenuPage'
import { RecipesPage } from './pages/RecipesPage'
import { RSVPPage } from './pages/RSVPPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import LoginButton from './components/LoginButton'
import { linkUserToMember, getCurrentMember } from './utils/memberSync' // Add this import
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState(null) // Add this state for member data

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      
      // If user is logged in, get their member record
      if (session) {
        const memberData = await getCurrentMember(session)
        setMember(memberData)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      
      if (event === 'SIGNED_IN' && session) {
        // User just logged in - link them to their member record
        const memberData = await linkUserToMember(session)
        setMember(memberData)
      } else if (event === 'SIGNED_OUT') {
        // User logged out - clear member data
        setMember(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Cookbook Club RSVP & Menu
          </h1>
          {session ? (
            <p className="text-muted-foreground">
              Welcome, {member?.discord_display_name || session.user.user_metadata.full_name || session.user.email}!
            </p>
          ) : (
            <p className="text-muted-foreground">
              Join us for delicious adventures in cooking and community
            </p>
          )}
        </header>

        <Navigation />

        {!session && (
          <div className="text-center my-4">
            <LoginButton />
          </div>
        )}

        <main>
          <Routes>
            <Route path="/" element={<EventMenuPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:recipeId" element={<RecipeDetailPage session={session} member={member} />} />
            <Route path="/rsvp" element={<RSVPPage session={session} member={member} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App