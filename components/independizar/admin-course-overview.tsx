'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Borradores' },
] as const

export function IndependizarAdminCourseOverview<T extends { id: string; published: boolean }>({
  courses, renderCourse,
}: {
  courses: readonly T[]
  renderCourse: (course: T) => ReactNode
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]['value']>('all')
  const visible = courses.filter((course) => filter === 'all' || course.published === (filter === 'published'))
  const published = courses.filter((course) => course.published).length

  return <section aria-label="Cursos" className="space-y-4">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar cursos">
      {filters.map(({ value, label }) => (
        <Button key={value} type="button" variant={filter === value ? 'default' : 'outline'}
          aria-pressed={filter === value} onClick={() => setFilter(value)}>
          {label} ({value === 'all' ? courses.length : value === 'published' ? published : courses.length - published})
        </Button>
      ))}
    </div>
    {visible.length === 0
      ? <p className="rounded-lg border border-dashed p-4 text-muted-foreground">No hay cursos en esta categoría.</p>
      : <ul className="space-y-3">{visible.map((course) => <li key={course.id}>{renderCourse(course)}</li>)}</ul>}
  </section>
}
