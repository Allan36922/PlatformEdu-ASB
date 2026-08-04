"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lessonSchema, quizQuestionSchema, sectionSchema } from "@/lib/validations/course";
import { z } from "zod";

interface ActionResult {
  error?: string;
  success?: boolean;
}

function lessonPayloadFromFormData(formData: FormData) {
  return lessonSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    content_url: formData.get("content_url") ?? "",
    content_text: formData.get("content_text") ?? "",
    attachment_url: formData.get("attachment_url") ?? "",
    duration_seconds: formData.get("duration_seconds") || 0,
    is_free_preview: formData.get("is_free_preview") === "on",
  });
}

const quizQuestionsArraySchema = z.array(quizQuestionSchema);

async function syncQuizQuestions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lessonId: string,
  rawJson: FormDataEntryValue | null,
) {
  if (!rawJson || typeof rawJson !== "string") return;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch {
    return;
  }

  const parsed = quizQuestionsArraySchema.safeParse(parsedJson);
  if (!parsed.success) return;

  await supabase.from("quiz_questions").delete().eq("lesson_id", lessonId);
  if (parsed.data.length === 0) return;

  await supabase.from("quiz_questions").insert(
    parsed.data.map((question, index) => ({
      lesson_id: lessonId,
      question: question.question,
      options: question.options,
      correct_option: question.correct_option,
      position: index,
    })),
  );
}

export async function createSectionAction(
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = sectionSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const { error } = await supabase
    .from("sections")
    .insert({ course_id: courseId, title: parsed.data.title, position: count ?? 0 });
  if (error) return { error: error.message };

  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function updateSectionAction(
  sectionId: string,
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = sectionSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sections")
    .update({ title: parsed.data.title })
    .eq("id", sectionId);
  if (error) return { error: error.message };

  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function deleteSectionAction(sectionId: string, courseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) return { error: error.message };

  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function reorderSectionsAction(courseId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("sections").update({ position: index }).eq("id", id)),
  );
  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
}

export async function createLessonAction(
  sectionId: string,
  courseId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = lessonPayloadFromFormData(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionId);

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      section_id: sectionId,
      title: parsed.data.title,
      type: parsed.data.type,
      content_url: parsed.data.content_url || null,
      content_text: parsed.data.content_text || null,
      attachment_url: parsed.data.attachment_url || null,
      duration_seconds: parsed.data.duration_seconds,
      is_free_preview: parsed.data.is_free_preview,
      position: count ?? 0,
    })
    .select("id")
    .single();
  if (error || !lesson) return { error: error?.message ?? "No se pudo crear la lección" };

  if (parsed.data.type === "quiz") {
    await syncQuizQuestions(supabase, lesson.id, formData.get("quiz_questions_json"));
  }

  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function updateLessonAction(
  lessonId: string,
  courseId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = lessonPayloadFromFormData(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      title: parsed.data.title,
      type: parsed.data.type,
      content_url: parsed.data.content_url || null,
      content_text: parsed.data.content_text || null,
      attachment_url: parsed.data.attachment_url || null,
      duration_seconds: parsed.data.duration_seconds,
      is_free_preview: parsed.data.is_free_preview,
    })
    .eq("id", lessonId);
  if (error) return { error: error.message };

  if (parsed.data.type === "quiz") {
    await syncQuizQuestions(supabase, lessonId, formData.get("quiz_questions_json"));
  }

  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function deleteLessonAction(lessonId: string, courseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) return { error: error.message };

  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function reorderLessonsAction(sectionId: string, courseId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("lessons").update({ position: index }).eq("id", id)),
  );
  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true, sectionId };
}
