import type { Metadata } from "next";
import { CourseForm } from "@/components/dashboard/course-form";
import { createCourseAction } from "@/lib/actions/courses";

export const metadata: Metadata = { title: "Crear curso" };

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crear nuevo curso</h1>
        <p className="text-sm text-muted-foreground">
          Empieza con la información básica. Podrás agregar el temario después.
        </p>
      </div>
      <CourseForm action={createCourseAction} submitLabel="Crear curso y continuar" />
    </div>
  );
}
