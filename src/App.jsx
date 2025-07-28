import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { EventMenuPage } from './pages/EventMenuPage';
import { RecipesPage } from './pages/RecipesPage';
import { RSVPPage } from './pages/RSVPPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import LoginButton from './components/LoginButton';
import { linkUserToMember, getCurrentMember } from './utils/memberSync';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const memberData = await getCurrentMember(session);
        setMember(memberData);
      }

      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          const memberData = await linkUserToMember(session);
          setMember(memberData);
        } else if (event === 'SIGNED_OUT') {
          setMember(null);
        }
      });

      return () => subscription.unsubscribe();
    };

    const cleanupPromise = initializeSession();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
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
  );
}

export default App;
