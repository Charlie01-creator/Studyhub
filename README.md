# S6 Study Hub — Production Reliability Audit (Round 2)

## One naming flag before anything else

This brief lists `NEXT_PUBLIC_SUPABASE_ANON_KEY` as an env var to check.
The codebase uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the current
Supabase key naming (ANON_KEY is the legacy name; we deliberately moved off
it during the stabilization pass because Supabase's new API-key system
uses `sb_publishable_...`/`sb_secret_...` keys under new names). If your
Vercel project actually has `NEXT_PUBLIC_SUPABASE_ANON_KEY` set instead of
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, **that alone would explain a
production 500** — the app is reading a variable name that doesn't exist
in your environment. Check this specifically, it's the most likely single
answer if you haven't already renamed it in Vercel.

## 1. Root cause of the Vercel error

**I still do not have access to your actual Vercel logs or Supabase
project** — everything here is a static code audit, reasoned backward from
the symptom, not a confirmed diagnosis. With that caveat, in order of
likelihood:

1. **Env var name/scope mismatch** — see above, and/or the var not ticked
   for the "Preview" environment in Vercel Project Settings.
2. **Migrations not applied** — if `supabase db push` was never run against
   the linked project, every query fails with "relation does not exist,"
   which has the identical symptom (every route down) because it happens
   inside `app/layout.tsx`, which wraps every page.
3. Prior to this pass, **that exact scenario (1 or 2) would crash 100% of
   routes** because `app/layout.tsx` and `proxy.ts` both called Supabase
   with unguarded `!` assertions and no fallback. That's fixed now (see
   below) — so even if the underlying env/migration problem isn't fixed
   yet, the symptom should change from a blank Internal Server Error to a
   specific, readable error page, which will make the true cause visible
   in the Vercel Function Logs.

## 2. Files changed in this pass

**New:**
- `app/error.tsx` — segment-level error boundary (catches anything not
  already handled by a page's own guard)
- `app/global-error.tsx` — root-level boundary; the only thing that can
  catch a crash in `app/layout.tsx` itself, since `error.tsx` renders
  *inside* the layout and can't catch the layout's own failures
- `app/not-found.tsx` — custom 404
- `app/papers/loading.tsx`, `app/papers/[id]/loading.tsx`,
  `app/admin/papers/loading.tsx` — loading states for the three
  data-fetching-heavy routes

**Modified:**
- `app/login/LoginForm.tsx`, `app/register/RegisterForm.tsx`,
  `app/admin/papers/UploadPaperForm.tsx` — migrated `useFormState` (from
  `react-dom`) to `useActionState` (from `react`). Not the cause of your
  current error (`useFormState` is deprecated in React 19, not removed),
  but it's on a deprecation track and this audit is exactly the moment to
  fix it rather than leave it as a future landmine.
- `app/papers/[id]/page.tsx` — two real bugs found in this pass:
  - The raw Supabase Storage error message was being rendered directly to
    students (`{urlError}`) if signed-URL generation failed — could leak
    internal error text. Now logs the real error server-side, shows a
    generic message to the user.
  - `void recordPaperView(paper.id)` had no `.catch()` — if `createClient()`
    itself threw inside that call (not just the DB insert), it would be an
    unhandled promise rejection. Fixed at both the call site and the
    source.
- `lib/papers/queries.ts` — `recordPaperView`'s doc comment claimed it
  "never throws into the render path," but that wasn't actually true if
  `createClient()` failed before reaching its own internal error handling.
  Now it actually matches its own contract.

**Carried over from the previous pass** (still in effect, not re-touched
here): `lib/supabase/{env,safe,client,server,proxy}.ts`, `app/layout.tsx`,
`app/page.tsx`, `app/papers/page.tsx`, `app/profile/{page,actions}.tsx`,
`app/register/{page,actions}.ts(x)`, `app/login/actions.ts`,
`lib/auth/requireAdmin.ts`, `app/admin/papers/page.tsx`, `next.config.mjs`.

## 3. Problems fixed (this pass, on top of the previous pass)

- Deprecated React API (`useFormState`) migrated before it's actually removed
- Raw internal error text no longer shown to students on the paper-detail page
- Unhandled-promise-rejection risk in view tracking closed at the source
- No error/404/loading boundaries existed anywhere — added all three, so a
  genuinely unexpected failure now shows a real page instead of a blank crash

## 4. Remaining risks (honest, not hidden)

- **Not verified against a real deployment.** I still cannot run
  `npm install`/`build` or reach a live Supabase project from this sandbox.
  Every fix here is correct by careful reading, not by a green CI run.
- **The actual Vercel error message is still unknown to me.** If it's
  something other than a Supabase-config issue (e.g. a genuine TypeScript
  build error, a missing dependency, an out-of-memory build), none of this
  pass's fixes address that — please paste the actual log line if the
  error persists after checking the env var/migration items above.
- `app/layout.tsx` does one Supabase round-trip per request (to decide
  whether to show the admin nav link) — correctness-first, not
  performance-first; flagged previously, not addressed here since it's a
  performance tradeoff, not a reliability bug.
- No automated tests exist. Static review catches a lot but not everything
  a real test suite would.
- `public/` has no favicon — cosmetic (browsers 404 silently on
  `/favicon.ico`), not a reliability issue, not fixed here since it would
  require inventing a brand asset with no source to draw from (out of
  scope for "don't redesign").

## 5. Production readiness score: 72/100

Reasoning, not just a number: the app no longer has a single Supabase
failure point that can take down every route, error/404 boundaries exist,
a real security/error-leak bug and a real unhandled-rejection bug were
found and fixed, and a deprecated API was migrated ahead of its removal.
That's genuine, verifiable progress. It's not higher because **the actual
production error has still never been confirmed against real logs** —
everything here is the best a static audit can do without that visibility,
and I'd be overstating confidence to call this "production-ready" without
having seen it actually run clean once.

## 6. Ready for feature development?

**Conditionally, not unconditionally.** Do this first, in order:
1. Check the env var name/scope issue flagged at the top of this file.
2. Confirm migrations 0001–0006 are applied to the linked Supabase project.
3. Redeploy and check Vercel Function Logs for the specific route/error.
4. Run `npm run build` successfully at least once, locally or in CI.

If all four pass clean, yes — the codebase is in good enough shape to
resume feature work. If any of them still show an error, send me the exact
message and I'll diagnose that specific failure rather than continue
auditing in the dark.
