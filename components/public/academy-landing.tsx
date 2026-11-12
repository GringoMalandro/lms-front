import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, GraduationCap, PlayCircle, UserRound, UsersRound } from "lucide-react";

export function AcademyLanding({ locale }: { locale: string }) {
  const es = locale !== "en";
  const courses = [
    { icon: BookOpen, title: es ? "Inglés Básico" : "Beginner English", description: es ? "Aprende desde cero: palabras, frases útiles y conversaciones del día a día." : "Start from scratch with useful words, phrases, and everyday conversations.", label: es ? "Para empezar" : "Getting started", style: "from-[#092b42] to-[#17617a]" },
    { icon: PlayCircle, title: es ? "Inglés Intermedio" : "Intermediate English", description: es ? "Mejora tus conversaciones y aprende a comunicarte en el trabajo y al viajar." : "Build conversation skills for work, travel, and everyday situations.", label: es ? "Para conversar" : "Build confidence", style: "from-[#007f79] to-[#20a99b]" },
    { icon: BrainCircuit, title: es ? "Inglés Avanzado" : "Advanced English", description: es ? "Habla con más naturalidad, expresa ideas complejas y domina conversaciones profesionales." : "Speak naturally, express complex ideas, and handle professional conversations.", label: es ? "Para dominar el idioma" : "Master the language", style: "from-[#12385d] to-[#006c68]" },
  ];
  return (
    <div className="bg-[#f7fbfa] text-[#092b42]">
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-36 md:grid-cols-2">
        <div>
          <span className="rounded-full bg-[#dff5f1] px-4 py-2 text-sm font-semibold text-[#006c68]">{es ? "Tu academia en línea" : "Your online academy"}</span>
          <h1 className="mt-7 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">{es ? "Aprende inglés. Abre nuevas puertas." : "Learn English. Open new doors."}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{es ? "Cursos en español para aprender inglés a tu ritmo. Próximamente, también inteligencia artificial y nuevas habilidades." : "Courses designed to help you learn English at your own pace. AI and new skills are coming next."}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/academia" className="inline-flex items-center gap-2 rounded-xl bg-[#008f89] px-6 py-4 font-semibold text-white hover:bg-[#006c68]">{es ? "Explorar cursos" : "Explore courses"}<ArrowRight size={18}/></Link>
            <Link href="/auth/login" className="rounded-xl border border-[#008f89] px-6 py-4 font-semibold text-[#006c68]">{es ? "Iniciar sesión" : "Sign in"}</Link>
          </div>
        </div>
        <div className="rounded-[2rem] bg-gradient-to-br from-[#092b42] to-[#007f79] p-9 text-white shadow-xl">
          <div className="flex items-center gap-3"><GraduationCap size={38}/><span className="text-xl font-bold">Independizar</span></div>
          <div className="mt-16 rounded-2xl bg-white/10 p-7 backdrop-blur-sm"><p className="text-sm uppercase tracking-widest text-teal-100">{es ? "Aprende a tu ritmo" : "Learn at your pace"}</p><p className="mt-4 text-3xl font-bold">{es ? "Tu próximo capítulo comienza aquí." : "Your next chapter starts here."}</p></div>
        </div>
      </section>
      <section id="cursos" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold text-[#008f89]">{es ? "Nuestra oferta educativa" : "Our courses"}</p>
          <h2 className="mt-3 text-4xl font-bold">{es ? "Descubre lo que puedes aprender" : "Discover what you can learn"}</h2>
          <p className="mt-3 text-slate-600">{es ? "Tres niveles de inglés. Contenido próximamente." : "Three English levels. Course content coming soon."}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">{courses.map(({ icon: Icon, title, description, label, style }) => <article key={title} className={`rounded-[2rem] bg-gradient-to-br ${style} p-8 text-white shadow-xl transition-transform duration-200 hover:-translate-y-1`}><div className="mb-8 inline-flex rounded-xl bg-white/15 p-4 text-white"><Icon size={30}/></div><h3 className="text-2xl font-bold">{title}</h3><p className="mt-4 min-h-16 text-white/85">{description}</p><span className="mt-6 inline-block rounded-full border border-white/25 bg-white/15 px-4 py-1 text-sm font-semibold text-white">{label}</span></article>)}</div>
        </div>
      </section>


    </div>
  );
}
