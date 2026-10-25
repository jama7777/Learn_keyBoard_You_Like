import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { generateAIContent, getProvider, AIKeyMissingError } from '@/lib/ai';
import { checkAI, rateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  prompt: z.string().min(1).max(20_000),
  data: z.string().max(25_000_000).optional(),
  mimeType: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  task: z.enum(['lesson', 'grammar', 'file', 'song', 'melody']).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  // Rate limit BEFORE doing any work, so a burst of requests cannot reach the
  // paid model provider.
  const rl = await checkAI(userId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Wait a minute and try again.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } },
    );
  }

  if (!getProvider()) {
    return NextResponse.json(
      { error: 'AI provider is not configured on the server.' },
      { status: 503, headers: rateLimitHeaders(rl) },
    );
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  try {
    const text = await generateAIContent({
      prompt: parsed.prompt,
      data: parsed.data,
      mimeType: parsed.mimeType,
      model: parsed.model,
    });

    return NextResponse.json({ text }, { headers: rateLimitHeaders(rl) });
  } catch (error) {
    if (error instanceof AIKeyMissingError) {
      return NextResponse.json({ error: error.message }, { status: 503, headers: rateLimitHeaders(rl) });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI proxy] generation failed:', message);

    // Upstream rate limiting is the common failure — surface it as 429 so the
    // client can back off rather than showing a generic failure.
    const upstreamLimited = /429|rate limit|quota/i.test(message);
    return NextResponse.json(
      { error: upstreamLimited ? 'The model provider is busy. Try again shortly.' : 'AI generation failed.' },
      { status: upstreamLimited ? 429 : 502, headers: rateLimitHeaders(rl) },
    );
  }
}
