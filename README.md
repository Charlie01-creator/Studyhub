# S6 Study Hub — Sprint: Past Paper Library

Framework note: this sprint's brief said "Next.js 14," but the project is
on **Next.js 16.3** (upgraded in the prior stabilization pass, since 14 is
EOL). Kept 16 rather than downgrading — flagged to the user, not a silent
decision.

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

npx supabase link --project-ref <your-project-ref>
npx supabase db push   # applies migrations 0001-0006, including the new
                        # `papers` storage bucket + policies

npm run lint && npm run typecheck && npm run build && npm run dev
```

To try the admin flow: promote a user to admin (there's no UI for this yet
by design — see the security section below) via SQL:

```sql
select public.admin_set_user_role('<user-uuid>', 'admin');
-- run as an existing admin, or directly via the SQL editor as postgres
```

## What this sprint built

**Database** (`0006_past_papers.sql`): `papers` and `paper_views` tables.
`subjects` already existed from Phase 1 with the exact schema requested —
not recreated. Storage: private `papers` bucket (PDF-only, 25MB cap),
object-level RLS mirroring the table RLS. A `get_popular_papers()`
aggregate RPC exposes view *counts* to every student without ever exposing
row-level `paper_views` (who-viewed-what stays admin/staff-only).

**Student-facing** (`/papers`, `/papers/[id]`): search + subject/year/paper-number
filters, all URL-search-param driven so the page stays a Server Component
(small JS bundle, works in more browsers) rather than a client-fetch
dashboard. PDF viewing is a plain iframe against a browser's native PDF
renderer, not a bundled PDF.js — deliberate bundle-size tradeoff for
low-end Android/low-data users. Every PDF URL is a short-lived (1hr)
signed URL, generated fresh per page load; nothing is publicly linkable
long-term.

**Admin** (`/admin/papers`): upload form (file validation client- and
server-side: PDF-only, 25MB), paper list with delete (confirm-before-destroy),
storage rollback on partial upload failure (if the marking scheme upload
fails after the paper PDF succeeded, the paper PDF is removed too, so you
never get an orphaned half-uploaded row).

**Dashboard**: placeholders removed. Recently viewed, popular papers, and
subjects are real queries against what this sprint built. "Revision
activity" is a genuine weekly paper-view count — I did not fabricate a
richer activity metric since nothing else (quizzes, planner) exists yet to
measure; said so explicitly in the UI copy ("papers viewed this week"), not
as generic "activity."

**Security**: `/admin/papers` has a server-side redirect for non-admins,
but that's UX, not the actual boundary — the boundary is RLS + storage
policies, which I re-used from the existing `current_user_role()`/`is_staff()`
helpers rather than inventing a parallel authorization path.

## Known gaps / things to verify before calling this done

- **Not run**: `npm install`/`build`/`lint`/`typecheck`, or a live upload →
  RLS → signed-URL round trip. Same network constraint as the last
  stabilization pass — see that report for what "static review" means here.
  This is the single most important thing to verify before trusting this
  sprint: upload a paper as admin, confirm a student can view it, confirm a
  student CANNOT upload one (should fail at the RLS/storage-policy level,
  not just be hidden in the UI).
- **No screenshots** — same reason: no dev server running here to render
  and capture from. Recommend running `npm run dev` and eyeballing at
  320/360/390/412px before this ships.
- **Bottom nav's "Practice" and "Discuss" tabs still 404** — this predates
  this sprint (fixed 5-item nav from the original spec) and is explicitly
  out of scope ("do not proceed to quizzes, forums... yet"), not an
  oversight — flagging so it isn't mistaken for one.
- **No admin-promotion UI** — deliberate: role changes go through the
  `admin_set_user_role` RPC from the stabilization pass, run manually via
  SQL for now. Building an admin-user-management UI wasn't in this
  sprint's scope (papers only).
- **`app/layout.tsx` now does a profile lookup on every request** (to
  decide whether to show the admin sidebar link) — correctness over
  performance for now; worth wrapping in React's `cache()` if it shows up
  as a bottleneck later, flagging rather than silently over-optimizing.
- Paper search is `ILIKE` on title only (no full-text search across
  description, no topic tagging) — matches this sprint's literal scope;
  topic-level filtering was explicitly deferred to a later phase in the
  original master spec.

## Recommended next sprint

Given "past papers, marking schemes, subjects, progress tracking, practice
questions" is the stated v1 scope, and this sprint covered the first three
— **practice questions** (a real question bank + attempt tracking) is the
natural next piece, since "progress tracking" without something to
progress *on* isn't independently buildable yet. Concretely: `questions`
and `question_attempts` tables, a practice-set flow tied to subjects, and
a first pass at `user_progress` driven by attempt data rather than
invented metrics. Quizzes/forums/AI stay out per this sprint's explicit
boundary.
