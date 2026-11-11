'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchAllRows } from '@/lib/supabase/fetch-all-rows'
import { nextPosition, toOne, type CourseLevel, type CourseModule } from '@/lib/independizar/course-management'
import { AdminForm, field, httpsField, LongField, numberField, Publication, SelectField, TextField } from './admin-fields'
import { IndependizarAdminCourseOverview } from './admin-course-overview'
import { IndependizarLessonEditor, type ManagedLesson } from './lesson-editor'

type Course = {
  id: string
  title: string
  description: string | null
  level: string | null
  required_tier: string
  position: number
  duration_minutes: number | null
  cover_image_url: string | null
  published: boolean
}

function CourseForm({ course, position, refresh }: { course?: Course; position: number; refresh: () => Promise<void> }) {
  async function save(data: FormData) {
    const values = {
      title: field(data, 'title'),
      description: field(data, 'description') || null,
      level: field(data, 'level') || null,
      required_tier: field(data, 'required_tier'),
      position: numberField(data, 'position') ?? position,
      duration_minutes: numberField(data, 'duration_minutes'),
      cover_image_url: httpsField(data, 'cover_image_url', 'Portada'),
      published: field(data, 'published') === 'yes',
    }
    if (!values.title) throw new Error('Introduce un título.')
    const query = createClient().from('courses')
    const result = course ? await query.update(values).eq('id', course.id).select('id').single()
      : await query.insert(values).select('id').single()
    if (result.error) throw new Error(result.error.message)
    await refresh()
  }

  return <AdminForm save={save} reset={!course} label={course ? 'Guardar curso' : 'Crear curso'}>
    <TextField name="title" label="Título del curso" value={course?.title} required />
    <TextField name="cover_image_url" label="Enlace HTTPS de la portada" type="url" value={course?.cover_image_url} />
    <LongField name="description" label="Descripción" value={course?.description} />
    <SelectField name="level" label="Dificultad" value={course?.level}>
      <option value="">Sin definir</option>
      {['Básico', 'Intermedio', 'Avanzado'].map((level) => <option key={level}>{level}</option>)}
    </SelectField>
    <SelectField name="required_tier" label="Membresía requerida" value={course?.required_tier ?? 'basic'}>
      <option value="basic">Básico</option><option value="premium">Premium</option>
    </SelectField>
    <TextField name="position" label="Orden" type="number" value={course?.position ?? position} required />
    <TextField name="duration_minutes" label="Duración estimada (minutos)" type="number" value={course?.duration_minutes} />
    <Publication value={course?.published} />
  </AdminForm>
}

function CurriculumForm({ courseId, levels, levelId, row, position, refresh }: {
  courseId: string
  levels: readonly CourseLevel[]
  levelId?: string
  row?: CourseLevel
  position: number
  refresh: () => Promise<void>
}) {
  const noun = levelId ? 'módulo' : 'nivel'
  async function save(data: FormData) {
    const values = {
      course_id: courseId,
      title: field(data, 'title'),
      position: numberField(data, 'position') ?? position,
      ...(levelId ? { level_id: field(data, 'level_id') } : {}),
    }
    if (!values.title) throw new Error('Introduce un nombre.')
    const query = createClient().from(levelId ? 'course_modules' : 'course_levels')
    const result = row ? await query.update(values).eq('id', row.id).select('id').single()
      : await query.insert(values).select('id').single()
    if (result.error) throw new Error(result.error.message)
    await refresh()
  }

  return <AdminForm save={save} reset={!row} label={row ? `Guardar ${noun}` : `Crear ${noun}`}>
    <TextField name="title" label={`Nombre del ${noun}`} value={row?.title} required />
    <TextField name="position" label="Orden" type="number" value={row?.position ?? position} required />
    {levelId && <SelectField name="level_id" label="Nivel" value={levelId}>
      {levels.map((level) => <option key={level.id} value={level.id}>{level.title}</option>)}
    </SelectField>}
  </AdminForm>
}

