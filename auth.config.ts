import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const result = await sql`
            SELECT * FROM users WHERE email = ${email}
          `;

          const user = result.rows[0];

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password_hash);

          if (passwordsMatch) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnWatchlists = nextUrl.pathname.startsWith('/watchlists');
      const isOnProperties = nextUrl.pathname.startsWith('/properties');
      const isOnAlerts = nextUrl.pathname.startsWith('/alerts');
      const isOnSettings = nextUrl.pathname.startsWith('/settings');

      const isProtectedRoute = isOnDashboard || isOnWatchlists || isOnProperties || isOnAlerts || isOnSettings;

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
