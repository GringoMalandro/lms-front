export type QuizQuestion = { prompt: string; choices: string[] }
export type AdminQuizQuestion = QuizQuestion & { correct: number }
export type StudentQuiz = { revision: string; passing_score: number; questions: QuizQuestion[] }
export type QuizResult = { score: number; passing_score: number; passed: boolean }

export type CourseLevel = { id: string; title: string; position: number }
export type CourseModule = CourseLevel & { level_id: string }

type LessonPosition = {
  id: string
  position: number
  course_modules: {
    id: string
    title: string
    position: number
    course_levels: CourseLevel | null
  } | null
}

export function orderCourseLessons<T extends LessonPosition>(lessons: readonly T[]): T[] {
  return [...lessons].sort((a, b) => {
    const aModule = a.course_modules
    const bModule = b.course_modules
    const aLevel = aModule?.course_levels
    const bLevel = bModule?.course_levels
    if (aModule && !bModule) return -1
    if (!aModule && bModule) return 1
    return (aLevel?.position ?? 0) - (bLevel?.position ?? 0)
      || (aLevel?.id ?? '').localeCompare(bLevel?.id ?? '')
      || (aModule?.position ?? 0) - (bModule?.position ?? 0)
      || (aModule?.id ?? '').localeCompare(bModule?.id ?? '')
      || a.position - b.position
      || a.id.localeCompare(b.id)
  })
}

export function nextPosition(rows: readonly { position: number }[]) {
  return rows.reduce((highest, row) => Math.max(highest, row.position), 0) + 1
}

// Untyped PostgREST clients can infer embedded to-one rows as arrays.
export function toOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value
}
