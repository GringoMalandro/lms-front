import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, GraduationCap, PlayCircle, UserRound, UsersRound } from "lucide-react";

export function AcademyLanding({ locale }: { locale: string }) {
  const es = locale !== "en";
  const courses = [
    { icon: BookOpen, title: es ? "Inglés Básico" : "Beginner English", description: es ? "Niveles A1–A2. Vocabulario, frases y conversaciones cotidianas." : "Levels A1–A2. Vocabulary, phrases, and everyday conversations.", label: "A1–A2", style: "from-[#092b42] to-[#17617a]" },
    { icon: PlayCircle, title: es ? "Inglés Intermedio" : "Intermediate English", description: es ? "Niveles B1–B2. Conversación, comprensión, trabajo y viajes." : "Levels B1–B2. Conversation, comprehension, work, and travel.", label: "B1–B2", style: "from-[#007f79] to-[#20a99b]" },
    { icon: BrainCircuit, title: es ? "Inglés Avanzado" : "Advanced English", description: es ? "Niveles C1–C2. Comunicación fluida y temas profesionales." : "Levels C1–C2. Fluent communication and professional topics.", label: "C1–C2", style: "from-[#12385d] to-[#006c68]" },
  ];
  return (
    <div className="bg-[#f7fbfa] text-[#092b42]">
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-36 md:grid-cols-2">
        <div>
          <span className="rounded-full bg-[#dff5f1] px-4 py-2 text-sm font-semibold text-[#006c68]">{es ? "Tu academia en línea" : "Your online academy"}</span>
          <h1 className="mt-7 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">{es ? "Aprende inglés. Abre nuevas puertas." : "Learn English. Open new doors."}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{es ? "Cursos en español para aprender inglés a tu ritmo. Próximamente, también inteligencia artificial y nuevas habilidades." : "Courses designed to help you learn English at your own pace. AI and new skills are coming next."}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="#cursos" className="inline-flex items-center gap-2 rounded-xl bg-[#008f89] px-6 py-4 font-semibold text-white hover:bg-[#006c68]">{es ? "Explorar cursos" : "Explore courses"}<ArrowRight size={18}/></Link>
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
      <section id="instructor" className="bg-[#edf7f5] px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-[2rem] border border-[#008f89]/15 bg-white p-8 shadow-lg md:grid-cols-[auto_1fr] md:p-12">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-[#008f89] bg-gradient-to-br from-[#092b42] to-[#008f89] text-white shadow-lg" aria-label={es ? "Avatar provisional del instructor" : "Instructor placeholder avatar"}>
            <UserRound size={76} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#008f89]">{es ? "Conoce a tu instructor" : "Meet your instructor"}</p>
            <h2 className="mt-2 text-4xl font-extrabold text-[#092b42]">Gringo Malandro</h2>
            <p className="mt-3 flex items-center gap-2 font-semibold text-[#006c68]"><UsersRound size={19}/>{es ? "Influencer de redes sociales · 980 mil seguidores en todas sus plataformas" : "Social media influencer · 980K followers across platforms"}</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">{es ? "Tu instructor de inglés en Independizar. Aprende a tu ritmo, desde el nivel básico hasta el avanzado." : "Your English instructor at Independizar. Learn at your own pace, from beginner to advanced."}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#e0f5f1] px-4 py-2 text-sm font-semibold text-[#006c68]">{es ? "Clases de inglés" : "English classes"}</span>
              <span className="rounded-full bg-[#e0f5f1] px-4 py-2 text-sm font-semibold text-[#006c68]">Independizar</span>
            </div>
          </div>
        </div>
      </section>
      <section id="planes" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold text-[#008f89]">{es ? "Planes de aprendizaje" : "Learning plans"}</p>
          <h2 className="mt-3 text-4xl font-bold">{es ? "Elige cómo quieres aprender" : "Choose how you want to learn"}</h2>
          <p className="mt-3 text-slate-600">{es ? "Planes previstos. Las suscripciones todavía no están disponibles." : "Planned tiers. Subscriptions are not available yet."}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { name: es ? "Gratis" : "Free", price: "$0", detail: es ? "Una mini lección de inglés al día." : "One short English mini-lesson per day." },
              { name: es ? "Básico" : "Basic", price: "$10", detail: es ? "Acceso limitado a lecciones y cursos seleccionados." : "Limited access to selected lessons and courses." },
              { name: "Premium", price: "$50", detail: es ? "Acceso completo a los tres niveles de inglés." : "Full access to all three English levels." },
            ].map(plan => (
              <article key={plan.name} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="mt-5 text-4xl font-extrabold text-[#007f79]">{plan.price}<span className="text-base font-medium text-slate-500">{es ? "/mes" : "/month"}</span></p>
                <p className="mt-5 text-slate-600">{plan.detail}</p>
                <p className="mt-7 text-sm font-semibold text-[#007f79]">{es ? "Próximamente" : "Coming soon"}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
