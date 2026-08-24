"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/auth-helpers";
import { courseBasicInfoSchema } from "@/lib/validations/course";
import { slugify } from "@/lib/utils";

export interface CourseActionState {
  error?: string;
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
  excludeCourseId?: string,
) {
  const baseSlug = slugify(title) || "curso";
  let slug = baseSlug;
  let attempt = 0;

  while (true) {
    let query = supabase.from("courses").select("id").eq("slug", slug);
    if (excludeCourseId) query = query.neq("id", excludeCourseId);
    const { data: existing } = await query.maybeSingle();
    if (!existing) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
}

export async function createCourseAction(
  _prevState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const parsed = courseBasicInfoSchema.safeParse({
    title: formData.get("title"),
    short_description: formData.get("short_description"),
    description: formData.get("description"),
    category: formData.get("category"),
    level: formData.get("level"),
    price: formData.get("price"),
    thumbnail_url: formData.get("thumbnail_url"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) redirect("/login");

  const slug = await generateUniqueSlug(supabase, parsed.data.title);

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      instructor_id: user.id,
      title: parsed.data.title,
      slug,
      short_description: parsed.data.short_description,
      description: parsed.data.description,
      category: parsed.data.category,
      level: parsed.data.level,
      price: parsed.data.price,
      thumbnail_url: parsed.data.thumbnail_url || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !course) return { error: error?.message ?? "No se pudo crear el curso" };

  revalidatePath("/instructor/cursos");
  redirect(`/instructor/cursos/${course.id}/curriculum`);
}

export async function updateCourseBasicInfoAction(
  courseId: string,
  _prevState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const parsed = courseBasicInfoSchema.safeParse({
    title: formData.get("title"),
    short_description: formData.get("short_description"),
    description: formData.get("description"),
    category: formData.get("category"),
    level: formData.get("level"),
    price: formData.get("price"),
    thumbnail_url: formData.get("thumbnail_url"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createClient();
  const slug = await generateUniqueSlug(supabase, parsed.data.title, courseId);

  const { error } = await supabase
    .from("courses")
    .update({
      title: parsed.data.title,
      slug,
      short_description: parsed.data.short_description,
      description: parsed.data.description,
      category: parsed.data.category,
      level: parsed.data.level,
      price: parsed.data.price,
      thumbnail_url: parsed.data.thumbnail_url || null,
    })
    .eq("id", courseId);

  if (error) return { error: error.message };

  revalidatePath(`/instructor/cursos/${courseId}/editar`);
  revalidatePath("/instructor/cursos");
  return {};
}

export async function publishCourseAction(courseId: string) {
  const supabase = await createClient();

  const { count: sectionCount } = await supabase
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (!sectionCount) {
    return { error: "Agrega al menos una sección con una lección antes de publicar" };
  }

  const { data: sections } = await supabase.from("sections").select("id").eq("course_id", courseId);
  const sectionIds = (sections ?? []).map((s) => s.id);

  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .in("section_id", sectionIds.length > 0 ? sectionIds : ["00000000-0000-0000-0000-000000000000"]);

  if (!lessonCount) {
    return { error: "Agrega al menos una lección antes de publicar" };
  }

  const { error } = await supabase.from("courses").update({ status: "published" }).eq("id", courseId);
  if (error) return { error: error.message };

  revalidatePath("/instructor/cursos");
  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function unpublishCourseAction(courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").update({ status: "draft" }).eq("id", courseId);
  if (error) return { error: error.message };

  revalidatePath("/instructor/cursos");
  revalidatePath(`/instructor/cursos/${courseId}/curriculum`);
  return { success: true };
}

export async function deleteCourseAction(courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return { error: error.message };

  revalidatePath("/instructor/cursos");
  redirect("/instructor/cursos");
}
