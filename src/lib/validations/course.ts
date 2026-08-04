import { z } from "zod";

export const courseLevels = ["beginner", "intermediate", "advanced"] as const;
export const lessonTypes = ["video", "text", "quiz"] as const;

export const courseCategories = [
  "Desarrollo Web",
  "Ciencia de Datos",
  "Diseño",
  "Negocios",
  "Marketing",
  "Idiomas",
  "Productividad",
  "Fotografía y Video",
  "Música",
  "Desarrollo Personal",
] as const;

export const courseBasicInfoSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(120),
  short_description: z
    .string()
    .min(10, "La descripción corta debe tener al menos 10 caracteres")
    .max(200),
  description: z.string().min(20, "Agrega una descripción más completa del curso").max(5000),
  category: z.string().min(1, "Selecciona una categoría"),
  level: z.enum(courseLevels),
  price: z.coerce.number().min(0, "El precio no puede ser negativo").max(9999),
  thumbnail_url: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
});

export type CourseBasicInfoInput = z.infer<typeof courseBasicInfoSchema>;

export const sectionSchema = z.object({
  title: z.string().min(2, "El título de la sección es muy corto").max(120),
});

export type SectionInput = z.infer<typeof sectionSchema>;

export const lessonSchema = z
  .object({
    title: z.string().min(2, "El título de la lección es muy corto").max(120),
    type: z.enum(lessonTypes),
    content_url: z.string().url("URL inválida").optional().or(z.literal("")),
    content_text: z.string().max(20000).optional().or(z.literal("")),
    attachment_url: z.string().url("URL inválida").optional().or(z.literal("")),
    duration_seconds: z.coerce.number().int().min(0).default(0),
    is_free_preview: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.type === "video" && !data.content_url) {
      ctx.addIssue({
        code: "custom",
        path: ["content_url"],
        message: "Las lecciones en video requieren una URL de video",
      });
    }
    if (data.type === "text" && !data.content_text) {
      ctx.addIssue({
        code: "custom",
        path: ["content_text"],
        message: "Las lecciones de texto requieren contenido",
      });
    }
  });

export type LessonInput = z.infer<typeof lessonSchema>;

export const quizQuestionSchema = z.object({
  question: z.string().min(3, "La pregunta es muy corta").max(500),
  options: z.array(z.string().min(1)).min(2, "Agrega al menos 2 opciones").max(6),
  correct_option: z.coerce.number().int().min(0),
});

export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
