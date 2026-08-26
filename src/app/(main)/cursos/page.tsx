import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CourseFilters } from "@/components/catalog/course-filters";
import { CourseCard } from "@/components/courses/course-card";
import { CoursePagination } from "@/components/catalog/pagination";
import { searchCourses, type CourseFilters as CourseFiltersType } from "@/lib/queries/courses";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Explorar cursos" };

interface CoursesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const view = params.view === "list" ? "list" : "grid";

  const { courses, total, pageSize } = await searchCourses({
    category: params.category,
    level: params.level,
    search: params.search,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    sort: params.sort as CourseFiltersType["sort"],
    page,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">Explorar cursos</h1>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/agente-edy">🤖 Habla con Edy</Link>}
          />
        </div>
        <Suspense>
          <CourseFilters />
        </Suspense>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No encontramos cursos con esos filtros. Prueba ajustando la búsqueda.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {total} curso{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}
          </p>
          <div
            className={
              view === "list"
                ? "flex flex-col gap-4"
                : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} layout={view} />
            ))}
          </div>
          <CoursePagination page={page} pageSize={pageSize} total={total} searchParams={params} />
        </>
      )}
    </div>
  );
}
