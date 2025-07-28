import { supabase } from '@/supabaseClient'

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          // This URL must match the one configured in your Supabase dashboard
          redirectTo: import.meta.env.VITE_APP_URL,
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
