import { describe, expect, it } from 'vitest'
import { getLessonVideoLink, isAcademyHost, isAcademyId, summarizeLessons } from '@/lib/independizar/academy'

describe('academy routing and lesson links', () => {
  it('recognizes both Independizar hosts and rejects lookalikes', () => {
    expect(isAcademyHost('Independizar.com:3000')).toBe(true)
    expect(isAcademyHost('www.independizar.com')).toBe(true)
    expect(isAcademyHost('independizar.com.example.com')).toBe(false)
  })

  it('validates course IDs before querying Supabase', () => {
    expect(isAcademyId('2aef531e-abcb-443b-a6d2-6fc83c86b05a')).toBe(true)
    expect(isAcademyId('------------------------------------')).toBe(false)
  })

  it('links only to HTTPS videos without embedded credentials', () => {
    expect(getLessonVideoLink('https://example.com/video')).toBe('https://example.com/video')
    expect(getLessonVideoLink('javascript:alert(1)')).toBeNull()
    expect(getLessonVideoLink('https://user:pass@example.com/video')).toBeNull()
    expect(getLessonVideoLink('not-a-url')).toBeNull()
  })
})

describe('academy progress', () => {
  const lessons = [{ id: 'first' }, { id: 'second' }, { id: 'third' }]

  it('resumes the first unfinished visible lesson in order', () => {
    expect(summarizeLessons(lessons, new Set(['first', 'third', 'hidden']))).toEqual({
      completed: 2, total: 3, percent: 66, nextLesson: lessons[1],
    })
  })

  it('reports zero progress for an empty course', () => {
    expect(summarizeLessons([], new Set(['hidden']))).toEqual({
      completed: 0, total: 0, percent: 0, nextLesson: undefined,
    })
  })

  it('reports 100 percent only after every visible lesson is completed', () => {
    expect(summarizeLessons(lessons, new Set(lessons.map((lesson) => lesson.id)))).toEqual({
      completed: 3, total: 3, percent: 100, nextLesson: undefined,
    })
    const longCourse = Array.from({ length: 201 }, (_, index) => ({ id: String(index) }))
    expect(summarizeLessons(longCourse, new Set(longCourse.slice(1).map((lesson) => lesson.id))).percent).toBe(99)
  })
})
