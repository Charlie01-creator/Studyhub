-- 0006_past_papers.sql
-- Sprint 1: Past Paper Library. `subjects` already exists (0001) and
-- matches the requested schema exactly — not recreated here.

create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------
-- papers
-- ---------------------------------------------------------------------
create table public.papers (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  title text not null,
  year smallint not null check (year between 1990 and 2100),
  paper_number smallint not null default 1 check (paper_number >= 1),
  paper_type text, -- e.g. 'Theory', 'Practical', 'Objective', 'Structured'
  description text,
  -- Storage object PATHS within the private `papers` bucket, not public
  -- URLs — resolved to short-lived signed URLs at read time (see
  -- lib/papers/storage.ts). Bucket is private: past papers are often
  -- copyrighted/licensed exam board material (spec section 35), so we
  -- don't want them permanently, publicly link-shareable.
  pdf_path text not null,
  marking_scheme_path text, -- nullable: not every paper has one uploaded yet
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index papers_subject_idx on public.papers (subject_id);
create index papers_year_idx on public.papers (year);
create index papers_subject_year_idx on public.papers (subject_id, year desc);
-- Trigram index so ILIKE '%term%' search on title stays index-assisted
-- rather than a full sequential scan as the library grows.
create index papers_title_trgm_idx on public.papers using gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------
-- paper_views — one row per view event (not upserted/deduped), so
-- "popular papers" can be a genuine view count and "recently viewed" can
-- reflect actual browsing history.
-- ---------------------------------------------------------------------
create table public.paper_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  paper_id uuid not null references public.papers (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index paper_views_user_idx on public.paper_views (user_id, viewed_at desc);
create index paper_views_paper_idx on public.paper_views (paper_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.papers enable row level security;
alter table public.paper_views enable row level security;

-- Students: view papers. Kept to authenticated users only (consistent with
-- the rest of the app, which is behind login) rather than public/anon.
create policy "papers_select_authenticated"
  on public.papers for select
  using (auth.uid() is not null);

create policy "papers_write_admin"
  on public.papers for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Students: record views of their own, read their own view history.
-- Staff can read all views (needed for future moderation/analytics), but
-- NOT for popular-papers counts — that goes through the aggregate RPC
-- below so ordinary students never need row-level access to other
-- students' individual view records.
create policy "paper_views_insert_own"
  on public.paper_views for insert
  with check (user_id = auth.uid());

create policy "paper_views_select_own_or_staff"
  on public.paper_views for select
  using (user_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------------
-- Aggregate RPC for "Popular papers" — exposes counts only, not who
-- viewed what, so it's safe to grant to every authenticated student
-- despite paper_views itself being locked to "own rows only".
-- ---------------------------------------------------------------------
create or replace function public.get_popular_papers(result_limit int default 5)
returns table (paper_id uuid, view_count bigint)
language sql
security definer
stable
set search_path = public
as $$
  select paper_id, count(*) as view_count
  from public.paper_views
  group by paper_id
  order by view_count desc, paper_id
  limit result_limit;
$$;

revoke all on function public.get_popular_papers(int) from public;
grant execute on function public.get_popular_papers(int) to authenticated;

-- ---------------------------------------------------------------------
-- Storage: private `papers` bucket + object-level policies.
-- Private (not public) so access always goes through a signed URL issued
-- to an authenticated, non-suspended session — see lib/papers/storage.ts.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papers', 'papers', false, 26214400, array['application/pdf']) -- 25MB cap, PDFs only
on conflict (id) do nothing;

create policy "papers_bucket_read_authenticated"
  on storage.objects for select
  using (bucket_id = 'papers' and auth.uid() is not null);

create policy "papers_bucket_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'papers' and public.current_user_role() = 'admin');

create policy "papers_bucket_update_admin"
  on storage.objects for update
  using (bucket_id = 'papers' and public.current_user_role() = 'admin');

create policy "papers_bucket_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'papers' and public.current_user_role() = 'admin');
