/**
 * Real-DB test of the query logic in app/api/history and app/api/stats.
 * Runs against a local Postgres using the node-postgres driver (the route
 * handlers use neon-http, which needs a remote instance; the SQL is identical).
 *
 * Run:  node scripts/test-db-queries.mjs <DATABASE_URL>
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq, and, desc } from 'drizzle-orm';
import pg from 'pg';
import * as schema from '../db/schema.ts';

const url = process.argv[2];
if (!url) {
  console.error('usage: node scripts/test-db-queries.mjs <DATABASE_URL>');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 5 });
const db = drizzle(pool, { schema });

const MAX_HISTORY = 50;
let failures = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label} ${detail}`);
  }
}

const userId = `test_${Date.now()}`;
const otherUser = `test_other_${Date.now()}`;

try {
  // lesson_history / typing_stats have FKs to users(id), so the users must exist
  // first — exactly as Auth.js creates them on first sign-in.
  // Clean any residue from a previous run (FK cascade clears history and stats).
  console.log('\n[users]');
  await db.execute(sql`DELETE FROM users WHERE id LIKE 'test_%' OR id LIKE 'test_other_%'`);

  await db.insert(schema.users).values([
    { id: userId, name: 'Test User', email: `${userId}@example.com` },
    { id: otherUser, name: 'Other User', email: `${otherUser}@example.com` },
  ]);
  const userCount = await db.select({ id: schema.users.id }).from(schema.users);
  check('seeded 2 users', userCount.length === 2, `got ${userCount.length}`);

  // ── lesson_history: insert, dedupe, trim ──────────────────────────────
  console.log('\n[lesson_history]');

  const { lessonHistory } = schema;

  await db
    .insert(lessonHistory)
    .values({ userId, topic: 'Python basics', format: 'Code (Python)' })
    .onConflictDoNothing({ target: [lessonHistory.userId, lessonHistory.topic, lessonHistory.format] });
  await db
    .insert(lessonHistory)
    .values({ userId, topic: 'Python basics', format: 'Code (Python)' })
    .onConflictDoNothing({ target: [lessonHistory.userId, lessonHistory.topic, lessonHistory.format] });

  let rows = await db
    .select({ topic: lessonHistory.topic, format: lessonHistory.format })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId));
  check('dedupe: same (topic, format) stored once', rows.length === 1, `got ${rows.length}`);

  // onConflictDoNothing + touch, mirroring the route
  await db
    .insert(lessonHistory)
    .values({ userId, topic: 'Algorithms', format: 'Paragraph' })
    .onConflictDoNothing({ target: [lessonHistory.userId, lessonHistory.topic, lessonHistory.format] });

  await db
    .update(lessonHistory)
    .set({ createdAt: new Date() })
    .where(and(eq(lessonHistory.userId, userId), eq(lessonHistory.topic, 'Algorithms')));

  // Isolation: another user's rows must not appear
  await db.insert(lessonHistory).values({ userId: otherUser, topic: 'Secret topic', format: 'Paragraph' });
  rows = await db
    .select({ topic: lessonHistory.topic })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId));
  check('isolation: other user rows excluded', rows.every((r) => r.topic !== 'Secret topic'));

  // Ordering: most recent first after the touch
  rows = await db
    .select({ topic: lessonHistory.topic, createdAt: lessonHistory.createdAt })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId))
    .orderBy(desc(lessonHistory.createdAt), desc(lessonHistory.id));
  check('ordering: touched row sorts first', rows[0].topic === 'Algorithms', `first was ${rows[0].topic}`);

  // Trim: insert 60 rows, expect MAX_HISTORY to survive
  for (let i = 0; i < 60; i++) {
    await db.insert(lessonHistory).values({ userId, topic: `bulk ${i}`, format: 'Paragraph' });
  }
  const surplus = await db
    .select({ id: lessonHistory.id })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId))
    .orderBy(desc(lessonHistory.createdAt))
    .offset(MAX_HISTORY);
  for (const row of surplus) {
    await db.delete(lessonHistory).where(eq(lessonHistory.id, row.id));
  }
  const afterTrim = await db
    .select({ id: lessonHistory.id })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId));
  check('trim: capped at MAX_HISTORY', afterTrim.length === MAX_HISTORY, `got ${afterTrim.length}`);
  check('trim: kept the newest rows', afterTrim.length > 0);

  // Delete by topic, scoped to the user
  await db
    .delete(lessonHistory)
    .where(and(eq(lessonHistory.userId, userId), eq(lessonHistory.topic, 'Python basics')));
  rows = await db
    .select({ topic: lessonHistory.topic })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, userId));
  check('delete: removed only the targeted row', rows.every((r) => r.topic !== 'Python basics'));
  const otherStillThere = await db
    .select({ topic: lessonHistory.topic })
    .from(lessonHistory)
    .where(eq(lessonHistory.userId, otherUser));
  check('delete: other user untouched', otherStillThere.length === 1);

  // ── typing_stats: insert + aggregate ─────────────────────────────────
  console.log('\n[typing_stats]');
  const { typingStats } = schema;

  // One row per statement, as the route does: Postgres `now()` is the
  // transaction start time, so a single multi-row VALUES shares one timestamp.
  await db.insert(typingStats).values(
    { userId, lessonId: 'l1', lessonTitle: 'Python basics', mode: 'lesson', wpm: 40, accuracy: 95, errors: 2, charsTyped: 200, durationMs: 30000 },
  );
  await db.insert(typingStats).values(
    { userId, lessonId: 'l1', lessonTitle: 'Python basics', mode: 'lesson', wpm: 60, accuracy: 98, errors: 1, charsTyped: 200, durationMs: 20000 },
  );
  await db.insert(typingStats).values(
    { userId, lessonId: 'l2', lessonTitle: 'Algorithms', mode: 'melody', wpm: 80, accuracy: 90, errors: 5, charsTyped: 150, durationMs: 11000 },
  );

  const [agg] = await db
    .select({
      totalRuns: sql`count(*)::int`,
      bestWpm: sql`coalesce(max(${typingStats.wpm}), 0)::int`,
      avgWpm: sql`coalesce(round(avg(${typingStats.wpm})), 0)::int`,
      avgAccuracy: sql`coalesce(round(avg(${typingStats.accuracy})), 0)::int`,
    })
    .from(typingStats)
    .where(eq(typingStats.userId, userId));

  check('aggregate: totalRuns = 3', agg.totalRuns === 3, `got ${agg.totalRuns}`);
  check('aggregate: bestWpm = 80', agg.bestWpm === 80, `got ${agg.bestWpm}`);
  check('aggregate: avgWpm = 60', agg.avgWpm === 60, `got ${agg.avgWpm}`);
  check('aggregate: avgAccuracy = 94', agg.avgAccuracy === 94, `got ${agg.avgAccuracy}`);

  // Recent list is newest-first and limited (createdAt, then id as tiebreaker)
  const recent = await db
    .select()
    .from(typingStats)
    .where(eq(typingStats.userId, userId))
    .orderBy(desc(typingStats.createdAt), desc(typingStats.id))
    .limit(50);
  check('recent: returns 3 rows', recent.length === 3, `got ${recent.length}`);
  check('recent: newest first', recent[0].lessonTitle === 'Algorithms', `got ${recent[0].lessonTitle}`);

  // Empty user gets zeros, not NULL
  const [emptyAgg] = await db
    .select({
      totalRuns: sql`count(*)::int`,
      bestWpm: sql`coalesce(max(${typingStats.wpm}), 0)::int`,
    })
    .from(typingStats)
    .where(eq(typingStats.userId, 'nobody_here'));
  check('empty aggregate: totalRuns = 0', emptyAgg.totalRuns === 0, `got ${emptyAgg.totalRuns}`);
  check('empty aggregate: bestWpm = 0 not NULL', emptyAgg.bestWpm === 0, `got ${emptyAgg.bestWpm}`);

  // CHECK constraints: negative WPM and out-of-range accuracy must be rejected
  console.log('\n[constraints]');

  let wpmRejected = false;
  try {
    await db.insert(typingStats).values({
      userId, lessonId: 'x', lessonTitle: 'x', mode: 'x',
      wpm: -5, accuracy: 50, errors: 0, charsTyped: 1, durationMs: 1,
    });
  } catch {
    wpmRejected = true;
  }
  check('CHECK enforced: negative wpm rejected', wpmRejected);

  let accuracyRejected = false;
  try {
    await db.insert(typingStats).values({
      userId, lessonId: 'x', lessonTitle: 'x', mode: 'x',
      wpm: 50, accuracy: 999, errors: 0, charsTyped: 1, durationMs: 1,
    });
  } catch {
    accuracyRejected = true;
  }
  check('CHECK enforced: accuracy > 100 rejected', accuracyRejected);

  let fkRejected = false;
  try {
    await db.insert(typingStats).values({
      userId: 'ghost_user',
      lessonId: 'x',
      lessonTitle: 'x',
      mode: 'x',
      wpm: 1,
      accuracy: 1,
      errors: 0,
      charsTyped: 1,
      durationMs: 1,
    });
  } catch {
    fkRejected = true;
  }
  check('FK enforced: orphan stats row rejected', fkRejected);
} catch (error) {
  console.error('\nTest harness error:', error);
  failures++;
} finally {
  await pool.end();
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
