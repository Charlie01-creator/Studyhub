-- 0003_rls_policies.sql
-- Row Level Security for every table introduced so far. Role checks live in
-- the database, not the frontend (spec section 26).

-- Helper: current user's role, without recursive RLS lookups on profiles.
create function public.current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('moderator', 'teacher', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'student'); -- students can't self-promote

create policy "profiles_update_staff"
  on public.profiles for update
  using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------
-- schools / subjects / subject_combinations — public read, admin write
-- ---------------------------------------------------------------------
alter table public.schools enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_combinations enable row level security;
alter table public.subject_combination_subjects enable row level security;
alter table public.profile_subjects enable row level security;

create policy "schools_read_all" on public.schools for select using (true);
create policy "schools_write_admin" on public.schools for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "subjects_read_all" on public.subjects for select using (true);
create policy "subjects_write_admin" on public.subjects for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "subject_combinations_read_all" on public.subject_combinations for select using (true);
create policy "subject_combinations_write_admin" on public.subject_combinations for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "subject_combination_subjects_read_all" on public.subject_combination_subjects for select using (true);
create policy "subject_combination_subjects_write_admin" on public.subject_combination_subjects for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "profile_subjects_owner" on public.profile_subjects for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "profile_subjects_staff_read" on public.profile_subjects for select
  using (public.is_staff());

-- ---------------------------------------------------------------------
-- curriculum tables — public read (every student needs it), admin write
-- ---------------------------------------------------------------------
alter table public.curricula enable row level security;
alter table public.curriculum_strands enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.learning_outcomes enable row level security;
alter table public.competencies enable row level security;
alter table public.learning_outcome_competencies enable row level security;

create policy "curricula_read_all" on public.curricula for select using (true);
create policy "curricula_write_admin" on public.curricula for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "curriculum_strands_read_all" on public.curriculum_strands for select using (true);
create policy "curriculum_strands_write_admin" on public.curriculum_strands for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "topics_read_all" on public.topics for select using (true);
create policy "topics_write_admin" on public.topics for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "subtopics_read_all" on public.subtopics for select using (true);
create policy "subtopics_write_admin" on public.subtopics for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "learning_outcomes_read_all" on public.learning_outcomes for select using (true);
create policy "learning_outcomes_write_admin" on public.learning_outcomes for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "competencies_read_all" on public.competencies for select using (true);
create policy "competencies_write_admin" on public.competencies for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "learning_outcome_competencies_read_all" on public.learning_outcome_competencies for select using (true);
create policy "learning_outcome_competencies_write_admin" on public.learning_outcome_competencies for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------
-- exam_configuration — public read, admin write
-- ---------------------------------------------------------------------
alter table public.exam_configuration enable row level security;

create policy "exam_configuration_read_all" on public.exam_configuration for select using (true);
create policy "exam_configuration_write_admin" on public.exam_configuration for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
