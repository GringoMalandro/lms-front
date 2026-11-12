-- Apply the same active-plan rule when eligibility is checked by the quiz grader.
create or replace function public.independizar_can_enroll(target_course_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.courses c
    where c.id = target_course_id and c.published and (
      (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      or exists (
        select 1
        from public.subscriptions s
        join public.plans p on p.id = s.plan_id
        where s.user_id = (select auth.uid())
          and p.active
          and s.status in ('active', 'trialing')
          and (s.current_period_end is null or s.current_period_end > now())
          and (c.required_tier = 'basic' or p.stripe_price_id = 'price_1UaKx7D3V5I3NEtSdRNS5dLH')
      )
    )
  );
$$;

alter table public.courses
  add column cover_image_url text check (cover_image_url is null or cover_image_url ~ '^https://[^[:space:]]+$'),
  add column position integer not null default 0 check (position >= 0);

create table public.course_levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  position integer not null default 0 check (position >= 0),
  unique (id, course_id)
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  level_id uuid not null,
  title text not null check (btrim(title) <> ''),
  position integer not null default 0 check (position >= 0),
  foreign key (level_id, course_id) references public.course_levels(id, course_id) on delete cascade,
  unique (id, course_id)
);

-- Keep existing lessons accessible. An administrator can assign them to a module.
alter table public.lessons
  add column module_id uuid,
  add column vocabulary text,
  add foreign key (module_id, course_id) references public.course_modules(id, course_id);

create index course_levels_order_idx on public.course_levels (course_id, position, id);
create index course_modules_order_idx on public.course_modules (level_id, position, id);
create index lessons_module_idx on public.lessons (module_id, course_id);

alter table public.course_levels enable row level security;
alter table public.course_modules enable row level security;
revoke all on public.course_levels, public.course_modules from public, anon, authenticated;
grant select, insert, update on public.course_levels, public.course_modules to authenticated;

create policy levels_admin_manage on public.course_levels
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy modules_admin_manage on public.course_modules
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy levels_enrolled_read on public.course_levels for select to authenticated using (
  public.independizar_can_enroll(course_id) and exists (
    select 1 from public.enrollments e
    where e.course_id = course_levels.course_id and e.user_id = (select auth.uid())
  )
);
create policy modules_enrolled_read on public.course_modules for select to authenticated using (
  public.independizar_can_enroll(course_id) and exists (
    select 1 from public.enrollments e
    where e.course_id = course_modules.course_id and e.user_id = (select auth.uid())
  )
);

create schema if not exists independizar_private;
revoke all on schema independizar_private from public, anon, authenticated;
grant usage on schema independizar_private to authenticated;

