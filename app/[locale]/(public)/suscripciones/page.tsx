import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IndependizarPlans({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "independizar.com" && host !== "www.independizar.com") notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <main className="mx-auto min-h-screen max-w-5xl px-5 pb-20 pt-28">
    <h1 className="text-4xl font-bold">Membresías Independizar</h1>
    <p className="mt-3 text-slate-600">Aprende a tu ritmo. Cancela tu suscripción cuando quieras.</p>
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {([{ tier: "basic", name: "Básico", price: 10, description: "Cursos introductorios y lecciones breves, con acceso gradual." }, { tier: "premium", name: "Premium", price: 50, description: "Cursos completos y avanzados, además de los básicos. Acceso gradual." }] as const).map(plan =>
        <section key={plan.tier} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          <p className="mt-3 text-4xl font-bold">${plan.price}<span className="text-base font-normal text-slate-500"> / mes</span></p>
          <p className="mt-5 min-h-16 text-slate-600">{plan.description}</p>
          <form action="/api/independizar/checkout" method="post">
            <input type="hidden" name="tier" value={plan.tier} />
            <input type="hidden" name="locale" value={locale} />
            <button className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800" type="submit">{user ? "Suscribirme" : "Continuar para suscribirme"}</button>
          </form>
        </section>)}
    </div>
    <a className="mt-8 inline-block text-blue-700 underline" href={`/${locale}/suscripciones/gestionar`}>Administrar mi suscripción</a>
  </main>;
}