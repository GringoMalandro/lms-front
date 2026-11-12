'use client'

import { createClient } from '@/lib/supabase/client'
import type { CourseModule } from '@/lib/independizar/course-management'
import { AdminForm, field, httpsField, LongField, numberField, Publication, SelectField, TextField } from './admin-fields'
import { QuizEditor, type QuizDraft } from './quiz-editor'

export type ManagedLesson = {
  id: string
  title: string
  module_id: string | null
  position: number
  content: string | null
  vocabulary: string | null
  video_url: string | null
  duration_minutes: number | null
  published: boolean
  lesson_quizzes: QuizDraft | null
}

export function IndependizarLessonEditor({ courseId, modules, moduleId, position, lesson, refresh }: {
  courseId: string
  modules: readonly CourseModule[]
  moduleId: string | null
  position: number
  lesson?: ManagedLesson
  refresh: () => Promise<void>
}) {
  async function save(data: FormData) {
    const values = {
      course_id: courseId,
      module_id: field(data, 'module_id') || null,
      title: field(data, 'title'),
      content: field(data, 'content') || null,
      vocabulary: field(data, 'vocabulary') || null,
      video_url: httpsField(data, 'video_url', 'Video'),
      duration_minutes: numberField(data, 'duration_minutes'),
      position: numberField(data, 'position') ?? position,
      published: field(data, 'published') === 'yes',
    }
    if (!values.title) throw new Error('Introduce un título.')
    const query = createClient().from('lessons')
    const result = lesson ? await query.update(values).eq('id', lesson.id).select('id').single()
      : await query.insert(values).select('id').single()
    if (result.error) throw new Error(result.error.message)
    await refresh()
  }

  return <details className="rounded-lg border p-3">
    <summary className="cursor-pointer font-medium">
      {lesson ? `${lesson.position}. ${lesson.title} · ${lesson.published ? 'Publicada' : 'Borrador'}` : 'Nueva lección'}
    </summary>
    <div className="mt-3">
      <AdminForm save={save} reset={!lesson} label={lesson ? 'Guardar lección' : 'Crear lección'}>
        <TextField name="title" label="Título de la lección" value={lesson?.title} required />
        <SelectField name="module_id" label="Módulo" value={lesson?.module_id ?? moduleId}>
          <option value="">Sin módulo</option>
          {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
        </SelectField>
        <LongField name="content" label="Explicación" value={lesson?.content} />
        <LongField name="vocabulary" label="Vocabulario (un término por línea)" value={lesson?.vocabulary} />
        <TextField name="video_url" label="Enlace HTTPS del video" type="url" value={lesson?.video_url} />
        <TextField name="duration_minutes" label="Duración (minutos)" type="number" value={lesson?.duration_minutes} />
        <TextField name="position" label="Orden" type="number" required value={lesson?.position ?? position} />
        <Publication value={lesson?.published} />
      </AdminForm>
      {lesson && <QuizEditor lessonId={lesson.id} quiz={lesson.lesson_quizzes} />}
    </div>
  </details>
}