create function independizar_private.valid_quiz(questions jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  question jsonb;
  choice jsonb;
begin
  if jsonb_typeof(questions) is distinct from 'array' then return false; end if;
  if jsonb_array_length(questions) not between 1 and 30 then return false; end if;
  for question in select value from jsonb_array_elements(questions) loop
    if jsonb_typeof(question) <> 'object'
      or jsonb_typeof(question->'prompt') is distinct from 'string'
      or length(btrim(question->>'prompt')) not between 1 and 1000
      or jsonb_typeof(question->'choices') is distinct from 'array'
      or coalesce(question->>'correct', '') !~ '^[0-5]$'
      or jsonb_typeof(question->'correct') is distinct from 'number'
    then return false; end if;
    if jsonb_array_length(question->'choices') not between 2 and 6
      or (question->>'correct')::int >= jsonb_array_length(question->'choices')
    then return false; end if;
    for choice in select value from jsonb_array_elements(question->'choices') loop
      if jsonb_typeof(choice) <> 'string' or length(btrim(choice #>> '{}')) not between 1 and 500
      then return false; end if;
    end loop;
  end loop;
  return true;
end;
$$;
revoke execute on function independizar_private.valid_quiz(jsonb) from public, anon, authenticated;
grant execute on function independizar_private.valid_quiz(jsonb) to authenticated;

create table public.lesson_quizzes (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  questions jsonb not null check (independizar_private.valid_quiz(questions)),
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  published boolean not null default false,
  revision uuid not null default gen_random_uuid()
);
create table public.lesson_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_revision uuid not null,
  answers integer[] not null,
  score integer not null check (score between 0 and 100),
  passing_score integer not null check (passing_score between 0 and 100),
  passed boolean not null,
  submitted_at timestamptz not null default now()
);
create index lesson_quiz_attempts_owner_idx on public.lesson_quiz_attempts (user_id, lesson_id, submitted_at desc);

alter table public.lesson_quizzes enable row level security;
alter table public.lesson_quiz_attempts enable row level security;
revoke all on public.lesson_quizzes, public.lesson_quiz_attempts from public, anon, authenticated;
grant select, insert, update on public.lesson_quizzes to authenticated;
grant select on public.lesson_quiz_attempts to authenticated;
create policy quizzes_admin_manage on public.lesson_quizzes for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy attempts_own_read on public.lesson_quiz_attempts for select to authenticated
  using (user_id = (select auth.uid()));

create function independizar_private.refresh_quiz_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := gen_random_uuid();
  return new;
end;
$$;
revoke execute on function independizar_private.refresh_quiz_revision() from public, anon, authenticated;
create trigger refresh_quiz_revision before update on public.lesson_quizzes
for each row execute function independizar_private.refresh_quiz_revision();

-- Keep the answer key behind RLS. Only this function may write attempts.
create function independizar_private.lesson_quiz(target_lesson uuid, submitted_revision uuid, submitted_answers integer[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  student uuid := auth.uid();
  quiz public.lesson_quizzes%rowtype;
  public_questions jsonb;
  correct_count integer;
  earned integer;
  did_pass boolean;
begin
  if student is null then return null; end if;
  select q.* into quiz from public.lesson_quizzes q
    join public.lessons l on l.id = q.lesson_id
    where q.lesson_id = target_lesson and q.published and l.published
      and (l.available_at is null or l.available_at <= now())
      and public.independizar_can_enroll(l.course_id)
      and exists (
        select 1 from public.enrollments e where e.user_id = student and e.course_id = l.course_id
      );
  if not found then return null; end if;

  if submitted_answers is null then
    select jsonb_agg(jsonb_build_object('prompt', question->'prompt', 'choices', question->'choices') order by ordinal)
      into public_questions from jsonb_array_elements(quiz.questions) with ordinality as item(question, ordinal);
    return jsonb_build_object('revision', quiz.revision, 'passing_score', quiz.passing_score, 'questions', public_questions);
  end if;

  if quiz.revision is distinct from submitted_revision then
    raise exception 'Quiz has changed' using errcode = '22023';
  end if;
  if array_ndims(submitted_answers) is distinct from 1
    or array_lower(submitted_answers, 1) is distinct from 1
    or cardinality(submitted_answers) <> jsonb_array_length(quiz.questions)
    or exists (
      select 1 from jsonb_array_elements(quiz.questions) with ordinality as item(question, ordinal)
      where submitted_answers[ordinal::int] is null or submitted_answers[ordinal::int] < 0
        or submitted_answers[ordinal::int] >= jsonb_array_length(question->'choices')
    )
  then raise exception 'Invalid quiz answers' using errcode = '22023'; end if;

  select count(*) into correct_count
  from jsonb_array_elements(quiz.questions) with ordinality as item(question, ordinal)
  where submitted_answers[ordinal::int] = (question->>'correct')::int;
  earned := correct_count * 100 / cardinality(submitted_answers);
  did_pass := earned >= quiz.passing_score;
  insert into public.lesson_quiz_attempts
    (lesson_id, user_id, quiz_revision, answers, score, passing_score, passed)
    values (target_lesson, student, quiz.revision, submitted_answers, earned, quiz.passing_score, did_pass);
  return jsonb_build_object('score', earned, 'passing_score', quiz.passing_score, 'passed', did_pass);
end;
$$;
revoke execute on function independizar_private.lesson_quiz(uuid, uuid, integer[]) from public, anon, authenticated;
grant execute on function independizar_private.lesson_quiz(uuid, uuid, integer[]) to authenticated;

create function public.independizar_lesson_quiz(target_lesson uuid, submitted_revision uuid default null, submitted_answers integer[] default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select independizar_private.lesson_quiz(target_lesson, submitted_revision, submitted_answers);
$$;
revoke execute on function public.independizar_lesson_quiz(uuid, uuid, integer[]) from public, anon, authenticated;
grant execute on function public.independizar_lesson_quiz(uuid, uuid, integer[]) to authenticated;
