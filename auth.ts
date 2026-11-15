import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { accounts, sessions, users, verificationTokens } from '@/db/schema';

/**
 * Auth.js v5 config. Providers are listed unconditionally; the callback URLs and
 * credentials are read from env vars, so a missing Google/GitHub key only disables
 * that button in the UI rather than failing the build.
 *
 * The adapter is passed our schema explicitly. @auth/drizzle-adapter resolves its
 * tables by the keys `usersTable` / `accountsTable` / ... on the object it is given;
 * db/schema.ts exports them as `users` / `accounts` / ..., so without this mapping
 * the adapter silently falls back to its own hardcoded singular tables
 * (`user`, `account`, `session`, `verificationToken`) and every auth query fails
 * with Postgres 42P01 (undefined table).
 */
const config: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      // Google verifies email addresses, so linking by email is safe: a user who
      // signed up with GitHub can later sign in with Google (or vice versa) without
      // hitting OAuthAccountNotLinked. Without this, the second provider always fails.
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      // GitHub verifies email addresses too. Same reasoning as Google.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
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
