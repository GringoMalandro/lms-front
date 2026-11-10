"use client";

import { useState } from "react";

export function AcademiaVideoPreview() {
  const [show, setShow] = useState(false);
  return <section className="mt-8">
    <button type="button" onClick={() => setShow(!show)}
      className="rounded-full bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
      {show ? "Ocultar vista previa del video" : "Ver cómo se verá el video"}
    </button>
    {show && <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex aspect-video flex-col items-center justify-center bg-slate-900 px-5 text-center text-white">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 text-4xl" aria-hidden="true">▶</span>
        <h3 className="mt-5 text-xl font-bold">Reproductor de la lección</h3>
        <p className="mt-2 max-w-md text-sm text-slate-300">Aquí se reproducirá el video alojado de forma privada cuando conectemos el almacenamiento.</p>
        <span className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs text-slate-300">Demostración visual · Sin video conectado</span>
      </div>
      <div className="p-5"><h4 className="font-semibold text-slate-900">Debajo del video</h4>
        <p className="mt-2 text-sm text-slate-600">Aquí aparecerán la explicación, los ejemplos y los recursos de la lección.</p></div>
    </div>}
  </section>;
}
