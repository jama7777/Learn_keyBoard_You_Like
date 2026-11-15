import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db, dbConfigured } from '@/db';
import { lessonHistory } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { checkStats, rateLimitHeaders } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/origin-check';

export const runtime = 'nodejs';

const MAX_HISTORY = 50;

/** Reported when the deployment has no database wired up. */
const DB_ERROR = {
  error: 'DATABASE_URL is not set — add the Neon Postgres URL in the Vercel env vars.',
};

/**
 * Replaces services/cloudService.ts and services/historyService.ts. The old
 * "cloud" was a localStorage blob keyed by a username string with an 800 ms
 * simulated delay; this is the same shape of data in a real table, scoped to a
 * signed-in user.
 */

export async function GET() {
  if (!dbConfigured()) return NextResponse.json(DB_ERROR, { status: 503 });
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const items = await db
    .select({ topic: lessonHistory.topic, format: lessonHistory.format, createdAt: lessonHistory.createdAt })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId))
    .orderBy(desc(lessonHistory.createdAt), desc(lessonHistory.id))
    .limit(MAX_HISTORY);

  return NextResponse.json({
    items: items.map((i, index) => ({
      id: `${i.createdAt.getTime()}-${index}`,
      topic: i.topic,
      format: i.format,
      timestamp: i.createdAt.getTime(),
    })),
  });
}

const postSchema = z.object({
  topic: z.string().min(1).max(500),
  format: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  if (!dbConfigured()) return NextResponse.json(DB_ERROR, { status: 503 });
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // CSRF defense-in-depth (SameSite=Lax is the primary control).
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const rl = await checkStats(userId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let parsed;
  try {
    parsed = postSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  // The old code deduped on (topic, format) keeping the newest. The unique index
  // on those columns does that for us; onConflictDoNothing keeps the original row
  // and we then touch it so it sorts first.
  await db
    .insert(lessonHistory)
    .values({ userId, topic: parsed.topic.trim(), format: parsed.format })
    .onConflictDoNothing({ target: [lessonHistory.userId, lessonHistory.topic, lessonHistory.format] });

  await db
    .update(lessonHistory)
    .set({ createdAt: new Date() })
    .where(and(eq(lessonHistory.userId, userId), eq(lessonHistory.topic, parsed.topic.trim())));

  // Trim to the newest MAX_HISTORY rows per user, matching the old slice(0, 50).
  // Delete only the surplus rows, not the whole set.
  const surplus = await db
    .select({ id: lessonHistory.id })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId))
    .orderBy(desc(lessonHistory.createdAt), desc(lessonHistory.id))
    .offset(MAX_HISTORY);

  for (const row of surplus) {
    await db.delete(lessonHistory).where(eq(lessonHistory.id, row.id));
  }

  const items = await db
    .select({ topic: lessonHistory.topic, format: lessonHistory.format, createdAt: lessonHistory.createdAt })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId))
    .orderBy(desc(lessonHistory.createdAt), desc(lessonHistory.id))
    .limit(MAX_HISTORY);

  return NextResponse.json({
    items: items.map((i, index) => ({
      id: `${i.createdAt.getTime()}-${index}`,
      topic: i.topic,
      format: i.format,
      timestamp: i.createdAt.getTime(),
    })),
  });
}

const deleteSchema = z.object({ topic: z.string().min(1).max(500) });

export async function DELETE(request: Request) {
  if (!dbConfigured()) return NextResponse.json(DB_ERROR, { status: 503 });
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // CSRF defense-in-depth (SameSite=Lax is the primary control).
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  let parsed;
  try {
    parsed = deleteSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  await db
    .delete(lessonHistory)
    .where(and(eq(lessonHistory.userId, userId), eq(lessonHistory.topic, parsed.topic)));

  return NextResponse.json({ ok: true });
}
