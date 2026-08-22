# S6 Study Hub — Production Debugging Audit

## Root-cause diagnosis (most likely — I cannot see your actual Vercel logs)

I don't have access to your Vercel project or its build/runtime logs, so
this is a code-level audit, not a confirmed root cause. But the symptom
you described — the ENTIRE deployment shows "Internal Server Error," not
just one page — points strongly at one thing: **`app/layout.tsx` (wraps
every single route) and `proxy.ts` (runs before every single request) both
called Supabase with unguarded `process.env.X!` assertions.** If
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` aren't
set for the environment that deployment ran in, `@supabase/ssr` throws
immediately ("supabaseUrl is required"), and since that happens in the two
places guaranteed to run on every request, it takes down 100% of routes —
matching exactly what you saw.

**The single most common way this happens on Vercel, specifically for
"preview" deployments:** environment variables have a per-environment
checkbox (Production / Preview / Development) in Project Settings. It's
easy to add a var, tick only "Production," and forget "Preview" — the
preview deployment then has zero Supabase config. **Check this first,
literally before reading anything else below.**

The second most common cause, which I can't rule out from code alone:
**migrations 0001–0006 were never applied to the Supabase project this
deployment points at.** If the tables don't exist, every query throws
`relation "profiles" does not exist` — same blast radius, same fix
priority. Check via `npx supabase db push` or the Supabase SQL editor.

## What I actually changed (defensive fixes, not a redesign)

1. **`lib/supabase/env.ts` (new)** — every env var read is now centralized
   here with a descriptive error naming exactly which var is missing and
   how to fix it in Vercel, instead of six separate `!` assertions
   scattered across the codebase producing an opaque error each.

2. **`lib/supabase/safe.ts` (new)** — a `safeSupabase()` wrapper that
   returns `{ data, error }` instead of throwing. Applied to every Server
   Component that touches Supabase directly.

3. **`app/layout.tsx`** — the admin-sidebar-link check now goes through
   `safeSupabase`; a Supabase failure degrades to "render as logged out"
   instead of crashing every route in the app. **This was the highest-impact
   single fix.**

4. **`lib/supabase/proxy.ts`** — now fails OPEN: if session refresh throws
   for any reason, it logs and lets the request through unauthenticated
   rather than blocking every request in the app. Downstream pages each
   re-check auth themselves, so this doesn't weaken access control — it
   just stops one failure point from being a single point of total outage.

5. **Every other Server Component/Action that touches Supabase** —
   `app/page.tsx` (dashboard), `app/papers/page.tsx`, `app/papers/[id]/page.tsx`,
   `app/profile/page.tsx`, `app/register/page.tsx`, `app/admin/papers/page.tsx`,
   `lib/auth/requireAdmin.ts`, and the login/register/sign-out Server
   Actions — all now catch Supabase failures and show a "temporarily
   unavailable" state (or a form error, for actions) instead of an
   unhandled exception. **Also fixed a real bug found during this audit**:
   `app/page.tsx`'s weekly-view-count query had no `.catch()`, so a
   transient failure there would have rejected the whole `Promise.all`
   even though its three sibling queries already had their own `.catch()`.

6. **`next.config.mjs`** — `images.remotePatterns` now derives the Supabase
   storage hostname from the env var instead of a commented-out example,
   but critically, it's wrapped so a missing/malformed env var **at build
   time** can't fail the entire Vercel build (a config file throwing is a
   worse failure mode than a runtime error, since it blocks every
   deployment, not just requests). No `next/image` usage exists yet in the
   app, so this specifically wasn't the cause of your current error — but
   it's now safe for when images are added.

7. **API routes**: none exist (`app/api/**` is empty) — Server Actions
   handle every mutation instead. Nothing to audit there; noting it so you
   know it wasn't overlooked.

## Environment variables — exact checklist for Vercel

Go to **Project Settings → Environment Variables** and confirm these are
set **with the "Preview" box ticked, not just "Production"** (assuming you
want preview deployments to work — if you deliberately don't want preview
to have a working DB connection, that's a separate discussion, but then
"Internal Server Error" is arguably the wrong failure mode to want either
way):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | "API Keys" tab, not "Legacy API Keys" |
| `SUPABASE_SECRET_KEY` | No | Not used by any current app code |

**Critical**: `NEXT_PUBLIC_*` vars are inlined into the JS bundle at BUILD
time. If you add/fix them in Vercel after a build already ran, you must
**trigger a new deployment** — redeploying "the same build" via the
"Redeploy" button without rebuilding won't pick up the change; use
"Redeploy" with the cache-clearing option, or just push a new commit.

## What I could NOT verify (being upfront, as asked)

- **I do not have access to your actual Vercel build/runtime logs.**
  Everything above is a static code audit reasoned backward from the
  symptom you described, not a confirmed diagnosis against your real logs.
  Please check the Vercel dashboard's Function Logs for the actual
  deployment and match the error message against the "root-cause
  diagnosis" section above — if it says something other than a Supabase
  config error, tell me the exact message and I'll re-diagnose.
- **I did not run `npm install`/`build`** (same network-sandboxed
  environment as prior sessions) — the fixes are correct by static review,
  not by a passing build. Run `npm run build` locally (or watch the next
  Vercel build) before assuming this is fully resolved.
- **Vercel's Node.js runtime version** (Project Settings → General → Node.js
  Version) should be 20.x or newer per Next.js 16's requirement — I can't
  see what it's currently set to; worth a manual check.
- If, after setting env vars correctly and confirming migrations are
  applied, the error persists — the next place to look is whether the
  Supabase project itself is paused (free-tier Supabase projects auto-pause
  after a week of inactivity, which produces connection failures that look
  identical to a missing env var from the app's side).

## Deployment readiness report

| Check | Status |
|---|---|
| Server Components/Actions audited for unguarded Supabase calls | Done — every one now degrades gracefully |
| API routes checked | N/A — none exist |
| Environment variables identified and documented | Done — see table above |
| Safe error handling around Supabase initialization | Done — `lib/supabase/env.ts` + `lib/supabase/safe.ts` |
| Image config / remotePatterns reviewed | Done — build-safe now, not currently in use |
| App works without local-environment assumptions | Done, to the extent static review can confirm |
| Vercel build logs reviewed | **Not done — I don't have access to them** |
| Confirmed fix against a real deployment | **Not done — could not run a build in this sandbox** |

**Bottom line**: the code no longer has a single Supabase-related failure
point that can take down the entire app — but I have not seen your actual
error and have not run a real build against a real Supabase project.
Set/verify the env vars (Preview scope included), confirm migrations are
applied, redeploy, and check the Vercel Function Logs for the specific
route if anything still fails — with these changes, a failure at this
point should show a scoped error message instead of a blank
"Internal Server Error," which will make the real cause much easier to
pin down if one remains.
