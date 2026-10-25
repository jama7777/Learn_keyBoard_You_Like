# Learn_keyBoard_You_Like — Tech Stack Research for 1,000 Users

**Date:** 2026-10-25
**Target:** 1,000 registered users with real Google/GitHub logins, per-user lesson history + WPM stats in a database, hosted on **Vercel Hobby (free, $0)**.
**Verdict:** Migrate Vite+React → **Next.js (App Router) on Vercel Hobby**, add **Auth.js (NextAuth v5) with Google + GitHub**, **Neon Postgres** for data, **Upstash Redis** for rate limiting. Total cost: **$0**.

---

## 1. What the codebase actually is today

Measured from the cloned repo (`/Users/indra/Learn_keyBoard_You_Like`, commit `184c324`).

| Fact | Evidence |
|---|---|
| 5,900 lines total, 1,559 of them app code | `wc -l` over `App.tsx` (1,053) + 5 components/services/constants/types |
| Client-only Vite SPA, no server | `vite.config.ts`, `index.html` + `index.tsx` entry, no `api/` dir |
| "Cloud sync" is fake | `services/cloudService.ts` reads/writes `localStorage` with `setTimeout` delays |
| History is browser-local | `services/historyService.ts` uses `localStorage`, no user identity |
| AI is called from the browser | `services/geminiService.ts` — `GoogleGenAI` and raw `fetch("https://openrouter.ai/...")` in client code |
| Models in use | `gemini-2.0-flash-lite` (5 call sites), `openrouter/free` (line 170, 214) |
| Styling | `cdn.tailwindcss.com` (JIT CDN script) + Google Fonts, inline in `index.html` |

### The blocking bug: API key is shipped to the browser

`services/geminiService.ts` line 11 → `const apiKey = getApiKey();`, line 34 → `getApiKey()` resolves a key and line 25 does `new GoogleGenAI({ apiKey })` **in client code**. The key is read from `process.env.API_KEY` in a Vite build, which inlines it into the JS bundle.

Two consequences:

1. **Anyone can read your key.** "View Source" on the live site exposes it. It can be stolen and billed to your account.
2. **The request never touches Vercel.** Every AI call is a direct browser → OpenRouter call. So Vercel's quota, your Hobby limits, and any rate limiting you add **do not apply**. You cannot protect or throttle it server-side because there is no server-side path.

This is not a tuning problem. It is the reason the app cannot scale today, and it is why **"research the tech stack" is really "introduce a server tier."** No framework swap fixes it while the AI call stays in the browser.

Secondary issue: `cloudService.ts` is dead code — `grep -rn "cloudService"` returns only its own definition, no importers. The real history path is `historyService` + `localStorage`. There is no account system at all, so "1,000 members" has nowhere to land yet.

---

## 2. Why the current stack cannot carry 1,000 users

| Requirement | Current state | Gap |
|---|---|---|
| Per-user accounts | None. `localStorage` keyed by a username string | Needs auth + sessions |
| Per-user history/WPM persisted | `localStorage`, per device/browser | Needs a database |
| API key security | Inlined into the client bundle | Needs a server proxy |
| Throttling abuse | Impossible (no server hop) | Needs server-side rate limiting |
| Multi-device sync | None | Needs the database |

1,000 members is not a load problem. It is a *state* problem. The app is stateless by design; the work is adding state.

---

## 3. Options considered

### Option A — Stay on Vite, bolt on a separate backend
Add a small Express/Honos service (or a serverless platform of its own) alongside the Vite build, move AI calls there, add a DB.

- **Pros:** least change to 1,559 lines of app code.
- **Cons:** two deployments to keep in sync, two sets of env vars, auth cookies get awkward across two hosts, and you still pay for a second host. On a $0 budget this is the most work for the least result.

### Option B — Migrate to Next.js App Router ← **recommended**
- **Pros:** one deployment, server functions are a first-class concept, Vercel is the native host, `proxy.ts`/route handlers give the server tier that fixes the key leak, ecosystem for auth + DB is mature.
- **Cons:** real migration work (see §5). The `cdn.tailwindcss.com` script and `index.html` shell have to move.

### Option C — Switch to a different host (Railway/Render/Fly + Vite)
- **Pros:** full control, can run a real DB in the same app.
- **Cons:** you leave the platform that is already working, add ops burden (process managers, SSL, backups), and the cheapest always-on tiers are not free. On a $0 budget this is strictly worse than B.

