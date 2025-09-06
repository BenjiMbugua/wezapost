import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import TwitterProvider from 'next-auth/providers/twitter'
import LinkedInProvider from 'next-auth/providers/linkedin'
import FacebookProvider from 'next-auth/providers/facebook'
import jwt from 'jsonwebtoken'

export const authOptions: NextAuthOptions = {
  // Remove Supabase adapter temporarily to allow OAuth to work
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // }),
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  jwt: {
    encode: async ({ secret, token }) => {
      const encodedToken = jwt.sign(token!, secret, {
        algorithm: 'HS256',
      })
      return encodedToken
    },
    decode: async ({ secret, token }) => {
      const decodedToken = jwt.verify(token!, secret, {
        algorithms: ['HS256'],
      })
      return decodedToken as any
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Get the Supabase UUID for this user based on email
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', session.user.email)
            .single()

          if (profile) {
            session.user.id = profile.id // Use the Supabase UUID
          } else {
            session.user.id = token.sub as string // Fallback to OAuth ID
          }
        } catch (error) {
          console.error('Error getting user UUID from Supabase:', error)
          session.user.id = token.sub as string // Fallback to OAuth ID
        }
        
        session.accessToken = token.accessToken as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('User signed in:', user.email, user.name)
      
      try {
        // Create or update user profile in Supabase
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Check if user profile already exists using OAuth ID
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!existingProfile) {
          // Create new profile with UUID
          const { data: newProfile, error } = await supabase
            .from('profiles')
            .insert([
              {
                id: crypto.randomUUID(), // Generate a proper UUID
                email: user.email!,
                full_name: user.name,
                avatar_url: user.image,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select('id')
            .single()

          if (error) {
            console.error('Error creating user profile:', error)
            // Still allow sign in even if profile creation fails
          } else {
            console.log('Created new user profile with UUID:', newProfile?.id)
          }
        } else {
          console.log('User profile already exists with UUID:', existingProfile.id)
        }
        
      } catch (error) {
        console.error('Error in signIn callback:', error)
        // Don't block sign-in if profile creation fails
      }
      
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  
  interface User {
    id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    sub: string
  }
}