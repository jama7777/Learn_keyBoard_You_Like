import { pgTable, text, timestamp, integer, serial, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Auth.js (NextAuth v5) tables.
 *
 * `accounts` / `sessions` / `verificationTokens` follow the Auth.js Drizzle adapter
 * schema exactly — do not rename columns, the adapter reads them by name.
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('accounts_provider_account_unique').on(t.provider, t.providerAccountId)],
);

export const sessions = pgTable(
  'sessions',
  {
    sessionToken: text('session_token').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex('verification_tokens_identifier_token_unique').on(t.identifier, t.token)],
);

/**
 * AI lesson generations, most recent first per user.
 * Replaces the localStorage `typemaster_cloud_db_<username>` fake-cloud blob.
 */
export const lessonHistory = pgTable(
  'lesson_history',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(),
    format: text('format').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('lesson_history_user_created_idx').on(t.userId, t.createdAt),
    uniqueIndex('lesson_history_user_topic_format_unique').on(t.userId, t.topic, t.format),
  ],
);

/**
 * One row per completed typing lesson run.
 */
export const typingStats = pgTable(
  'typing_stats',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    lessonTitle: text('lesson_title').notNull(),
    mode: text('mode').notNull(),
    wpm: integer('wpm').notNull(),
    accuracy: integer('accuracy').notNull(),
    errors: integer('errors').notNull().default(0),
    charsTyped: integer('chars_typed').notNull().default(0),
    durationMs: integer('duration_ms').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  // Bounds enforced at the database too, so no code path can persist a WPM of
  // -5 or an accuracy of 999. The route validates with Zod first; this is the
  // backstop for anything that reaches the DB another way.
  (t) => [
    index('typing_stats_user_created_idx').on(t.userId, t.createdAt),
    check('typing_stats_wpm_range', sql`${t.wpm} >= 0 AND ${t.wpm} <= 500`),
    check('typing_stats_accuracy_range', sql`${t.accuracy} >= 0 AND ${t.accuracy} <= 100`),
    check('typing_stats_errors_range', sql`${t.errors} >= 0`),
    check('typing_stats_duration_range', sql`${t.durationMs} >= 0`),
  ],
);

/**
 * One row per telemetry flush from a visitor's browser. Stores the computed
 * risk score and a compact signal summary so the dashboard can review visits.
 * Raw event arrays are intentionally NOT stored (PII + size); only aggregates.
 */
export const interactionSessions = pgTable(
  'interaction_sessions',
  {
    id: serial('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    score: integer('score').notNull(),
    classification: text('classification').notNull(),
    uaBot: integer('ua_bot').notNull().default(0),
    eventCount: integer('event_count').notNull().default(0),
    keyCount: integer('key_count').notNull().default(0),
    mouseMoves: integer('mouse_moves').notNull().default(0),
    scrolls: integer('scrolls').notNull().default(0),
    spanMs: integer('span_ms').notNull().default(0),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('interaction_sessions_created_idx').on(t.createdAt), index('interaction_sessions_session_idx').on(t.sessionId)],
);
