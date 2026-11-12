-- Run as a project administrator against the Independizar database.
-- Each fixture is transaction-scoped and all assertions run as API roles.
begin;
do $$
declare
  alice uuid := gen_random_uuid();
  bob uuid := gen_random_uuid();
  basic_plan uuid;
  premium_plan uuid;
  basic_course uuid := gen_random_uuid();
  premium_course uuid := gen_random_uuid();
  draft_course uuid := gen_random_uuid();
  first_lesson uuid := gen_random_uuid();
  future_lesson uuid := gen_random_uuid();
  draft_lesson uuid := gen_random_uuid();
  n integer;
begin
  select id into strict basic_plan from public.plans where stripe_price_id = 'price_1UaKwkD3V5I3NEtSOeabfZ7j';
  select id into strict premium_plan from public.plans where stripe_price_id = 'price_1UaKx7D3V5I3NEtSdRNS5dLH';
  insert into auth.users (id, email, raw_user_meta_data) values
    (alice, alice || '@example.invalid', '{"full_name":"Test Student"}'),
    (bob, bob || '@example.invalid', '{}');
  insert into public.courses (id, title, published, required_tier) values
    (basic_course, 'Test basic course', true, 'basic'),
    (premium_course, 'Test premium course', true, 'premium'),
    (draft_course, 'Test draft course', false, 'basic');
  insert into public.lessons (id, course_id, title, published, available_at) values
    (first_lesson, basic_course, 'Test available lesson', true, null),
    (future_lesson, basic_course, 'Test future lesson', true, now() + interval '1 day'),
    (draft_lesson, basic_course, 'Test draft lesson', false, null);
  insert into public.subscriptions (user_id, plan_id, status, current_period_end) values
    (alice, basic_plan, 'active', now() + interval '1 day'),
    (bob, premium_plan, 'trialing', now() - interval '1 day');

  set local role anon;
  assert (select count(*) from public.courses where id in (basic_course, draft_course)) = 1, 'anonymous catalog publication';
  assert (select count(*) from public.lessons where id = first_lesson) = 0, 'anonymous lesson isolation';
  assert not has_table_privilege('anon', 'public.profiles', 'TRUNCATE'), 'anonymous truncate privilege';
  reset role;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true);
  assert (select display_name from public.profiles where id = alice) = 'Test Student', 'profile creation trigger';
  assert (select count(*) from public.profiles where id = bob) = 0, 'profile ownership';
  update public.profiles set display_name = 'Other student' where id = bob;
  get diagnostics n = row_count;
  assert n = 0, 'profile update ownership';
  insert into public.profiles (id, display_name) values (alice, 'Updated name')
    on conflict (id) do update set display_name = excluded.display_name;
  assert (select display_name from public.profiles where id = alice) = 'Updated name', 'profile update';
  assert not has_table_privilege('authenticated', 'public.lesson_progress', 'TRUNCATE'), 'authenticated truncate privilege';

  assert public.independizar_can_enroll(basic_course), 'basic entitlement';
  assert not public.independizar_can_enroll(premium_course), 'premium tier required';
  assert not public.independizar_can_enroll(draft_course), 'draft course excluded';
  assert (select count(*) from public.lessons where id = first_lesson) = 0, 'enrollment required for lessons';
  begin
    insert into public.enrollments (user_id, course_id) values (alice, premium_course);
    raise exception 'Premium enrollment was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.enrollments (user_id, course_id) values (bob, basic_course);
    raise exception 'Cross-account enrollment was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.lesson_progress (user_id, lesson_id) values (alice, first_lesson);
    raise exception 'Unenrolled progress was allowed';
  exception when insufficient_privilege then null;
  end;

  insert into public.enrollments (user_id, course_id) values (alice, basic_course) on conflict do nothing;
  insert into public.enrollments (user_id, course_id) values (alice, basic_course) on conflict do nothing;
  assert (select count(*) from public.enrollments where course_id = basic_course) = 1, 'idempotent enrollment';
  assert (select count(*) from public.lessons where id in (first_lesson, future_lesson, draft_lesson)) = 1, 'only released and published lessons';
  begin
    insert into public.lesson_progress (user_id, lesson_id) values (alice, future_lesson);
    raise exception 'Unreleased lesson progress was allowed';
  exception when insufficient_privilege then null;
  end;
  insert into public.lesson_progress (user_id, lesson_id) values (alice, first_lesson) on conflict do nothing;
  insert into public.lesson_progress (user_id, lesson_id) values (alice, first_lesson) on conflict do nothing;
  assert (select count(*) from public.lesson_progress where lesson_id = first_lesson) = 1, 'idempotent completion';

  perform set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true);
  assert not public.independizar_can_enroll(premium_course), 'expired subscription';
  assert (select count(*) from public.enrollments where user_id = alice) = 0, 'enrollment ownership';
  assert (select count(*) from public.lesson_progress where lesson_id = first_lesson) = 0, 'progress ownership';
  reset role;

  update public.subscriptions set current_period_end = now() + interval '1 day' where user_id = bob;
  set local role authenticated;
  assert public.independizar_can_enroll(premium_course), 'premium trial entitlement';
  assert public.independizar_can_enroll(basic_course), 'premium includes basic access';
  insert into public.enrollments (user_id, course_id) values (bob, basic_course);
  begin
    insert into public.lesson_progress (user_id, lesson_id) values (alice, first_lesson);
    raise exception 'Cross-account progress was allowed';
  exception when insufficient_privilege then null;
  end;
  reset role;

  update public.subscriptions set current_period_end = now() - interval '1 day' where user_id = alice;
  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true);
  set local role authenticated;
  assert (select count(*) from public.lessons where id = first_lesson) = 0, 'expired member lesson access revoked';
  assert (select count(*) from public.lesson_progress where lesson_id = first_lesson) = 1, 'expired member progress retained';
end;
$$;
select 'PASS: Independizar student learning database checks' as result;
rollback;
