import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function IndependizarManage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "independizar.com" && host !== "www.independizar.com") notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <main className="mx-auto min-h-screen max-w-2xl px-5 pt-32">
    <h1 className="text-3xl font-bold">Administrar suscripción</h1>
    <p className="mt-4 text-slate-600">Actualiza tu método de pago, consulta facturas o cancela tu suscripción desde el portal seguro de Stripe.</p>
    {user ? <form method="post" action="/api/independizar/portal">
      <input type="hidden" name="locale" value={locale} />
      <button className="mt-6 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">Abrir portal de pagos</button>
    </form> : <a className="mt-6 inline-block text-blue-700 underline" href={`/${locale}/auth/login?next=/${locale}/suscripciones/gestionar`}>Inicia sesión para administrar tu membresía</a>}
  </main>;
}