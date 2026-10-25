import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db, dbConfigured } from '@/db';
import { typingStats } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { checkStats, rateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const DB_ERROR = {
  error: 'DATABASE_URL is not set — add the Neon Postgres URL in the Vercel env vars.',
};

const postSchema = z.object({
  lessonId: z.string().min(1).max(100),
  lessonTitle: z.string().min(1).max(200),
  mode: z.string().min(1).max(100),
  wpm: z.number().int().min(0).max(500),
  accuracy: z.number().int().min(0).max(100),
  errors: z.number().int().min(0).max(10000),
  charsTyped: z.number().int().min(0).max(1_000_000),
  durationMs: z.number().int().min(0).max(3_600_000),
});

/**
 * Persists a finished lesson run. The client already computes WPM/accuracy; the
 * server only validates the shape and stores it, so a user cannot write an
 * arbitrary number into their own stats.
 */
export async function POST(request: Request) {
  if (!dbConfigured()) return NextResponse.json(DB_ERROR, { status: 503 });
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

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
    return NextResponse.json({ error: 'Invalid stat payload.' }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  await db.insert(typingStats).values({
    userId,
    lessonId: parsed.lessonId,
    lessonTitle: parsed.lessonTitle,
    mode: parsed.mode,
    wpm: parsed.wpm,
    accuracy: parsed.accuracy,
    errors: parsed.errors,
    charsTyped: parsed.charsTyped,
    durationMs: parsed.durationMs,
  });

  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl) });
}

export async function GET() {
  if (!dbConfigured()) return NextResponse.json(DB_ERROR, { status: 503 });
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const recent = await db
    .select()
    .from(typingStats)
    .where(eq(typingStats.userId, userId))
    // `id` breaks ties: rows written in one statement share a `now()` timestamp.
    .orderBy(desc(typingStats.createdAt), desc(typingStats.id))
    .limit(50);

  const [aggregate] = await db
    .select({
      totalRuns: sql<number>`count(*)::int`,
      bestWpm: sql<number>`coalesce(max(${typingStats.wpm}), 0)::int`,
      avgWpm: sql<number>`coalesce(round(avg(${typingStats.wpm})), 0)::int`,
      avgAccuracy: sql<number>`coalesce(round(avg(${typingStats.accuracy})), 0)::int`,
    })
    .from(typingStats)
    .where(eq(typingStats.userId, userId));

  return NextResponse.json({ recent, aggregate });
}
