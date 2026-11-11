import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { StudentProfile } from '@/components/independizar/student-controls'
import { academyAccountPath, isAcademyHost, summarizeLessons } from '@/lib/independizar/academy'
import { fetchAllRows } from '@/lib/supabase/fetch-all-rows'
import { createClient } from '@/lib/supabase/server'

export default async function StudentAccount({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isAcademyHost((await headers()).get('host'))) notFound()
  const english = locale === 'en'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login?next=${encodeURIComponent(academyAccountPath)}`)

  const [profile, enrollments] = await Promise.all([
    supabase.from('profiles').select('display_name, username').eq('id', user.id).maybeSingle(),
    fetchAllRows('academy enrollments', (from, to) => supabase.from('enrollments')
      .select('course_id, course:courses(title, lessons(id, lesson_progress(completed_at)))', { count: 'exact' })
      .eq('user_id', user.id).eq('course.published', true)
      .eq('course.lessons.lesson_progress.user_id', user.id)
      .order('enrolled_at', { ascending: false }).order('course_id').range(from, to))
      .catch(() => null),
  ])
  const catalog = `/${locale}/academia`
  const courses = (enrollments ?? []).flatMap((row) => {
    const course = Array.isArray(row.course) ? row.course[0] : row.course
    if (!course) return []
    const completedIds = new Set<string>(course.lessons.filter((lesson) => lesson.lesson_progress.length).map((lesson) => lesson.id))
    return [{ id: row.course_id, title: course.title, ...summarizeLessons(course.lessons, completedIds) }]
  })

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-10 px-5 pb-16 pt-28">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">{english ? 'My account' : 'Mi cuenta'}</h1>
        <div className="flex flex-wrap items-center gap-3">
          {user.app_metadata?.role === 'admin' && (
            <Link href={`/${locale}/admin-cursos`} className="font-medium underline">
              {english ? 'Manage courses' : 'Administrar cursos'}
            </Link>
          )}
          <LogoutButton label={english ? 'Sign out' : 'Cerrar sesión'} />
        </div>
      </div>
      <section className="max-w-md rounded-xl border p-5">
        <h2 className="text-xl font-bold">{english ? 'Profile' : 'Perfil'}</h2>
        <p className="mt-2 break-all">{user.email}</p>
        {profile.data?.username && <p className="text-sm text-muted-foreground">@{profile.data.username}</p>}
        {profile.error
          ? <p role="alert">{english ? 'Unable to load your profile.' : 'No se pudo cargar tu perfil.'}</p>
          : <StudentProfile userId={user.id} displayName={profile.data?.display_name ?? ''} english={english} />}
      </section>
      <section>
        <h2 className="text-2xl font-bold">{english ? 'My courses' : 'Mis cursos'}</h2>
        <Link href={catalog} className="mt-2 inline-block font-medium underline">
          {english ? 'Browse courses' : 'Explorar cursos'}
        </Link>
        {enrollments === null ? (
          <p role="alert" className="mt-4">{english ? 'Unable to load your courses and progress.' : 'No se pudieron cargar tus cursos y tu progreso.'}</p>
        ) : courses.length === 0 ? (
          <p className="mt-4">{english ? 'You have no enrolled courses yet.' : 'Todavía no tienes cursos inscritos.'}</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <li key={course.id} className="space-y-2 rounded-xl border p-5">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                {course.total > 0 && (
                  <p>{course.percent}% · {course.completed}/{course.total} {english ? 'lessons complete' : 'lecciones completadas'}</p>
                )}
                <Link href={`${catalog}/${course.id}`} className="inline-block font-medium underline">
                  {course.percent > 0 && course.percent < 100
                    ? (english ? 'Resume course' : 'Continuar curso')
                    : (english ? 'Open course' : 'Abrir curso')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
