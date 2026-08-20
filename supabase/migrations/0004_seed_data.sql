-- 0004_seed_data.sql
-- Placeholder seed data so Phase 1 is testable end-to-end. This is NOT
-- official NCDC/UNEB curriculum content (spec sections 34 & 38) — swap for
-- real data via the admin dashboard once available.

insert into public.subjects (name, category) values
  ('Physics', 'Sciences'),
  ('Chemistry', 'Sciences'),
  ('Mathematics', 'Sciences'),
  ('Biology', 'Sciences'),
  ('Economics', 'Commercial'),
  ('Entrepreneurship', 'Commercial'),
  ('History', 'Arts'),
  ('Geography', 'Arts'),
  ('Literature in English', 'Arts'),
  ('Computer Science', 'ICT'),
  ('General Paper', 'Compulsory');

insert into public.subject_combinations (code, display_name) values
  ('PCM', 'Physics, Chemistry, Mathematics'),
  ('PCB', 'Physics, Chemistry, Biology'),
  ('MEG', 'Mathematics, Economics, Geography'),
  ('HEG', 'History, Economics, Geography'),
  ('BCM', 'Biology, Chemistry, Mathematics');

insert into public.subject_combination_subjects (subject_combination_id, subject_id)
select sc.id, s.id
from public.subject_combinations sc
join public.subjects s on
  (sc.code = 'PCM' and s.name in ('Physics', 'Chemistry', 'Mathematics'))
  or (sc.code = 'PCB' and s.name in ('Physics', 'Chemistry', 'Biology'))
  or (sc.code = 'MEG' and s.name in ('Mathematics', 'Economics', 'Geography'))
  or (sc.code = 'HEG' and s.name in ('History', 'Economics', 'Geography'))
  or (sc.code = 'BCM' and s.name in ('Biology', 'Chemistry', 'Mathematics'));

insert into public.curricula (name, version_label, is_active) values
  ('Uganda Advanced Secondary Curriculum', '2026 UACE', true);

-- Example strand/topic/subtopic for Physics, illustrating the hierarchy —
-- placeholder content only, flagged for admin replacement.
insert into public.curriculum_strands (curriculum_id, subject_id, name, position)
select c.id, s.id, 'Mechanics', 1
from public.curricula c, public.subjects s
where c.version_label = '2026 UACE' and s.name = 'Physics';

insert into public.topics (strand_id, name, position)
select cs.id, 'Problem Solving in Kinematics', 1
from public.curriculum_strands cs where cs.name = 'Mechanics';

insert into public.subtopics (topic_id, name, position)
select t.id, 'Application of motion equations', 1
from public.topics t where t.name = 'Problem Solving in Kinematics';

insert into public.competencies (name, description) values
  ('Problem solving', 'Applying known methods to unfamiliar, real-life scenarios'),
  ('Critical thinking', 'Evaluating evidence and reasoning before concluding'),
  ('Application', 'Using knowledge in a practical or scenario-based context')
on conflict (name) do nothing;
