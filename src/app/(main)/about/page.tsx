import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CourseHighlights } from "@/components/courses/course-highlights";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Quienes somos" };

/**
 * Seccion "Quienes somos". Los iconos son los SVG que ya viven en public/
 * (globe/window/file); los enlaces apuntan solo a rutas existentes del App
 * Router: /cursos, /signup e /instructor.
 */

const PILLARS = [
  {
    src: "/globe.svg",
    title: "Aprendizaje sin fronteras",
    body:
      "Cursos en espanol accesibles desde cualquier lugar, con progreso que se " +
      "guarda automaticamente para que retomes donde lo dejaste.",
  },
  {
    src: "/window.svg",
    title: "Un aula pensada para enfocarse",
    body:
      "El reproductor combina video, recursos descargables y cuestionarios en " +
      "una sola pantalla, sin distracciones alrededor.",
  },
  {
    src: "/file.svg",
    title: "Certificados verificables",
    body:
      "Al completar un curso emitimos un certificado en PDF con un codigo " +
      "publico que cualquier empresa puede comprobar.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-16 px-4 py-12">
      <header className="space-y-4 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Quienes somos
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          EduPlatform es un marketplace de cursos en espanol donde cualquier
          persona puede aprender una habilidad nueva y cualquier especialista
          puede ensenar lo que sabe.
        </p>
      </header>

      <section aria-labelledby="pillars-heading" className="space-y-6">
        <h2 id="pillars-heading" className="sr-only">
          Nuestros pilares
        </h2>
        <ul className="grid gap-6 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="space-y-3 rounded-xl border p-6">
              <Image
                src={pillar.src}
                alt=""
                aria-hidden
                width={32}
                height={32}
                className="size-8 dark:invert"
              />
              <h3 className="font-semibold">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <CourseHighlights />

      <section aria-labelledby="teach-heading" className="space-y-4 rounded-xl border p-8 text-center">
        <h2 id="teach-heading" className="font-heading text-2xl font-bold">
          Tambien puedes ensenar
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Publica tu propio curso, organiza el temario y sigue el avance de tus
          estudiantes desde el panel de instructor.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button render={<Link href="/cursos">Explorar cursos</Link>} />
          <Button variant="outline" render={<Link href="/signup">Crear una cuenta</Link>} />
        </div>
      </section>
    </div>
  );
}
