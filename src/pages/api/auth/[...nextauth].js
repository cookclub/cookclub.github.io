// src/pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { SupabaseAdapter } from '@next-auth/supabase-adapter'

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId:     process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: 'identify' } },
    }),
  ],

  // 👇  put schema *inside the same object*
  adapter: SupabaseAdapter({
    url:    process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    schema: 'public',             // ← move it here
  }),

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: 'database' },

  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
