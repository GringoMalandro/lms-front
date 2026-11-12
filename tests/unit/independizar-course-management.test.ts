import { describe, expect, it } from 'vitest'
import { nextPosition, orderCourseLessons, toOne } from '@/lib/independizar/course-management'
import { summarizeLessons } from '@/lib/independizar/academy'

describe('Independizar curriculum', () => {
  const level = { id: 'level-a', title: 'Level A', position: 1 }
  const firstModule = { id: 'module-a', title: 'Module A', position: 1, course_levels: level }
  const laterModule = { ...firstModule, id: 'module-b', position: 2 }
  const laterLevelModule = { ...firstModule, id: 'module-c', course_levels: { ...level, id: 'level-b', position: 2 } }
  const lessons = [
    { id: 'legacy', position: 0, course_modules: null },
    { id: 'third', position: 1, course_modules: laterModule },
    { id: 'fourth', position: 0, course_modules: laterLevelModule },
    { id: 'second', position: 4, course_modules: firstModule },
    { id: 'first', position: 2, course_modules: firstModule },
  ]

  it('orders by level, module, and lesson while retaining legacy lessons', () => {
    expect(orderCourseLessons(lessons).map((lesson) => lesson.id)).toEqual(['first', 'second', 'third', 'fourth', 'legacy'])
    expect(lessons[0].id).toBe('legacy')
  })

  it('resumes at the first unfinished lesson in curriculum order', () => {
    const progress = summarizeLessons(orderCourseLessons(lessons), new Set(['first', 'third']))
    expect(progress.nextLesson?.id).toBe('second')
    expect(progress.percent).toBe(40)
  })

  it('normalizes embedded to-one records and empty relations', () => {
    expect(toOne(level)).toBe(level)
    expect(toOne([level])).toBe(level)
    expect(toOne([])).toBeNull()
    expect(toOne(null)).toBeNull()
  })

  it('assigns the next position after the highest existing value', () => {
    expect(nextPosition([{ position: 2 }, { position: 8 }, { position: 4 }])).toBe(9)
    expect(nextPosition([])).toBe(1)
  })
})
