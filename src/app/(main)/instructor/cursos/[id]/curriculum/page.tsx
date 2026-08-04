import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurriculumEditor } from "@/components/dashboard/curriculum-editor";
import { CourseRowActions } from "@/components/dashboard/course-row-actions";
import { getCourseCurriculum, getInstructorCourseById } from "@/lib/queries/instructor";

export const metadata: Metadata = { title: "Curriculum del curso" };

interface CurriculumPageProps {
  params: Promise<{ id: string }>;
}

export default async function CurriculumPage({ params }: CurriculumPageProps) {
  const { id } = await params;
  const course = await getInstructorCourseById(id);
  if (!course) notFound();

  const sections = await getCourseCurriculum(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
            <Badge variant={course.status === "published" ? "default" : "secondary"}>
              {course.status === "published" ? "Publicado" : "Borrador"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Organiza el temario del curso en secciones y lecciones. Arrastra para reordenar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href={`/instructor/cursos/${id}/editar`}>Editar información</Link>}
          />
          <CourseRowActions courseId={id} status={course.status} />
        </div>
      </div>

      <CurriculumEditor courseId={id} initialSections={sections} />
    </div>
  );
}
