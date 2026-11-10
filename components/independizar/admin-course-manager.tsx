"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IndependizarAdminCourseOverview } from "./admin-course-overview";

type Course = { id: string; title: string; description: string | null; published: boolean; lessonCount: number };
const supabase = createClient();

export function IndependizarAdminCourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    const { data, error: readError } = await supabase.from("courses").select("id,title,description,published,lessons(id)").order("created_at", { ascending: false });
    if (readError) setError(readError.message);
    else setCourses((data || []).map((c) => ({ id: c.id, title: c.title, description: c.description, published: c.published, lessonCount: Array.isArray(c.lessons) ? c.lessons.length : 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function addCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !title.trim()) return;
    setError("");
    const { error: insertError } = await supabase.from("courses").insert({ title: title.trim(), description: description.trim() || null, published: false });
    if (insertError) { setError(insertError.message); return; }
    setTitle(""); setDescription(""); await refresh();
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
          <button type="submit" className="w-fit rounded-full bg-slate-900 px-5 py-3 text-white">Guardar borrador</button>
        </form>
        <h2 className="text-xl font-semibold">Publicación</h2>
        <ul className="space-y-2">
          {courses.map((course) => (
            <li key={course.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span>{course.title}</span>
              <button type="button" className="rounded-full border px-4 py-2" onClick={() => void togglePublished(course)}>
                {course.published ? "Despublicar" : "Publicar"}
              </button>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </section>
    </div>
  );
}
