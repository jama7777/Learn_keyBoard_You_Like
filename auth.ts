import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';

/**
 * Auth.js v5 config. Providers are listed unconditionally; the callback URLs and
 * credentials are read from env vars, so a missing Google/GitHub key only disables
 * that button in the UI rather than failing the build.
 */
const config: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [Google, GitHub],
  session: { strategy: 'database' },
  pages: { signIn: '/signin' },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
