export const academyBrand = {
  name: 'Independizar',
  logo: '/independizar-logo.svg',
  icon: '/independizar-icon.svg',
} as const

export function academyDescription(locale: string) {
  return locale === 'en'
    ? 'Learn English online at your own pace with Independizar.'
    : 'Aprende inglés en línea a tu ritmo con Independizar.'
}

export const academyAccountPath = '/academia/cuenta'

export function isAcademyHost(authority: string | null | undefined) {
  const host = authority?.split(':')[0].toLowerCase()
  if (host === 'independizar.com' || host === 'www.independizar.com') return true

  const branch = process.env.VERCEL_GIT_COMMIT_REF
  return Boolean(host)
    && process.env.VERCEL_ENV === 'preview'
    && (branch === 'development/student-learning' || branch === 'development/course-management')
    && (host === process.env.VERCEL_URL || host === process.env.VERCEL_BRANCH_URL)
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
