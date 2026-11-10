import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Preguntas frecuentes | Independizar" };

export default async function FAQPage({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;
 const es=locale!=="en";
 const questions=[
  {q:es?"¿Qué cursos ofrece Independizar?":"What courses does Independizar offer?",a:es?"La academia está preparando cursos de inglés de nivel básico (A1–A2), intermedio (B1–B2) y avanzado (C1–C2).":"The academy is preparing beginner (A1–A2), intermediate (B1–B2), and advanced (C1–C2) English courses."},
  {q:es?"¿Cuánto cuestan los planes?":"How much do plans cost?",a:es?"Los planes previstos son Gratis ($0), Básico ($10 al mes) y Premium ($50 al mes). Las suscripciones aún no están disponibles.":"Planned plans are Free ($0), Basic ($10 per month), and Premium ($50 per month). Subscriptions are not yet available."},
  {q:es?"¿Recibiré un certificado al terminar un curso?":"Will I receive a certificate when I complete a course?",a:es?"La disponibilidad de certificados todavía no está confirmada. Publicaremos los detalles antes de habilitar los cursos.":"Certificate availability has not yet been confirmed. Details will be published before courses become available."},
  {q:es?"¿Puedo estudiar a mi propio ritmo?":"Can I study at my own pace?",a:es?"Los cursos están diseñados para aprender a tu ritmo. Los detalles de acceso se anunciarán cuando se publiquen las lecciones.":"Courses are designed for self-paced learning. Access details will be announced when lessons launch."},
  {q:es?"¿Quién es el instructor?":"Who is the instructor?",a:es?"Gringo Malandro es el instructor de inglés de Independizar.":"Gringo Malandro is Independizar's English instructor."},
  {q:es?"¿Ya puedo inscribirme?":"Can I enroll now?",a:es?"Las lecciones y las suscripciones están en preparación.":"Lessons and subscriptions are currently being prepared."}
 ];
 return <main className="min-h-screen bg-[#f7fbfa] px-6 pb-24 pt-36 text-[#092b42]"><div className="mx-auto max-w-4xl"><p className="font-semibold text-[#008f89]">Independizar</p><h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{es?"¿Preguntas frecuentes?":"Frequently asked questions"}</h1><p className="mt-4 text-slate-600">{es?"Respuestas sobre nuestros cursos, planes y certificados.":"Answers about our courses, plans, and certificates."}</p><div className="mt-10 space-y-4">{questions.map(({q,a})=><details key={q} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><summary className="cursor-pointer list-none font-bold text-lg">{q}<span className="float-right text-[#008f89]">+</span></summary><p className="mt-4 leading-relaxed text-slate-600">{a}</p></details>)}</div><p className="mt-10 text-slate-600">{es?"¿Más información?":"More information?"} <Link href="/pricing" className="font-semibold text-[#008f89] underline">{es?"Ver planes":"View pricing"}</Link></p></div></main>;
}
