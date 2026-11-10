import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AcademiaCoursePage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId } = await params;
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "independizar.com" && host !== "www.independizar.com") notFound();
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) notFound();
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("id,title,description,level,duration_minutes")
    .eq("id", courseId).eq("published", true).maybeSingle();
  if (!course) notFound();
  const { data: lessons } = await supabase.from("lessons").select("id,title,position,duration_minutes")
    .eq("course_id", courseId).eq("published", true).order("position");
  return <main className="mx-auto min-h-screen max-w-4xl px-5 pb-16 pt-28">
    <Link href={`/${locale}/academia`} className="text-sm font-semibold text-blue-700">← Todos los cursos</Link>
    <div className="mt-6 rounded-2xl bg-blue-700 p-8 text-white"><p className="text-xs font-bold tracking-widest">INDEPENDIZAR</p>
      <h1 className="mt-3 text-4xl font-bold">{course.title}</h1>
      <p className="mt-3 text-blue-100">{course.level || "Curso"}{course.duration_minutes != null ? ` · ${course.duration_minutes} min` : ""}</p></div>
    <p className="mt-8 whitespace-pre-wrap text-lg leading-8 text-slate-700">{course.description}</p>
    <h2 className="mt-10 text-2xl font-bold">Contenido del curso</h2>
    {!lessons?.length ? <p className="mt-4 rounded-xl bg-slate-50 p-5 text-slate-600">Las lecciones estarán disponibles próximamente.</p> :
      <ol className="mt-4 space-y-3">{lessons.map(lesson => <li key={lesson.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
        <span className="font-semibold text-slate-900">{lesson.position}. {lesson.title}</span>
        <span className="text-sm text-slate-500">{lesson.duration_minutes != null ? `${lesson.duration_minutes} min` : "Lección"}</span>
      </li>)}</ol>}
    <div className="mt-8 flex aspect-video flex-col items-center justify-center rounded-2xl bg-slate-900 p-6 text-center text-white">
      <span className="text-5xl" aria-hidden="true">▶</span><p className="mt-4 font-semibold">Video de la lección</p>
      <p className="mt-2 text-sm text-slate-300">El reproductor estará disponible cuando se habiliten las lecciones.</p>
    </div>
  </main>;
}