function Curriculum({ courseId }: { courseId: string }) {
  const [levels, setLevels] = useState<CourseLevel[]>([])
  const [modules, setModules] = useState<CourseModule[]>([])
  const [lessons, setLessons] = useState<ManagedLesson[]>([])
  const [status, setStatus] = useState('Cargando contenido…')
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(() => {
    const supabase = createClient()
    return Promise.all([
        fetchAllRows('course levels', (from, to) => supabase.from('course_levels').select('id,title,position', { count: 'exact' })
          .eq('course_id', courseId).order('position').order('id').range(from, to)),
        fetchAllRows('course modules', (from, to) => supabase.from('course_modules').select('id,title,position,level_id', { count: 'exact' })
          .eq('course_id', courseId).order('position').order('id').range(from, to)),
        fetchAllRows('course lessons', (from, to) => supabase.from('lessons')
          .select('id,title,position,module_id,content,vocabulary,video_url,duration_minutes,published,lesson_quizzes(questions,passing_score,published)', { count: 'exact' })
          .eq('course_id', courseId).order('position').order('id').range(from, to)),
    ]).then(([levelRows, moduleRows, lessonRows]) => {
      setLevels(levelRows)
      setModules(moduleRows)
      setLessons(lessonRows.map((lesson) => ({ ...lesson, lesson_quizzes: toOne(lesson.lesson_quizzes) })))
      setLoaded(true)
      setStatus('')
    }).catch(() => {
      setStatus('No se pudo cargar el contenido. Vuelve a abrir el curso.')
    })
  }, [courseId])

  useEffect(() => { void refresh() }, [refresh])

  function lessonEditors(moduleId: string | null) {
    const rows = lessons.filter((lesson) => lesson.module_id === moduleId)
    return <>
      {rows.map((lesson) => <IndependizarLessonEditor key={lesson.id} courseId={courseId} modules={modules}
        moduleId={moduleId} position={lesson.position} lesson={lesson} refresh={refresh} />)}
      {moduleId && <IndependizarLessonEditor key={nextPosition(rows)} courseId={courseId} modules={modules}
        moduleId={moduleId} position={nextPosition(rows)} refresh={refresh} />}
    </>
  }

  return <section className="space-y-4">
    <h3 className="text-lg font-semibold">Contenido del curso</h3>
    {status && <p role={loaded || status.startsWith('No') ? 'alert' : 'status'}>{status}</p>}
    {loaded && <>
      <details className="rounded-lg border p-3">
        <summary className="mb-2 cursor-pointer font-medium">Nuevo nivel</summary>
        <CurriculumForm key={nextPosition(levels)} courseId={courseId} levels={levels}
          position={nextPosition(levels)} refresh={refresh} />
      </details>
      {levels.map((level) => {
        const levelModules = modules.filter((module) => module.level_id === level.id)
        return <details key={level.id} className="space-y-3 rounded-lg border p-3">
          <summary className="cursor-pointer font-semibold">{level.position}. {level.title}</summary>
          <CurriculumForm courseId={courseId} levels={levels} row={level} position={level.position} refresh={refresh} />
          <details className="rounded-lg border p-3">
            <summary className="mb-2 cursor-pointer font-medium">Nuevo módulo</summary>
            <CurriculumForm key={nextPosition(levelModules)} courseId={courseId} levels={levels}
              levelId={level.id} position={nextPosition(levelModules)} refresh={refresh} />
          </details>
          {levelModules.map((module) => <details key={module.id} className="space-y-3 rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">{module.position}. {module.title}</summary>
            <CurriculumForm courseId={courseId} levels={levels} row={module} levelId={level.id} position={module.position} refresh={refresh} />
            {lessonEditors(module.id)}
          </details>)}
        </details>
      })}
      {lessons.some((lesson) => lesson.module_id === null) && <section className="space-y-2">
        <h4 className="font-medium">Lecciones sin módulo</h4>
        {lessonEditors(null)}
      </section>}
    </>}
  </section>
}

export function IndependizarAdminCourseManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [status, setStatus] = useState('Cargando cursos…')

  const refresh = useCallback(() => fetchAllRows('academy courses', (from, to) => createClient().from('courses')
    .select('id,title,description,level,required_tier,position,duration_minutes,cover_image_url,published', { count: 'exact' })
    .order('position').order('created_at', { ascending: false }).order('id').range(from, to))
    .then((rows) => {
      setCourses(rows)
      setStatus('')
    }).catch(() => {
      setStatus('No se pudieron cargar los cursos.')
    }), [])

  useEffect(() => { void refresh() }, [refresh])

  return <div className="mx-auto max-w-5xl space-y-4 px-4 sm:px-6">
    <h1 className="text-3xl font-bold">Administrar cursos</h1>
    {status && <p role={status.startsWith('No') ? 'alert' : 'status'}>{status}</p>}
    <details className="rounded-xl border p-4">
      <summary className="mb-2 cursor-pointer font-semibold">Nuevo curso</summary>
      <CourseForm key={nextPosition(courses)} position={nextPosition(courses)} refresh={refresh} />
    </details>
    <IndependizarAdminCourseOverview courses={courses} renderCourse={(course) => <section className="rounded-xl border p-4">
      <h2>
        <button type="button" className="w-full text-left font-semibold" aria-expanded={selected === course.id}
          aria-controls={`course-${course.id}`} onClick={() => setSelected(selected === course.id ? null : course.id)}>
          {course.position}. {course.title} · {course.published ? 'Publicado' : 'Borrador'}
        </button>
      </h2>
      {selected === course.id && <div id={`course-${course.id}`} className="mt-3 space-y-6">
        <CourseForm course={course} position={course.position} refresh={refresh} />
        <Curriculum courseId={course.id} />
      </div>}
    </section>} />
  </div>
}
