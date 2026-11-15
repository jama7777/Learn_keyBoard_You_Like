import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db, dbConfigured } from '@/db';
import { interactionSessions } from '@/db/schema';
import { checkStats, rateLimitHeaders } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/origin-check';
import { scoreEvents, isBotUserAgent } from '@/lib/bot-detect';

export const runtime = 'nodejs';

const eventSchema = z.object({
  t: z.number(),
  type: z.enum(['key', 'click', 'move', 'scroll', 'visibility', 'focus', 'blur']),
  trusted: z.boolean().optional(),
  keyGap: z.number().optional(),
});

const bodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  events: z.array(eventSchema).max(500),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const rl = await checkStats();
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  const ua = request.headers.get('user-agent');
  const result = scoreEvents(parsed.events, ua);

  // Best-effort persistence — never block the response on the DB.
  if (dbConfigured()) {
    try {
      const session = await auth();
      await db.insert(interactionSessions).values({
        sessionId: parsed.sessionId,
        userId: session?.user?.id ?? null,
        score: result.score,
        classification: result.classification,
        uaBot: result.signals.uaBot ? 1 : 0,
        eventCount: result.signals.eventCount,
        keyCount: result.signals.keyCount,
        mouseMoves: result.signals.mouseMoves,
        scrolls: result.signals.scrolls,
        spanMs: result.signals.spanMs,
        userAgent: ua?.slice(0, 500) ?? null,
      });
    } catch (err) {
      console.error('[telemetry] persist failed:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json(
    { score: result.score, classification: result.classification, signals: result.signals },
    { headers: rateLimitHeaders(rl) },
  );
}

export async function GET() {
  // Quick health probe so the client can check the endpoint exists.
  return NextResponse.json({ ok: true, botUaDetected: isBotUserAgent(null) });
}