import Link from "next/link";

export function AcademyPricing({ locale }: { locale: string }) {
  const es = locale !== "en";
  const plans = [
    { name: es ? "Gratis" : "Free", price: "$0", detail: es ? "Una mini lección de inglés al día." : "One short English mini-lesson per day.", color: "from-[#092b42] to-[#17617a]" },
    { name: es ? "Básico" : "Basic", price: "$10", detail: es ? "Acceso limitado a lecciones y cursos seleccionados." : "Limited access to selected lessons and courses.", color: "from-[#007f79] to-[#20a99b]" },
    { name: "Premium", price: "$50", detail: es ? "Acceso completo a los tres niveles de inglés." : "Full access to all three English levels.", color: "from-[#12385d] to-[#006c68]" },
  ];
  return <main className="min-h-screen bg-[#f7fbfa] px-6 pb-24 pt-36 text-[#092b42]">
    <div className="mx-auto max-w-6xl">
      <p className="font-semibold text-[#008f89]">{es ? "Planes de aprendizaje" : "Learning plans"}</p>
      <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{es ? "Elige cómo quieres aprender" : "Choose how you want to learn"}</h1>
      <p className="mt-4 text-slate-600">{es ? "Planes previstos. Las suscripciones todavía no están disponibles." : "Planned tiers. Subscriptions are not available yet."}</p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map(plan => <article key={plan.name} className={`rounded-[2rem] bg-gradient-to-br ${plan.color} p-8 text-white shadow-xl`}>
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          <p className="mt-6 text-5xl font-extrabold">{plan.price}<span className="ml-1 text-base font-medium text-white/80">{es ? "/mes" : "/month"}</span></p>
          <p className="mt-6 min-h-20 text-white/90">{plan.detail}</p>
          <p className="mt-7 inline-block rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold">{es ? "Próximamente" : "Coming soon"}</p>
        </article>)}
      </div>
      <Link href="/#cursos" className="mt-10 inline-block font-semibold text-[#007f79] hover:underline">{es ? "Ver cursos de inglés" : "View English courses"}</Link>
    </div>
  </main>;
}
