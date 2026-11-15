import { NextResponse } from 'next/server';
import { auth, signOut } from '@/auth';
import { db, dbConfigured } from '@/db';
import { auditLog, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isSameOrigin } from '@/lib/origin-check';

export const runtime = 'nodejs';

/**
 * Permanently delete the signed-in user's account and all associated data.
 * Cascades to accounts, sessions, lesson_history, typing_stats (FK onDelete
 * cascade). Interaction sessions are set to null user_id (not deleted) so
 * telemetry aggregates survive for abuse review.
 */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  if (!dbConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = request.headers.get('user-agent')?.slice(0, 500) ?? null;

  try {
    // Write the audit entry first (while the user row still exists for the FK).
    await db.insert(auditLog).values({
      userId,
      event: 'account.delete',
      detail: 'self-service account deletion',
      ip,
      userAgent: ua,
    });

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[account] deletion failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Account deletion failed.' }, { status: 500 });
  }
}