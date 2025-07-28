import { supabase } from '../lib/supabase'

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          // By explicitly setting scopes, you override the default ('identify email')
          scopes: 'identify', // <-- ADD THIS LINE
          // redirectTo: import.meta.env.VITE_APP_URL,
        },
      })
      if (error) {
        console.error('Error logging in with Discord:', error)
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error)
    }
  }

  return (
    <button onClick={handleLogin} className="btn-discord-login">
      Log in with Discord
    </button>
  )
}
