import 'server-only';
import { cache } from 'react';
import { auth } from '@/auth';

/**
 * Server-only session lookup. Wrapped in React's `cache()` so a single request
 * that calls it from several components only hits the database once.
 */
export const getSession = cache(async () => {
  return auth();
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>['user'];
