import { UserRound, UsersRound, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gringo Malandro | Independizar" };

export default async function InstructorPage({ params }: { params: Promise<{locale: string}> }) {
  const {locale} = await params;
  const es = locale !== "en";
  return <main className="min-h-screen bg-[#f7fbfa] px-6 pb-24 pt-36 text-[#092b42]">
    <div className="mx-auto max-w-5xl">
      <div className="grid items-center gap-10 rounded-[2rem] bg-gradient-to-br from-[#092b42] to-[#007f79] p-8 text-white shadow-xl md:grid-cols-[auto_1fr] md:p-12">
        <div className="flex h-44 w-44 items-center justify-center rounded-full border-4 border-white/70 bg-white/15 shadow-lg" aria-label={es ? "Avatar provisional del instructor" : "Instructor placeholder avatar"}>
          <UserRound size={90} strokeWidth={1.5}/>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-100">{es ? "Conoce a tu instructor" : "Meet your instructor"}</p>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">Gringo Malandro</h1>
          <p className="mt-5 flex items-center gap-2 text-lg text-white/90"><UsersRound size={22}/>{es ? "Influencer de redes sociales · 980 mil seguidores en todas sus plataformas" : "Social media influencer · 980K followers across platforms"}</p>
          <p className="mt-5 max-w-2xl text-white/85">{es ? "Instructor de inglés en Independizar. Aprende a tu ritmo, desde el nivel básico hasta el avanzado." : "English instructor at Independizar. Learn at your own pace, from beginner to advanced."}</p>
        </div>
      </div>
      <section className="mt-12 rounded-[2rem] border border-[#008f89]/20 bg-white p-8 shadow-sm md:p-10">
        <div className="flex items-center gap-3 text-[#007f79]"><BookOpen size={28}/><h2 className="text-2xl font-bold">{es ? "Clases de inglés" : "English classes"}</h2></div>
        <p className="mt-4 text-slate-600">{es ? "Explora los niveles Básico (A1–A2), Intermedio (B1–B2) y Avanzado (C1–C2). Las lecciones estarán disponibles próximamente." : "Explore Beginner (A1–A2), Intermediate (B1–B2), and Advanced (C1–C2) levels. Lessons are coming soon."}</p>
        <Link href="/#cursos" className="mt-6 inline-block rounded-xl bg-[#008f89] px-6 py-3 font-semibold text-white hover:bg-[#006c68]">{es ? "Explorar cursos" : "Explore courses"}</Link>
      </section>
    </div>
  </main>;
}
