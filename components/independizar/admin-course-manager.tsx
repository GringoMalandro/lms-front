"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IndependizarAdminCourseOverview } from "./admin-course-overview";
import { IndependizarLessonEditor } from "./lesson-editor";

type Course = { id: string; title: string; description: string | null; published: boolean; lessonCount: number; duration_minutes: number | null; level: string | null; cover_color: string | null };
const supabase = createClient();

export function IndependizarAdminCourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("Básico");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) { setError("Falta configurar Supabase."); setLoading(false); return; }
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) { setError("Inicia sesión como administrador."); setLoading(false); return; }
    // The database independently enforces admin permissions through RLS.
    if (userData.user.app_metadata?.role !== "admin") {
      setError("No tienes acceso de administrador."); setLoading(false); return;
    }
    setAuthorized(true);
    const { data, error: readError } = await supabase.from("courses").select("id,title,description,published,duration_minutes,level,cover_color,lessons(id)").order("created_at", { ascending: false });
    if (readError) setError(readError.message);
    else setCourses((data || []).map((c) => ({ id: c.id, title: c.title, description: c.description, published: c.published, lessonCount: Array.isArray(c.lessons) ? c.lessons.length : 0, duration_minutes: c.duration_minutes, level: c.level, cover_color: c.cover_color })));
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function addCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !title.trim()) return;
    setError("");
    const { error: insertError } = await supabase.from("courses").insert({ title: title.trim(), description: description.trim() || null, published: false, duration_minutes: duration ? Number(duration) : null, level, cover_color: "#2563eb" });
    if (insertError) { setError(insertError.message); return; }
    setTitle(""); setDescription(""); setDuration(""); await refresh();
  }

  async function togglePublished(course: Course) {
    if (!supabase) return;
    setError("");
    const { error: updateError } = await supabase.from("courses").update({ published: !course.published }).eq("id", course.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  if (loading) return <p className="p-6">Cargando administración...</p>;
  if (!authorized) return <p role="alert" className="p-6">{error}</p>;
  return (
    <div className="space-y-6">
      <IndependizarAdminCourseOverview courses={courses} />
      <section className="mx-auto max-w-5xl space-y-4 px-6 pb-8">
        <h2 className="text-xl font-semibold">Crear curso</h2>
        <form onSubmit={addCourse} className="grid gap-3">
          <label className="grid gap-1">Nombre del curso
            <input className="rounded-lg border p-3" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="grid gap-1">Descripción
            <textarea className="rounded-lg border p-3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="grid gap-1">Duración estimada (minutos)
            <input type="number" min="0" className="rounded-lg border p-3" placeholder="Por definir" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
          <label className="grid gap-1">Nivel
            <select className="rounded-lg border p-3" value={level} onChange={(e) => setLevel(e.target.value)}><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select>
          </label>
          <button type="submit" className="w-fit rounded-full bg-slate-900 px-5 py-3 text-white">Guardar borrador</button>
        </form>
        <h2 className="text-xl font-semibold">Publicación</h2>
        <ul className="space-y-2">
          {courses.map((course) => (
            <li key={course.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex h-24 w-28 shrink-0 flex-col justify-end rounded-xl p-3 text-white" style={{ backgroundColor: course.cover_color || "#2563eb" }}><span className="text-xs font-semibold opacity-90">INDEPENDIZAR</span><span className="text-base font-bold leading-tight">{course.title}</span></div>
                <div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-900">{course.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{course.description}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded-full bg-slate-100 px-2 py-1">{course.level || "Nivel por definir"}</span><span className="rounded-full bg-slate-100 px-2 py-1">{course.lessonCount} lecciones</span><span className="rounded-full bg-slate-100 px-2 py-1">{course.duration_minutes != null ? `${course.duration_minutes} min` : "Duración por definir"}</span><span className="rounded-full bg-slate-100 px-2 py-1">{course.published ? "Publicado" : "Borrador"}</span></div></div>
              <button type="button" className="rounded-full border px-4 py-2" onClick={() => void togglePublished(course)}>
                {course.published ? "Despublicar" : "Publicar"}
              </button>
              </div>
              <div className="px-4 pb-4"><IndependizarLessonEditor courseId={course.id} /></div>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </section>
    </div>
  );
}
