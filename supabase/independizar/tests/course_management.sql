-- Run as a project administrator. Everything rolls back, including test users.
begin;
do $$
declare
  administrator uuid := gen_random_uuid();
  student uuid := gen_random_uuid();
  second_student uuid := gen_random_uuid();
  course uuid := gen_random_uuid();
  other_course uuid := gen_random_uuid();
  first_level uuid := gen_random_uuid();
  second_level uuid := gen_random_uuid();
  module uuid := gen_random_uuid();
  lesson uuid := gen_random_uuid();
  legacy_lesson uuid := gen_random_uuid();
  plan uuid;
  quiz jsonb;
  revision uuid;
  result jsonb;
  n integer;
begin
  select id into strict plan from public.plans where stripe_price_id = 'price_1UaKwkD3V5I3NEtSOeabfZ7j';
  insert into auth.users (id, email, raw_user_meta_data) values
    (administrator, administrator || '@example.invalid', '{}'),
    (student, student || '@example.invalid', '{}'),
    (second_student, second_student || '@example.invalid', '{}');
  insert into public.subscriptions (user_id, plan_id, status, current_period_end) values
    (student, plan, 'active', now() + interval '1 day'),
    (second_student, plan, 'active', now() + interval '1 day');

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object(
    'sub', administrator, 'role', 'authenticated', 'app_metadata', json_build_object('role', 'admin')
  )::text, true);
  insert into public.courses (id, title, description, cover_image_url, level, position) values
    (course, 'Draft English', 'Draft', 'https://example.invalid/cover.jpg', 'Básico', 1),
    (other_course, 'Other course', null, null, 'Intermedio', 2);
  insert into public.course_levels (id, course_id, title, position) values
    (first_level, course, 'First level', 1),
    (second_level, other_course, 'Different course', 1);
  insert into public.course_modules (id, course_id, level_id, title, position)
    values (module, course, first_level, 'First module', 1);
  insert into public.lessons (id, course_id, module_id, title, content, vocabulary, duration_minutes, video_url, position) values
    (lesson, course, module, 'First lesson', 'Explanation', 'Hello', 10, 'https://example.invalid/video', 1),
    (legacy_lesson, course, null, 'Legacy lesson', null, null, null, null, 2);

  update public.courses set title = 'Edited English', position = 3 where id = course;
  update public.course_levels set title = 'Edited level', position = 2 where id = first_level;
  update public.course_modules set title = 'Edited module', position = 2 where id = module;
  update public.lessons set title = 'Edited lesson', position = 3, vocabulary = 'Good morning' where id = lesson;
  assert (select title from public.courses where id = course) = 'Edited English', 'course edit';
  assert (select id from public.courses where id in (course, other_course) order by position limit 1) = other_course, 'course order';
  assert (select title from public.course_levels where id = first_level and position = 2) = 'Edited level', 'level edit';
  assert (select title from public.course_modules where id = module and position = 2) = 'Edited module', 'module edit';
  assert (select vocabulary from public.lessons where id = lesson and title = 'Edited lesson' and position = 3) = 'Good morning', 'lesson edit';
  begin
    update public.course_modules set level_id = second_level where id = module;
    raise exception 'Cross-course level was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.lessons (course_id, module_id, title) values (other_course, module, 'Invalid lesson');
    raise exception 'Cross-course lesson module was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.lesson_quizzes (lesson_id, questions) values
      (lesson, '[{"prompt":"Invalid key","choices":["A","B"],"correct":2}]');
    raise exception 'Invalid answer key was accepted';
  exception when check_violation then null;
  end;
  insert into public.lesson_quizzes (lesson_id, passing_score, questions) values
    (lesson, 75, '[{"prompt":"Hello?","choices":["Hola","Adiós"],"correct":0},{"prompt":"Goodbye?","choices":["Hola","Adiós"],"correct":1}]');

  set local role anon;
  assert (select count(*) from public.courses where id = course) = 0, 'draft course is private';
  assert not has_function_privilege('anon', 'public.independizar_lesson_quiz(uuid,uuid,integer[])', 'EXECUTE'), 'quiz requires login';
  set local role authenticated;
  update public.courses set published = true where id = course;
  update public.lessons set published = true where id in (lesson, legacy_lesson);
  perform set_config('request.jwt.claims', json_build_object('sub', student, 'role', 'authenticated')::text, true);
  assert public.independizar_lesson_quiz(lesson) is null, 'quiz hidden before enrollment';
  assert (select count(*) from public.course_levels where id = first_level) = 0, 'level hidden before enrollment';
  insert into public.enrollments (user_id, course_id) values (student, course);
  assert (select count(*) from public.lessons where id = legacy_lesson) = 1, 'legacy lesson still available';
  assert (select count(*) from public.course_modules where id = module) = 1, 'module visible after enrollment';
  assert public.independizar_lesson_quiz(lesson) is null, 'draft quiz is private';
  assert (select count(*) from public.lesson_quizzes where lesson_id = lesson) = 0, 'answer key table is private';

  update public.courses set title = 'Forbidden' where id = course;
  get diagnostics n = row_count;
  assert n = 0, 'student cannot edit course';
  update public.lessons set title = 'Forbidden' where id = lesson;
  get diagnostics n = row_count;
  assert n = 0, 'student cannot edit lesson';
  update public.lesson_quizzes set passing_score = 0 where lesson_id = lesson;
  get diagnostics n = row_count;
  assert n = 0, 'student cannot edit quiz';
  begin
    insert into public.course_levels (course_id, title) values (course, 'Forbidden');
    raise exception 'Student created curriculum';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claims', json_build_object(
    'sub', administrator, 'role', 'authenticated', 'app_metadata', json_build_object('role', 'admin')
  )::text, true);
  update public.lesson_quizzes set published = true where lesson_id = lesson;
  perform set_config('request.jwt.claims', json_build_object('sub', student, 'role', 'authenticated')::text, true);
  quiz := public.independizar_lesson_quiz(lesson);
  assert jsonb_array_length(quiz->'questions') = 2 and not ((quiz->'questions'->0) ? 'correct'), 'quiz payload omits answer key';
  revision := (quiz->>'revision')::uuid;
  result := public.independizar_lesson_quiz(lesson, revision, array[0,0]);
  assert (result->>'score')::int = 50 and not (result->>'passed')::boolean, 'automatic failing grade';
  result := public.independizar_lesson_quiz(lesson, revision, array[0,1]);
  assert (result->>'score')::int = 100 and (result->>'passed')::boolean, 'automatic passing grade';
  assert (select count(*) from public.lesson_quiz_attempts where lesson_id = lesson and user_id = student) = 2, 'saved attempts';
  begin
    perform public.independizar_lesson_quiz(lesson, revision, array[99,1]);
    raise exception 'Invalid selection was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    insert into public.lesson_quiz_attempts (lesson_id, user_id, quiz_revision, answers, score, passing_score, passed)
      values (lesson, student, revision, array[0,1], 100, 75, true);
    raise exception 'Student inserted an ungraded attempt';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', second_student, 'role', 'authenticated')::text, true);
  assert (select count(*) from public.lesson_quiz_attempts where lesson_id = lesson) = 0, 'attempt isolation';
  assert public.independizar_lesson_quiz(lesson, revision, array[0,1]) is null, 'unenrolled submission denied';
  perform set_config('request.jwt.claims', json_build_object(
    'sub', administrator, 'role', 'authenticated', 'app_metadata', json_build_object('role', 'admin')
  )::text, true);
  update public.lesson_quizzes set passing_score = 50 where lesson_id = lesson;
  perform set_config('request.jwt.claims', json_build_object('sub', student, 'role', 'authenticated')::text, true);
  begin
    perform public.independizar_lesson_quiz(lesson, revision, array[0,1]);
    raise exception 'Old quiz revision was accepted';
  exception when invalid_parameter_value then null;
  end;
  assert (select count(*) from public.lesson_quiz_attempts where lesson_id = lesson and passing_score = 75) = 2, 'past passing score retained';

  perform set_config('request.jwt.claims', json_build_object(
    'sub', administrator, 'role', 'authenticated', 'app_metadata', json_build_object('role', 'admin')
  )::text, true);
  update public.lessons set available_at = now() + interval '1 day' where id = lesson;
  perform set_config('request.jwt.claims', json_build_object('sub', student, 'role', 'authenticated')::text, true);
  assert public.independizar_lesson_quiz(lesson) is null, 'unreleased lesson quiz is private';
end;
$$;
select 'PASS: Independizar course management database checks' as result;
rollback;
