"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFirstLessonId } from "@/lib/queries/courses";

/**
 * Inscripción directa para cursos gratuitos (price = 0), sin pasar por Stripe.
 * Usa la service role key porque el INSERT en `enrollments` está restringido
 * al backend por RLS; esta acción valida el precio antes de escribir.
 */
export async function enrollFreeCourseAction(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, price, status")
    .eq("id", courseId)
    .single();

  if (!course || course.status !== "published") {
    return { error: "Este curso no está disponible" };
  }
  if (Number(course.price) > 0) {
    return { error: "Este curso no es gratuito" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("enrollments").upsert(
    { student_id: user.id, course_id: courseId, amount_paid: 0 },
    { onConflict: "student_id,course_id", ignoreDuplicates: true },
  );
  if (error) return { error: error.message };

  const lessonId = await getFirstLessonId(courseId);
  redirect(lessonId ? `/aprender/${courseId}/${lessonId}` : "/estudiante");
}
