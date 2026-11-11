import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { AcademiaVideoPreview } from '@/components/independizar/academia-video-preview'
import { StudentButton } from '@/components/independizar/student-controls'
import { getLessonVideoLink, isAcademyHost, isAcademyId, summarizeLessons } from '@/lib/independizar/academy'
import { fetchAllRows } from '@/lib/supabase/fetch-all-rows'
import { createClient } from '@/lib/supabase/server'

export default async function AcademiaCoursePage({ params, searchParams }: {
  params: Promise<{ locale: string; courseId: string }>
  searchParams: Promise<{ lesson?: string | string[] }>
}) {
  const { locale, courseId } = await params
  if (!isAcademyHost((await headers()).get('host')) || !isAcademyId(courseId)) notFound()
  const english = locale === 'en'
  const catalog = `/${locale}/academia`
  const coursePath = `${catalog}/${courseId}`
  const supabase = await createClient()
  const [{ data: course, error }, { data: { user } }] = await Promise.all([
    supabase.from('courses').select('id,title,description,level,duration_minutes')
      .eq('id', courseId).eq('published', true).maybeSingle(),
    supabase.auth.getUser(),
  ])
  if (error) throw new Error('Unable to load academy course')
  if (!course) notFound()

  const [eligibility, enrollment] = user ? await Promise.all([
    supabase.rpc('independizar_can_enroll', { target_course_id: courseId }),
    supabase.from('enrollments').select('course_id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
  ]) : [null, null]
  const eligible = eligibility?.data === true
  const enrolled = Boolean(enrollment?.data)
  const accessError = eligibility?.error || enrollment?.error

  let learning: React.ReactNode = null
  if (user && enrolled && eligible && !accessError) {
    const lessonList = await fetchAllRows('academy lessons', (from, to) => supabase.from('lessons')
      .select('id,title,lesson_progress(completed_at)', { count: 'exact' }).eq('course_id', courseId)
      .eq('published', true).eq('lesson_progress.user_id', user.id)
      .order('position').order('id').range(from, to))
    const completed = new Set<string>(lessonList.filter((lesson) => lesson.lesson_progress.length).map((lesson) => lesson.id))
    const progress = summarizeLessons(lessonList, completed)
    const requested = (await searchParams).lesson
    const selected = requested === undefined ? (progress.nextLesson ?? lessonList[0])
      : lessonList.find((lesson) => lesson.id === requested)
    if (requested !== undefined && !selected) notFound()

    const { data: lesson, error: contentError } = selected ? await supabase.from('lessons')
      .select('id,title,content,video_url').eq('id', selected.id).eq('course_id', courseId)
      .eq('published', true).maybeSingle() : { data: null, error: null }
    if (contentError) throw new Error('Unable to load academy lesson')
    const video = getLessonVideoLink(lesson?.video_url ?? null)

    learning = (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{english ? 'Course lessons' : 'Lecciones del curso'}</h2>
        <p>{progress.percent}% · {progress.completed}/{progress.total} {english ? 'lessons complete' : 'lecciones completadas'}</p>
        {lessonList.length === 0 && <p>{english ? 'Lessons are coming soon.' : 'Las lecciones estarán disponibles próximamente.'}</p>}
        <ol className="space-y-2">
          {lessonList.map((item) => (
            <li key={item.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3">
              <Link href={`${coursePath}?lesson=${item.id}`} aria-current={lesson?.id === item.id ? 'page' : undefined}
                className="font-medium underline">
                {item.title}
              </Link>
              {completed.has(item.id) && <span>{english ? 'Complete' : 'Completada'}</span>}
            </li>
          ))}
        </ol>
        {lesson && (
          <article className="space-y-4 rounded-xl border p-5">
            <h3 className="text-xl font-bold">{lesson.title}</h3>
            {lesson.content && <p className="whitespace-pre-wrap break-words">{lesson.content}</p>}
            {video && <a href={video} className="block font-medium underline" target="_blank" rel="noreferrer">
              {english ? 'Watch lesson video' : 'Ver video de la lección'}
            </a>}
            {completed.has(lesson.id)
              ? <p>{english ? 'Lesson completed.' : 'Lección completada.'}</p>
              : <StudentButton key={lesson.id} kind="complete" lessonId={lesson.id} userId={user.id} english={english} />}
            {progress.nextLesson && progress.nextLesson.id !== lesson.id && (
              <Link href={`${coursePath}?lesson=${progress.nextLesson.id}`} className="inline-block font-medium underline">
                {english ? 'Continue to next unfinished lesson' : 'Continuar con la siguiente lección pendiente'}
              </Link>
            )}
          </article>
        )}
      </section>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-5 pb-16 pt-28">
      <Link href={catalog} className="text-sm font-semibold underline">
        {english ? '← All courses' : '← Todos los cursos'}
      </Link>
      <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
        <h1 className="text-4xl font-bold">{course.title}</h1>
        <p className="mt-3">{course.level || (english ? 'Course' : 'Curso')}{course.duration_minutes != null ? ` · ${course.duration_minutes} min` : ''}</p>
      </div>
      <p className="whitespace-pre-wrap text-lg leading-8">{course.description}</p>
      {accessError ? (
        <p role="alert">{english ? 'Unable to check course access.' : 'No se pudo verificar el acceso al curso.'}</p>
      ) : !user ? (
        <Link href={`/${locale}/auth/login?next=${encodeURIComponent(coursePath)}`} className="font-medium underline">
          {english ? 'Sign in to enroll' : 'Inicia sesión para inscribirte'}
        </Link>
      ) : !eligible ? (
        <Link href={`/${locale}/suscripciones`} className="font-medium underline">
          {english ? 'See membership plans for course access' : 'Consulta los planes para acceder al curso'}
        </Link>
      ) : !enrolled ? (
        <StudentButton kind="enroll" courseId={courseId} userId={user.id} english={english} />
      ) : learning}
      {!enrolled && <AcademiaVideoPreview />}
    </main>
  )
}
