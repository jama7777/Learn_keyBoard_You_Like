import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

/**
 * Cheap session probe used by the client services to decide whether to hit the
 * database-backed API or fall back to the localStorage cache.
 *
 * Deliberately returns a boolean rather than the user object: the caller only
 * needs truthiness, and shipping name/email/image here widened the PII surface
 * for no benefit.
 */
export async function GET() {
  const session = await auth();

  return NextResponse.json({ signedIn: Boolean(session?.user) });
}
