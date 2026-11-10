"use client";

import { useState } from "react";

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  lessonCount: number;
};

export function IndependizarAdminCourseOverview({
  courses,
}: {
  courses: Course[];
}) {
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const visible = courses.filter((course) =>
    filter === "all" ? true : filter === "published" ? course.published : !course.published
  );

  return (
    <section aria-label="Administración de cursos" className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Independizar</p>
        <h1 className="text-3xl font-bold">Administrar cursos</h1>
        <p className="mt-2 text-sm text-slate-600">Consulta los cursos, sus lecciones y su estado de publicación.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Cursos" value={courses.length} />
        <Summary label="Publicados" value={courses.filter((course) => course.published).length} />
        <Summary label="Borradores" value={courses.filter((course) => !course.published).length} />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar cursos">
        {(["all", "published", "draft"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full px-4 py-2 text-sm font-medium ${filter === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
            {value === "all" ? "Todos" : value === "published" ? "Publicados" : "Borradores"}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-slate-600">
          No hay cursos en esta categoría.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((course) => (
            <li key={course.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{course.title}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.published ? "bg-teal-100 text-teal-900" : "bg-amber-100 text-amber-900"}`}>
                  {course.published ? "Publicado" : "Borrador"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{course.description || "Sin descripción"}</p>
              <p className="mt-4 text-sm font-medium text-slate-700">{course.lessonCount} lecciones</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-5">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
