import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function IndependizarCheckoutSuccess({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "independizar.com" && host !== "www.independizar.com") notFound();
  return <main className="mx-auto min-h-screen max-w-2xl px-5 pt-32">
    <h1 className="text-3xl font-bold">Gracias por suscribirte</h1>
    <p className="mt-4 text-slate-600">Stripe está procesando la confirmación de tu pago. Tu acceso se activará cuando recibamos la confirmación segura del pago.</p>
    <Link href={`/${locale}/academia`} className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">Ir a la academia</Link>
  </main>;
}