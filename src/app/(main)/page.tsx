import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { getCategoriesWithCounts, getFeaturedCourses } from "@/lib/queries/courses";

export default async function HomePage() {
  const [featuredCourses, categories] = await Promise.all([
    getFeaturedCourses(8),
    getCategoriesWithCounts(),
  ]);

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Aprende las habilidades que impulsan tu carrera
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-balance">
            Cursos online creados por instructores expertos en tecnología, diseño, negocios e
            idiomas.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" render={<Link href="/cursos">Explorar cursos</Link>} />
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/signup">Enseña en EduPlatform</Link>}
            />
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold">Categorías populares</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(({ category, count }) => (
              <Link
                key={category}
                href={`/cursos?category=${encodeURIComponent(category)}`}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {category} <span className="text-muted-foreground">({count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Cursos destacados</h2>
          <Link
            href="/cursos"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Ver todos
          </Link>
        </div>
        {featuredCourses.length === 0 ? (
          <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            Todavía no hay cursos publicados. ¡Sé el primer instructor!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
