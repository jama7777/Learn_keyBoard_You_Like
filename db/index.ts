import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

/**
 * Next.js imports every route module at build time to collect its config
 * (`runtime`, `maxDuration`), and Auth.js's DrizzleAdapter needs a real drizzle
 * instance at construction. So this module must NOT throw on import when
 * DATABASE_URL is unset — that breaks `next build` on a fresh host.
 *
 * When the URL is missing we build the client against a placeholder no real
 * deployment can reach; `dbConfigured()` lets routes report the
 * misconfiguration clearly instead of surfacing a confusing connection error.
 */
const url =
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/typemaster-unconfigured';

export const db = drizzle(neon(url), { schema });

/** False when the deployment has no database wired up. */
export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export { schema };
