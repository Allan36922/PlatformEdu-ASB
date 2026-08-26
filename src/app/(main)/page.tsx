import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/courses/course-card";
import { getCategoriesWithCounts, getFeaturedCourses } from "@/lib/queries/courses";
import { LiveSimulator } from "@/components/landing/live-simulator";

export default async function HomePage() {
  const [featuredCourses, categories] = await Promise.all([
    getFeaturedCourses(8),
    getCategoriesWithCounts(),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-background text-foreground py-20 lg:py-28">
        {/* Primary-tinted ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-15 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 flex flex-col items-center text-center space-y-12">
          <div className="space-y-6 max-w-3xl">
            {/* Eyebrow */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono font-medium text-primary tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Nueva Experiencia de Aprendizaje
            </span>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight font-heading text-balance sm:text-6xl bg-gradient-to-b from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent">
              Domina las habilidades del futuro con clases interactivas
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-xl text-md sm:text-lg text-muted-foreground text-balance leading-relaxed">
              Descubre cursos premium creados por expertos en desarrollo, diseño, IA y negocios. Disfruta de un reproductor de última generación, quizzes integrados y certificaciones automáticas.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex justify-center items-center gap-4 flex-wrap">
              <Button size="lg" nativeButton={false} render={<Link href="/cursos">Explorar Cursos</Link>} />
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/agente-edy">🤖 Habla con Edy</Link>}
              />
              <Button
                size="lg"
                variant="ghost"
                nativeButton={false}
                render={<Link href="/signup">Enseñar en EduPlatform</Link>}
              />
            </div>
          </div>

          {/* Signature Live Simulator */}
          <div className="w-full pt-6">
            <LiveSimulator />
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold font-heading">Categorías populares</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(({ category, count }) => (
              <Badge
                key={category}
                variant="outline"
                className="px-4 py-2 text-sm font-medium"
                render={
                  <Link href={`/cursos?category=${encodeURIComponent(category)}`}>
                    {category} <span className="text-muted-foreground">({count})</span>
                  </Link>
                }
              />
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
