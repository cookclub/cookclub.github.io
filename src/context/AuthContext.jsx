// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase'; // Adjust path if needed

// 1. Create the context
const AuthContext = createContext();

// 2. Create the provider component
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null); // This will hold our 'members' table data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function fetches the corresponding 'members' table record for the authenticated user
    const fetchMemberProfile = async (userId) => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId) // Find the member by their Supabase auth ID
        .single();

      if (error) {
        console.error('Error fetching member profile:', error);
      }
      setMember(data);
    };

    // Check for an initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMemberProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchMemberProfile(session.user.id);
        } else {
          setMember(null); // Clear member profile on logout
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    member, // Expose our member data
    loading,
    login: () => supabase.auth.signInWithOAuth({ provider: 'discord', options: { scopes: 'identify' } }),
    logout: () => supabase.auth.signOut(),
  };

  // Don't render the app until we've checked for a session
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 3. Create a custom hook for easy consumption
export function useAuth() {
  return useContext(AuthContext);
}
