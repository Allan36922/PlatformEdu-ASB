import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LevelBadge } from "@/components/courses/level-badge";
import { getHighlightedCourses } from "@/lib/queries/courses";
import { formatCurrency } from "@/lib/utils";

/**
 * Muestra los primeros cursos publicados del catalogo con titulo, nivel y
 * precio. Es un Server Component y lee de Supabase en cada render, de modo
 * que los datos son siempre los reales del catalogo (no una copia congelada).
 */
export async function CourseHighlights({ limit = 3 }: { limit?: number }) {
  const courses = await getHighlightedCourses(limit);

  // Sin cursos publicados no se pinta la seccion entera: es preferible a
  // dejar un encabezado colgando sobre una rejilla vacia.
  if (courses.length === 0) return null;

  return (
    <section aria-labelledby="course-highlights-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <h2 id="course-highlights-heading" className="font-heading text-2xl font-bold">
            Algunos de nuestros cursos
          </h2>
          <p className="text-muted-foreground">
            Una muestra del catalogo que ya esta disponible en la plataforma.
          </p>
        </div>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Ver todo el catalogo
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={`/cursos/${course.slug}`}
              className="group flex h-full flex-col gap-3 rounded-xl border p-5 transition-shadow hover:shadow-md"
            >
              <LevelBadge level={course.level} className="w-fit" />
              <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
                {course.title}
              </h3>
              <span className="mt-auto pt-2 text-lg font-semibold">
                {formatCurrency(course.price)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
