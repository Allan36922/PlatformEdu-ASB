import { courseLevelLabel } from "@/lib/utils";
import type { Course, SectionWithLessons } from "@/types/database";

/**
 * Arma el texto plano a embeber para búsqueda semántica de un curso: título,
 * descripción, nivel, categoría y los títulos de secciones/lecciones del temario.
 */
export function buildCourseEmbeddingText(course: Course, sections: SectionWithLessons[]): string {
  const parts = [
    course.title,
    course.description,
    courseLevelLabel(course.level),
    course.category,
    ...sections.flatMap((section) => [section.title, ...section.lessons.map((lesson) => lesson.title)]),
  ];

  return parts.filter((part): part is string => Boolean(part && part.trim())).join("\n");
}
