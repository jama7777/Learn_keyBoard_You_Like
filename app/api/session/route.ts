import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

/**
 * Cheap session probe used by the client services to decide whether to hit the
 * database-backed API or fall back to the localStorage cache.
 */
export async function GET() {
  const session = await auth();
  const user = session?.user;

  return NextResponse.json({
    user: user
      ? { id: user.id, name: user.name, email: user.email, image: user.image }
      : null,
  });
}