**Recommendation: B.** The migration is bounded and well-documented, and it is the only option that solves the security bug *and* stays at $0.

---

## 4. Recommended stack, layer by layer

| Layer | Choice | Why this one |
|---|---|---|
| Framework | **Next.js 16** (App Router, Node runtime) | Current stable is 16.4.3 (23 Oct 2026). Node runtime is what Next.js now recommends; do **not** set `export const runtime = 'edge'` in new code. |
| Host | **Vercel Hobby** | Native for Next.js, zero-config deploy. |
| Auth | **Auth.js / NextAuth v5 (beta)** | Free and open-source, Google + GitHub providers in one config, JWT sessions. Chosen over Clerk specifically because Clerk's free tier is 50k MRUs — fine for 1,000 users, but it is a hosted dependency with per-user pricing above that; at 1,000 users Auth.js costs $0 forever. |
| Database | **Neon Postgres** | Vercel Marketplace integration, serverless (scales to zero), free tier: 100 projects, 10 branches/project, 100 CU-hrs/project/month, **1 GB storage/project**, 5 GB egress. 1 GB is ~200k+ rows of typing stats. |
| ORM | **Drizzle** | TypeScript-first, tiny, works with serverless Postgres, no connection pooling headaches. |
| Rate limiting | **Upstash Redis** | Required for abuse control. Free: 250 MB, 500K commands/month (Upstash's own FAQ also cites 10,000 req/day — design for the lower bound). Sliding-window limiter ≈ 2 commands/request. |
| AI proxy | **Route handler** calling Google Gemini / OpenRouter with the key in a server env var | Fixes the key leak and makes throttling possible. |
| Styling | **Tailwind CSS v4** (compiled) | Replace the JIT CDN script; it is a runtime cost in the browser and not meant for production. |

### Auth: why Auth.js over Clerk at your numbers
Clerk free = 50,000 MRUs/app. At 1,000 users you would never pay. So the deciding factor is not price — it is **dependency and data ownership**: Auth.js stores users in *your* Neon database, so you can query and export them. Clerk holds them in a vendor. For a personal project you may want to move later, Auth.js is the safer bet. If you would rather have a prebuilt login UI and not write any auth code, Clerk is the easier choice — say the word and I will spec that instead.

---

## 5. Migration scope (honest estimate)

The app is small enough that this is a contained job, but it is not a rename-and-go.

**Mechanical / low risk**
- `VITE_*` → `NEXT_PUBLIC_*`; `import.meta.env` → `process.env` (there are currently **zero** `VITE_` vars, so this is mostly creating them).
- Move the `index.html` shell (Tailwind CDN, fonts, scrollbar styles) into `app/layout.tsx`; install real Tailwind v4.
- `"use client"` on `App.tsx` and the three components (all interactive).

**Real work**
- Add `app/api/auth/[...nextauth]/route.ts`, `auth.ts`, a `users` table, and the Google/GitHub providers.
- Replace `historyService`/`cloudService` reads/writes with server actions or route handlers hitting Neon.
- Move every AI call in `geminiService.ts` behind `/api/ai/*` route handlers; keep the *parsing/formatting* helpers client-side, move only the network calls.
- New `users`, `lesson_history`, `typing_stats` tables + Drizzle schema and migrations.

**Untouched**
- `VirtualKeyboard.tsx`, `Hands.tsx`, `TypingArea.tsx`, `audioService.ts`, `lessonGenerator.ts`, `constants.ts`, and the WPM/accuracy logic in `App.tsx` — pure client logic, no changes.

**Risk to watch:** `App.tsx` is 1,053 lines of `useState`. Splitting it is not required for scale, but it is where bugs will hide during migration. Do not refactor it in the same change as the framework move.

---

## 6. What Vercel Hobby can actually take (verified limits)

Sourced from Vercel docs pages dated Sep–Oct 2026.

| Limit | Hobby | Notes for this app |
|---|---|---|
| Fast Data Transfer | 100 GB/mo | ~40,000 page views at 2.5 MB. Plenty. |
| CDN requests | 1,000,000/mo | Fine. |
| Function invocations | 1,000,000/mo | Fine. |
| **Active CPU** | **4 CPU-hrs/mo** | **The binding constraint.** ~288,000 requests at 50 ms CPU each. |
| Provisioned Memory | 360 GB-hrs/mo | Fine. |
| Function max duration | 300s | Not a problem; no long jobs. |
| Cron min interval | Once per day | Do not schedule anything faster on Hobby. |
| Log retention | 1 hour | Plan your debugging accordingly. |
| Commercial use | **Not permitted** | Hobby is non-commercial personal use only. If this becomes a product, you must go Pro. |

**The 4 CPU-hours line is the real ceiling.** Every AI lesson generation is a Vercel function invocation that waits on an external model — and Vercel does **not** bill active CPU while you wait on I/O. So the AI calls are cheap on CPU. What burns CPU is *rendering*. Keep pages statically prerendered wherever possible and the budget holds.

**Cost at your scale: $0.** Neon free (1 GB), Upstash free (500K cmds/mo), Auth.js free, Vercel Hobby free. You only pay if you enable commercial usage or exceed the free allowances.

---

## 7. Capacity math for 1,000 users

Assumptions: 1,000 registered users, 10% daily active = 100 DAU, each doing ~10 lesson runs/day, each run generating ~1 AI lesson.

| Resource | Monthly need | Free allowance | Headroom |
|---|---|---|---|
| Function invocations | ~30k AI + ~30k stats | 1,000,000 | 30x |
| Active CPU (AI waits on I/O, ~50 ms CPU/invocation) | ~1 hr | 4 hrs | 4x |
| Neon storage (1 KB/stat row, 300k rows) | ~300 MB | 1 GB | 3x |
| Upstash commands (2/rate-limited request, 60k) | ~120k | 500k | 4x |
| Bandwidth (2.5 MB/page, 30k pages) | ~75 GB | 100 GB | 1.3x ← **tightest** |

**Conclusion:** 1,000 users fits comfortably. The one line to watch is **bandwidth at 1.3x headroom** — that is the first thing to trim if the app grows (e.g. serve audio assets from Blob/object storage instead of the function origin).

---

## 8. Prioritised build order

**Phase 0 — stop the leak (do this first, independent of any migration)**
1. Rotate the API key that is currently in the client bundle. Treat it as compromised.
2. Move the Gemini/OpenRouter call behind a server endpoint *before* adding users, or throttle/rotate keys.

**Phase 1 — foundation**
3. Migrate Vite → Next.js App Router, Tailwind v4, one working deploy on Hobby.
4. Add Auth.js with Google + GitHub, `users` table, session helper.

**Phase 2 — persistence**
5. Drizzle schema + Neon: `lesson_history`, `typing_stats`.
6. Replace `historyService`/`cloudService` with server actions.
7. Delete the dead `cloudService.ts`.

**Phase 3 — protect**
8. Upstash sliding-window rate limiter on all `/api/ai/*` and `/api/stats` routes.
9. Server-side AI proxy with key in env var, retry/backoff on 429.

**Phase 4 — scale-ready**
10. Static prerender for the marketing/landing surfaces; keep only the tutor interactive.
11. Add a read-path cache for shared/global content so it is not recomputed per user.

---

## 9. Open questions before I start building

1. **Is this commercial?** Hobby forbids commercial use. If this is a product with paying users, we need Pro ($20/mo) and the whole cost table changes.
2. **Do you want the prebuilt login UI (Clerk) or own the auth code (Auth.js)?** Both fit 1,000 users; I recommend Auth.js for data ownership.
3. **Does the app need real-time anything?** If you want live leaderboards or multiplayer typing races, that is a different stack (WebSockets/Pusher/Ably, not Vercel functions) — confirm this is not in scope.
4. **Whose Gemini/OpenRouter key will the server use?** You will need to provide it; I will not read or copy it from any file.

---

## Sources

- Repo: `github.com/jama7777/Learn_keyBoard_You_Like` (local clone `/Users/indra/Learn_keyBoard_You_Like`, commit `184c324`) — `services/geminiService.ts:11,25,34,170,196`, `services/cloudService.ts`, `services/historyService.ts`, `App.tsx`, `package.json`, `vite.config.ts`
- Vercel Hobby limits — vercel.com/docs/plans/hobby; vercel.com/docs/limits; vercel.com/docs/limits/fair-use-guidelines
- Vercel Functions limits / Fluid compute — vercel.com/docs/functions/limitations; vercel.com/docs/fluid-compute; vercel.com/docs/functions/usage-and-pricing
- Vercel Postgres/KV moved to Neon/Upstash (Dec 2024) — temps.sh/blog/vercel-pricing-complete-guide-2026
- Next.js latest release — github.com/vercel/next.js/releases (v16.4.3, 23 Oct 2026)
- Vite → Next.js migration guide — nextjs.org/docs/app/guides/migrating/from-vite
- Node runtime recommended over Edge in v16; `proxy.ts` is Node-only — nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime; clerk.com/articles/authentication-for-serverless-and-edge-deployments-2
- Auth options and free tiers — clerk.com/pricing; clerk.com/articles/nextjs-authentication-guide-2026-2
- Neon free plan — neon.com/docs/introduction/plans; neon.com/faqs/free-plan-limits-and-quotas
- Upstash free tier — upstash.com/docs/redis/overall/billing; upstash.com/pricing/redis
- Gemini API rate limits and free tier — ai.google.dev/gemini-api/docs/rate-limits; ai.google.dev/gemini-api/docs/pricing; apidog.com/blog/free-ai-api
- OpenRouter free-model rate limits — openrouter.ai/pricing; openrouter.ai/docs/api_reference/limits
- Vercel AI Gateway — vercel.com/docs/ai-gateway/pricing; vercel.com/docs/ai-gateway/rate-limits
- Gemini video/audio input limits — ai.google.dev/gemini-api/docs/video-understanding; ai.google.dev/gemini-api/docs/files

---

## 10. Migration status (2026-10-25)

Phases 0–3 are **built and verified** locally, and a **preview deployment on Vercel is live and verified**. Production is deliberately not deployed (see §11).

### Deployment (2026-10-25)

Preview: `learn-key-board-you-like-fz6ip5qj7-jama7777-8920s-projects.vercel.app`
Project: `learn-key-board-you-like` → https://learn-key-board-you-like.vercel.app

There is **no `typemaster` project** on the account. The repo was already linked to
`learn-key-board-you-like` (the old Vite deployment), which is what the deploy
targets.

| Check | Result |
|---|---|
| `next build` on Vercel | **passes** (was failing — see bugs 7 and 8) |
| `/` | 200, `<title>TypeMaster AI</title>` |
| `/signin` | 200, sign-in page renders |
| `/api/session` | `{"user":null}` |
| `/api/history`, `/api/stats` | clear **503** — `DATABASE_URL is not set — add the Neon Postgres URL in the Vercel env vars.` |

Two fixes were needed to get the Vercel build green; neither showed up locally
because local `.env.local` always supplied a `DATABASE_URL`.

7. **`db/index.ts` threw when `DATABASE_URL` was unset.** Next.js imports every
   route module at build time to collect its config (`runtime`, `maxDuration`), so
   that throw aborted `next build`. Vercel does not load `.env.local`, so the
   guard only ever fired there. Now the client is built against a placeholder URL
   when the var is missing, and routes return a clear 503 via `dbConfigured()`.
8. **The Vercel project's framework preset was still `vite`.** It looked for a
   `dist` output directory that Next.js does not produce
   (`No Output Directory named "dist" found`). Patched the project setting to
   `nextjs`, and declared `framework: nextjs` in `vercel.json` so the repo
   carries it.

### Still to do (requires your input)

### Built

| Artifact | Path |
|---|---|
| Next.js shell (App Router, Tailwind v4, static `/`) | `app/layout.tsx`, `app/page.tsx`, `app/globals.css` |
| Auth.js v5, Google + GitHub, database sessions | `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts` |
| Drizzle schema + migrations (6 tables) | `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`, `drizzle/0000_init.sql` |
| Server-side AI proxy (key never reaches the browser) | `lib/ai.ts`, `app/api/ai/generate/route.ts` |
| Rate limiting, fail-open by default | `lib/rate-limit.ts` |
| History API (replaces `cloudService` + `historyService`) | `app/api/history/route.ts` |
| Stats API (per-run WPM/accuracy) | `app/api/stats/route.ts` |
| Session probe for the client services | `app/api/session/route.ts` |
| Sign-in page | `app/signin/page.tsx` |
| Real-Postgres query test | `scripts/test-db-queries.mjs` (`npm run test:db <DATABASE_URL>`) |

### Verified

| Check | Result |
|---|---|
| `tsc --noEmit` | **0 errors** |
| `next build` | **passes** — 8 routes, `/` static |
| Live endpoint probe (signed out) | `/` 200, `/signin` 200, `/api/session` 200 `{"user":null}`, `/api/history` 401, `/api/stats` 401, `/api/ai/generate` 400 on bad body |
| Auth providers registered | `/api/auth/providers` returns google + github with correct callback URLs |
| **Key leak** | `grep -rl 'local-placeholder' .next/static/` → **no matches**. The placeholder key appears nowhere in the client bundle. |
| DB queries vs real Postgres 14 | **22/22 pass** — dedupe, per-user isolation, trim-to-50, ordering, aggregates, CHECK + FK enforcement |

### Bugs the tests caught (now fixed)

1. **`types/next-auth.d.ts` had no top-level import.** TypeScript treated `declare module 'next-auth'` as a brand-new ambient module that *shadowed* the real package types, so `NextAuthConfig` was "not exported" and `NextAuth(config)` was "not callable". Adding `import 'next-auth'` turns it into an augmentation.
2. **`getProviders()` called from a server component.** It lives in `next-auth/react` and only runs client-side. The sign-in page now derives buttons from which `AUTH_*` env vars are set.
3. **Missing `AUTH_TRUST_HOST`.** Auth.js v5 throws `UntrustedHost` for any host it does not recognise (raw IP, tunnel, localhost). Required in local dev.
4. **`timestamp without time zone`.** Server `now()` writes *local* time while a client-supplied JS `Date` is *UTC*, so the two are incomparable and ordering silently breaks. All 8 timestamp columns are now `timestamptz`.
5. **Non-deterministic ordering.** Postgres `now()` is the *transaction* start time, so rows written in one statement share a timestamp. Every `ORDER BY created_at` now carries `id` as a tiebreaker.
6. **Rate limiter 500s on backend failure.** Now fails open (logs and proceeds) unless `RATE_LIMIT_STRICT=true`.

### Still to do (requires your input)

1. **Rotate the leaked Gemini/OpenRouter key.** It is in the current client bundle on the live site. Treat it as compromised.
2. **Create a Neon project** and a free Upstash Redis; paste the values into Vercel env vars (see `.env.example`).
3. **Create OAuth credentials** (Google Cloud console, GitHub developer settings) with callback URLs `<site>/api/auth/callback/{google,github}`.
4. **`npm run db:push`** against Neon to create the tables.
5. **Commit and push** — not done; you said not to commit until told.

### Left alone on purpose

- `TypingApp.tsx` (1,053 lines) is still the original component, renamed from `App.tsx`. It compiles and runs under Next.js; splitting it is a separate change.
- No realtime features — assumed out of scope (question 3 in §9 is still open).
- No WPM/stats UI yet. The API stores runs; nothing renders the aggregate. That is a deliberate follow-up.

### Dependency audit (after the zod bump)

`npm audit` reports **8 vulnerabilities (6 moderate, 2 high)**. Zod was the one in the request path and is now closed.

| Advisory | Severity | Reachability here | Action |
|---|---|---|---|
| `zod < 4.6.6` — memory exhaustion validating oversized constrained collections | high | **Not reachable.** Schemas are flat objects with every string `.max()`-capped (`prompt` 20 KB, `topic` 500, `format` 100) and no array/collection input. | **Fixed** — bumped to zod 4.6.7. Typecheck + build + live validation probes all pass. |
| `@fastify/busboy <= 3.2.1` — DoS / CRLF injection via multipart parsing | high | **Not reachable.** Transitive via `@ai-sdk/openai-compatible` → `@ai-sdk/provider-utils` → `undici`. The vulnerable path is *parsing incoming multipart bodies*; this app never parses multipart and `undici` is used only as an outgoing HTTP client. | Needs a breaking bump. Revisit if file uploads are ever added. |
| `esbuild <= 0.24.2` — dev server request leak | moderate | **Dev only.** Transitive via `drizzle-kit` → `@esbuild-kit`. | Needs a breaking bump (would downgrade drizzle-kit to 0.18.1). Ignore unless drizzle-kit is upgraded anyway. |

**Note on the auth/body-validation order:** `/api/history` and `/api/stats` return 401 *before* parsing the body, so unauthenticated callers cannot spend server work or trigger validation on arbitrary input. `/api/ai/generate` validates the body first because it rate-limits before the auth check.
