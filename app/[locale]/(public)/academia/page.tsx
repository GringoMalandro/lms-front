import Link from "next/link";
import { isAcademyHost } from "@/lib/independizar/academy";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AcademiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (!isAcademyHost(host)) notFound();
  const supabase = await createClient();
  const { data: courses, error } = await supabase.from("courses")
    .select("id,title,description,level,duration_minutes,cover_color")
    .eq("published", true).order("created_at", { ascending: false });
  return <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28">
    <h1 className="text-4xl font-bold text-slate-900">Academia Independizar</h1>
    <p className="mt-3 text-slate-600">Aprende a tu ritmo con nuestros cursos.</p>
    {error ? <p role="alert" className="mt-8 text-red-700">No se pudo cargar el catálogo.</p> :
      !courses?.length ? <p className="mt-8 text-slate-600">Próximamente encontrarás nuestros cursos aquí.</p> :
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.map(course =>
        <Link key={course.id} href={`/${locale}/academia/${course.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
          <div className="flex aspect-video flex-col justify-end p-6 text-white" style={{backgroundColor: course.cover_color || "#2563eb"}}>
            <span className="text-xs font-bold tracking-widest">INDEPENDIZAR</span>
            <h2 className="mt-2 text-2xl font-bold">{course.title}</h2>
          </div>
          <div className="p-5"><p className="line-clamp-3 text-sm text-slate-600">{course.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1">{course.level || "Curso"}</span>
            {course.duration_minutes != null && <span className="rounded-full bg-slate-100 px-3 py-1">{course.duration_minutes} min</span>}</div>
            <p className="mt-5 font-semibold text-blue-700">Ver curso →</p>
          </div>
        </Link>)}</div>}
  </main>;
}
