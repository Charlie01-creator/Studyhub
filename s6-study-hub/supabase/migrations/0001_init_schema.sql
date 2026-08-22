-- 0001_init_schema.sql
-- Foundation: roles, profiles, schools, subjects, subject combinations.
-- UUID PKs, FKs, timestamps and indexes throughout per spec section 27.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Roles (spec section 13)
-- ---------------------------------------------------------------------
create type user_role as enum ('student', 'moderator', 'teacher', 'admin');

-- ---------------------------------------------------------------------
-- profiles — one row per auth.users row, created via trigger below.
-- Subject combination is NOT hard-coded (spec section 9): a student can
-- belong to an existing combination or have an ad-hoc set of subjects.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role user_role not null default 'student',
  school_id uuid, -- FK added after `schools` exists below
  school_name_freetext text, -- fallback until the school is added to the catalogue
  level_year text not null default 'S6',
  subject_combination_id uuid, -- FK added after `subject_combinations` exists below
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_school_idx on public.profiles (school_id);

-- ---------------------------------------------------------------------
-- schools — admin-managed catalogue (spec section 9)
-- ---------------------------------------------------------------------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text,
  is_verified boolean not null default false, -- true once an admin confirms it's a real school
  created_at timestamptz not null default now()
);

create unique index schools_name_district_idx on public.schools (lower(name), coalesce(district, ''));

alter table public.profiles
  add constraint profiles_school_fk foreign key (school_id) references public.schools (id) on delete set null;

-- ---------------------------------------------------------------------
-- subjects — admin-managed catalogue (spec section 9)
-- ---------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique, -- e.g. UNEB subject code, optional
  category text, -- 'Arts' | 'Sciences' | 'Commercial' | 'ICT' | other — free text, admin-managed
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- subject_combinations — e.g. PCM, PCB, PEM, MEG, HEG, BCM, plus
-- arts/commercial combos and anything else admins add. Never hard-coded
-- into the UI (spec section 9).
-- ---------------------------------------------------------------------
create table public.subject_combinations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. 'PCM'
  display_name text not null, -- e.g. 'Physics, Chemistry, Mathematics'
  created_at timestamptz not null default now()
);

create table public.subject_combination_subjects (
  subject_combination_id uuid not null references public.subject_combinations (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  primary key (subject_combination_id, subject_id)
);

alter table public.profiles
  add constraint profiles_subject_combination_fk foreign key (subject_combination_id)
    references public.subject_combinations (id) on delete set null;

-- A student can additionally pick individual "preferred subjects" beyond
-- their combination (spec section 9 explicitly allows individual selection).
create table public.profile_subjects (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  is_preferred boolean not null default true,
  primary key (profile_id, subject_id)
);

-- ---------------------------------------------------------------------
-- Trigger: auto-create a profile row when a new auth user signs up.
-- Required fields (full_name, subject_combination_id) are populated by the
-- registration Server Action immediately after via an UPDATE — see
-- app/register/actions.ts. This trigger just guarantees the row exists.
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New Student'));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at maintenance
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
