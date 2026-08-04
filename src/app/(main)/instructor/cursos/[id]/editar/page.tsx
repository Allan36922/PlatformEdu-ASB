import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/dashboard/course-form";
import { updateCourseBasicInfoAction } from "@/lib/actions/courses";
import { getInstructorCourseById } from "@/lib/queries/instructor";

export const metadata: Metadata = { title: "Editar curso" };

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params;
  const course = await getInstructorCourseById(id);
  if (!course) notFound();

  const boundAction = updateCourseBasicInfoAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar curso</h1>
        <p className="text-sm text-muted-foreground">{course.title}</p>
      </div>
      <CourseForm action={boundAction} course={course} submitLabel="Guardar cambios" />
    </div>
  );
}
