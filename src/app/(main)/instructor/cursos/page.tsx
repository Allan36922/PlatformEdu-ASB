import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseRowActions } from "@/components/dashboard/course-row-actions";
import { getInstructorCourses } from "@/lib/queries/instructor";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis cursos" };

export default async function InstructorCoursesPage() {
  const courses = await getInstructorCourses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mis cursos</h1>
        <Button
          render={
            <Link href="/instructor/cursos/nuevo">
              <Plus className="mr-1 size-4" /> Crear nuevo curso
            </Link>
          }
        />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Todavía no has creado ningún curso.</p>
          <Button
            className="mt-4"
            render={<Link href="/instructor/cursos/nuevo">Crear mi primer curso</Link>}
          />
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {courses.map((course) => (
            <div key={course.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{course.title}</span>
                  <Badge variant={course.status === "published" ? "default" : "secondary"}>
                    {course.status === "published" ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(course.price)} · {course.student_count} estudiantes · {course.category}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/instructor/cursos/${course.id}/curriculum`}>Curriculum</Link>}
                />
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/instructor/cursos/${course.id}/editar`}>Editar</Link>}
                />
                {course.status === "published" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    render={<Link href={`/cursos/${course.slug}`}>Ver público</Link>}
                  />
                )}
                <CourseRowActions courseId={course.id} status={course.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
