-- 0002_curriculum.sql
-- Curriculum engine — deliberately independent from the content that will
-- later reference it (papers, questions, discussions). Nothing here is
-- hard-coded into UI components; this is pure catalogue data (spec sec. 10).
--
-- Hierarchy: curriculum -> subject (existing table) -> strand -> topic ->
-- subtopic -> learning_outcome -> competency/skill.

create table public.curricula (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. 'Uganda Advanced Secondary Curriculum'
  version_label text not null, -- e.g. '2026 UACE'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.curriculum_strands (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  name text not null, -- e.g. 'Mechanics'
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index curriculum_strands_subject_idx on public.curriculum_strands (subject_id);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  strand_id uuid not null references public.curriculum_strands (id) on delete cascade,
  name text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index topics_strand_idx on public.topics (strand_id);

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  name text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index subtopics_topic_idx on public.subtopics (topic_id);

create table public.learning_outcomes (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null references public.subtopics (id) on delete cascade,
  description text not null,
  created_at timestamptz not null default now()
);

create index learning_outcomes_subtopic_idx on public.learning_outcomes (subtopic_id);

-- Competencies/skills are reusable tags, not owned by one subtopic — a
-- competency like "Problem solving" applies across many outcomes.
create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g. 'Critical thinking', 'Inquiry'
  description text,
  created_at timestamptz not null default now()
);

create table public.learning_outcome_competencies (
  learning_outcome_id uuid not null references public.learning_outcomes (id) on delete cascade,
  competency_id uuid not null references public.competencies (id) on delete cascade,
  primary key (learning_outcome_id, competency_id)
);

-- ---------------------------------------------------------------------
-- exam_configuration — backs the UACE countdown (spec section 23).
-- Never hard-code the exam date in the UI; admins update this row.
-- ---------------------------------------------------------------------
create table public.exam_configuration (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'UACE 2026',
  exam_date date not null,
  is_active boolean not null default true,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

-- Only one active exam configuration at a time.
create unique index exam_configuration_one_active_idx
  on public.exam_configuration (is_active)
  where is_active = true;

-- Seed placeholder — admin must confirm/update via admin dashboard
-- (spec section 38: use placeholders, never fabricate official dates as final).
insert into public.exam_configuration (label, exam_date, is_active)
values ('UACE 2026', '2026-11-02', true);
