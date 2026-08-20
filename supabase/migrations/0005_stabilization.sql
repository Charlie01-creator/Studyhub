-- 0005_stabilization.sql
-- Phase 1 stabilization pass. Written as a new migration rather than
-- editing 0001-0004 in place, since migrations already applied to any real
-- Supabase project should never be rewritten after the fact — this file is
-- safe to run whether or not 0001-0004 have already shipped.

-- =======================================================================
-- 1. Fix handle_new_user(): populate onboarding fields (school, subject
--    combination, preferred subjects) from signUp metadata.
--
--    Why this changed: the original trigger only set full_name. The
--    application code used to follow signUp() with a `.from('profiles')
--    .update(...)` call — but when email confirmation is enabled (the
--    Supabase default), signUp() returns session: null, so that follow-up
--    write had no authenticated session to satisfy RLS with. Moving all
--    onboarding data into raw_user_meta_data and having this
--    SECURITY DEFINER trigger apply it works correctly regardless of the
--    project's email-confirmation setting.
-- =======================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta jsonb := new.raw_user_meta_data;
  subject_id_text text;
begin
  insert into public.profiles (
    id, full_name, school_id, school_name_freetext, subject_combination_id
  )
  values (
    new.id,
    coalesce(meta ->> 'full_name', 'New Student'),
    nullif(meta ->> 'school_id', '')::uuid,
    nullif(meta ->> 'school_name_freetext', ''),
    nullif(meta ->> 'subject_combination_id', '')::uuid
  );

  if meta ? 'subject_ids' and jsonb_typeof(meta -> 'subject_ids') = 'array' then
    for subject_id_text in select jsonb_array_elements_text(meta -> 'subject_ids')
    loop
      insert into public.profile_subjects (profile_id, subject_id, is_preferred)
      values (new.id, subject_id_text::uuid, true)
      on conflict do nothing;
    end loop;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- =======================================================================
-- 1b. Suspension should also strip DB-level staff privileges, not just
--     block login in the app layer — defense in depth in case a suspended
--     staff member's existing session/token is still valid somewhere.
-- =======================================================================
create or replace function public.current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_suspended = false;
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('moderator', 'teacher', 'admin') from public.profiles
       where id = auth.uid() and is_suspended = false),
    false
  );
$$;

-- =======================================================================
-- 2. Prevent role escalation and self-unsuspension at the privilege level,
--    not just via RLS row filters.
--
--    Supabase maps every signed-in user to the SAME Postgres role
--    (`authenticated`) — student vs admin is purely the `profiles.role`
--    application column. That means an RLS policy alone can't reliably
--    stop a student from writing `role = 'admin'` on their own row using
--    a WITH CHECK that references the row's own new value (there's no
--    clean way to compare against the pre-update value in a policy without
--    risk of visibility edge cases). The robust fix is a column-level
--    privilege restriction: no authenticated user, of ANY role, can UPDATE
--    profiles.role or profiles.is_suspended through a plain table write.
--    Changing either now requires the SECURITY DEFINER RPCs below, which
--    check admin status themselves before touching the row.
-- =======================================================================
revoke update on public.profiles from authenticated;
grant update (full_name, school_id, school_name_freetext, subject_combination_id, level_year)
  on public.profiles to authenticated;

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_staff" on public.profiles;

-- Own profile: any authenticated user can update their own row, but only
-- within the columns granted above (role/is_suspended are excluded at the
-- privilege level regardless of what this policy allows).
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Staff can fix data on OTHER students' profiles (e.g. a typo'd school)
-- within the same granted-column limits — still can't touch role/suspension
-- via a raw UPDATE.
create policy "profiles_update_staff"
  on public.profiles for update
  using (public.is_staff())
  with check (public.is_staff());

-- Admin-only RPCs for the two sensitive fields. Each re-checks admin status
-- server-side (never trust the caller) before writing.
create or replace function public.admin_set_user_role(target_id uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Only admins can change user roles';
  end if;
  update public.profiles set role = new_role where id = target_id;
end;
$$;

create or replace function public.admin_set_suspended(target_id uuid, suspended boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Only admins can suspend or unsuspend users';
  end if;
  update public.profiles set is_suspended = suspended where id = target_id;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, user_role) from public;
grant execute on function public.admin_set_user_role(uuid, user_role) to authenticated;

revoke all on function public.admin_set_suspended(uuid, boolean) from public;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;

-- =======================================================================
-- 3. Exam date: never present an unverified date as if it were official.
--    exam_date becomes nullable; is_confirmed defaults false. The UI
--    (components/ui/Countdown.tsx) shows "date to be confirmed" instead of
--    a day count until an admin sets is_confirmed = true with a date
--    verified against an official UNEB timetable.
-- =======================================================================
alter table public.exam_configuration alter column exam_date drop not null;
alter table public.exam_configuration add column if not exists is_confirmed boolean not null default false;

update public.exam_configuration
set exam_date = null,
    is_confirmed = false,
    label = 'UACE 2026 (date to be confirmed)'
where is_active = true;

-- =======================================================================
-- 4. Flag demo/placeholder curriculum content explicitly, so it can never
--    be mistaken for imported NCDC data, and so it's trivially queryable
--    for cleanup once real curriculum data lands.
-- =======================================================================
alter table public.curriculum_strands add column if not exists is_demo_content boolean not null default false;
alter table public.topics add column if not exists is_demo_content boolean not null default false;
alter table public.subtopics add column if not exists is_demo_content boolean not null default false;

update public.curriculum_strands set is_demo_content = true where name = 'Mechanics';
update public.topics set is_demo_content = true where name = 'Problem Solving in Kinematics';
update public.subtopics set is_demo_content = true where name = 'Application of motion equations';
