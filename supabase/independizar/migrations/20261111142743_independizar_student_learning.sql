-- The Independizar project has its own schema and migration history.
-- Keep the subscription rules already used by published lessons.
create function public.independizar_can_enroll(target_course_id uuid)
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
          and s.status in ('active', 'trialing')
          and (s.current_period_end is null or s.current_period_end > now())
          and (c.required_tier = 'basic' or p.stripe_price_id = 'price_1UaKx7D3V5I3NEtSdRNS5dLH')
      )
    )
  );
$$;

revoke execute on function public.independizar_can_enroll(uuid) from public, anon;
grant execute on function public.independizar_can_enroll(uuid) to authenticated;

create policy own_eligible_enrollments_insert on public.enrollments
for insert to authenticated
with check (
  user_id = (select auth.uid()) and public.independizar_can_enroll(course_id)
);

alter policy published_lessons_read on public.lessons using (
  published
  and (available_at is null or available_at <= now())
  and public.independizar_can_enroll(course_id)
  and exists (
    select 1 from public.enrollments e
    where e.user_id = (select auth.uid()) and e.course_id = lessons.course_id
  )
);

-- The existing progress INSERT policy joins lessons and enrollments, so it
-- inherits these publication, release date, enrollment and tier checks.
-- TRUNCATE does not go through row-level security.
revoke truncate, trigger, references on
  public.profiles, public.courses, public.lessons, public.enrollments,
  public.lesson_progress, public.plans, public.subscriptions
from anon, authenticated;

create index if not exists independizar_lessons_course_position_idx
  on public.lessons (course_id, position, id);
create index if not exists independizar_subscriptions_user_idx
  on public.subscriptions (user_id);
