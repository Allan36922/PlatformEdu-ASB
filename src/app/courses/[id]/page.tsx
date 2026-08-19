import { notFound, redirect } from "next/navigation";
import { getPublishedCourseById } from "@/lib/queries/courses";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

/**
 * /courses/[id] existe para consumidores que solo conocen el ID del curso
 * (p. ej. la API del agente Edy, /api/agent/courses/[id]). El detalle
 * canonico vive en /cursos/[slug]; esta ruta solo resuelve el slug y
 * redirige, para no duplicar contenido indexable.
 * Ver docs/historia-usuario-ruta-detalle-curso-por-id.md (opcion B).
 */
export default async function CourseByIdRedirectPage({ params }: CoursePageProps) {
  const { id } = await params;
  const course = await getPublishedCourseById(id);

  if (!course) notFound();

  redirect(`/cursos/${course.slug}`);
}
