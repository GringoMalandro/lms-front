export const academyAccountPath = '/academia/cuenta'

export function isAcademyHost(authority: string | null | undefined) {
  const host = authority?.split(':')[0].toLowerCase()
  return host === 'independizar.com' || host === 'www.independizar.com'
}

export function isAcademyId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function summarizeLessons<T extends { id: string }>(
  lessons: readonly T[],
  completedIds: ReadonlySet<string>,
) {
  const completed = lessons.filter((lesson) => completedIds.has(lesson.id)).length
  return {
    completed,
    total: lessons.length,
    percent: lessons.length ? Math.floor(completed * 100 / lessons.length) : 0,
    nextLesson: lessons.find((lesson) => !completedIds.has(lesson.id)),
  }
}

export function getLessonVideoLink(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}
