"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lesson = { id: string; title: string; position: number; content: string | null; video_url: string | null; duration_minutes: number | null; published: boolean };
const supabase = createClient();

export function IndependizarLessonEditor({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function refresh() {
    const { data, error: readError } = await supabase.from("lessons").select("id,title,position,content,video_url,duration_minutes,published").eq("course_id", courseId).order("position");
    if (readError) setError(readError.message);
    else setLessons(data || []);
  }
  useEffect(() => { void refresh(); }, [courseId]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.app_metadata?.role !== "admin") { setError("Acceso denegado."); return; }
    if (videoUrl.trim()) {
      try {
        const u = new URL(videoUrl);
        if (u.protocol !== "https:" || !["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com"].includes(u.hostname)) {
          setError("Utiliza un enlace HTTPS de YouTube o Vimeo."); return;
        }
      } catch { setError("El enlace de video no es válido."); return; }
    }
    const { error: writeError } = await supabase.from("lessons").insert({
      course_id: courseId, title: title.trim(), content: content.trim() || null,
      video_url: videoUrl.trim() || null, duration_minutes: duration ? Number(duration) : null,
      position: lessons.length + 1, published: false
    });
    if (writeError) { setError(writeError.message); return; }
    setTitle(""); setContent(""); setVideoUrl(""); setDuration("");
    await refresh();
  }

  return <section className="mt-4 border-t pt-4">
    <button type="button" className="text-sm font-semibold text-blue-700 underline" onClick={() => setOpen(!open)}>{open ? "Cerrar editor de lecciones" : "Administrar lecciones"}</button>
    {open && <div className="mt-4 space-y-4">
      <ol className="space-y-2">{lessons.map(l => <li key={l.id} className="rounded-lg bg-slate-50 p-3 text-sm">
        <strong>{l.position}. {l.title}</strong> · {l.duration_minutes == null ? "Duración por definir" : l.duration_minutes + " min"} · {l.published ? "Publicada" : "Borrador"}
        {l.video_url && <span className="ml-2 text-blue-700">Video agregado</span>}
      </li>)}</ol>
      <form onSubmit={save} className="grid gap-3">
        <label className="grid gap-1 text-sm">Título de la lección<input required className="rounded-lg border p-3" value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label className="grid gap-1 text-sm">Contenido<textarea className="rounded-lg border p-3" value={content} onChange={e => setContent(e.target.value)} /></label>
        <label className="grid gap-1 text-sm">Video (YouTube o Vimeo)<input type="url" className="rounded-lg border p-3" placeholder="https://..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} /></label>
        <label className="grid gap-1 text-sm">Duración (minutos)<input type="number" min="0" className="rounded-lg border p-3" value={duration} onChange={e => setDuration(e.target.value)} /></label>
        <button className="w-fit rounded-full bg-blue-700 px-5 py-2 text-white" type="submit">Guardar lección como borrador</button>
      </form>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>}
  </section>;
}
