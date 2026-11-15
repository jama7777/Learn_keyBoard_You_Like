import 'server-only';

/**
 * Cheap, dependency-free bot signals. These are HEURISTICS, not proof —
 * combine several before acting on a classification (see app/api/telemetry).
 */

const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl\//i,
  /wget/i,
  /python-requests/i,
  /httpclient/i,
  /headless/i,
  /phantom/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /chrome-lighthouse/i,
];

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true; // no UA at all is suspicious
  return BOT_UA_PATTERNS.some((p) => p.test(ua));
}

export type TelemetryEvent = {
  t: number;
  type: 'key' | 'click' | 'move' | 'scroll' | 'visibility' | 'focus' | 'blur';
  trusted?: boolean;
  keyGap?: number;
};

export type ScoreResult = {
  score: number; // 0..100, higher = more likely bot
  classification: 'likely-human' | 'uncertain' | 'likely-bot';
  signals: {
    uaBot: boolean;
    trustedFalse: number;
    keyCount: number;
    keyGapStdMs: number | null;
    mouseMoves: number;
    scrolls: number;
    eventCount: number;
    spanMs: number;
    zeroInteraction: boolean;
  };
};

function std(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function scoreEvents(
  events: TelemetryEvent[],
  userAgent: string | null,
): ScoreResult {
  const uaBot = isBotUserAgent(userAgent);

  const keys = events.filter((e) => e.type === 'key');
  const gaps = keys.map((e) => e.keyGap).filter((g): g is number => typeof g === 'number');
  const keyGapStd = gaps.length >= 3 ? std(gaps) : null;

  const trustedFalse = events.filter((e) => e.trusted === false).length;
  const mouseMoves = events.filter((e) => e.type === 'move').length;
  const scrolls = events.filter((e) => e.type === 'scroll').length;
  const times = events.map((e) => e.t).filter((n) => Number.isFinite(n));
  const spanMs = times.length >= 2 ? Math.max(...times) - Math.min(...times) : 0;
  const zeroInteraction = events.length === 0;

  let score = 0;
  if (uaBot) score += 40;
  if (trustedFalse > 0) score += Math.min(20, trustedFalse * 5);
  if (keys.length >= 5 && keyGapStd !== null && keyGapStd < 15) score += 30;
  if (keys.length >= 3 && mouseMoves === 0) score += 20;
  if (zeroInteraction) score += 25;
  if (events.length > 5 && spanMs < 200) score += 10;
  if (events.length > 0 && mouseMoves === 0 && scrolls === 0 && keys.length === 0) score += 15;

  score = Math.min(100, Math.max(0, score));

  const classification: ScoreResult['classification'] =
    score >= 60 ? 'likely-bot' : score >= 30 ? 'uncertain' : 'likely-human';

  return {
    score,
    classification,
    signals: {
      uaBot,
      trustedFalse,
      keyCount: keys.length,
      keyGapStdMs: keyGapStd,
      mouseMoves,
      scrolls,
      eventCount: events.length,
      spanMs,
      zeroInteraction,
    },
  };
}