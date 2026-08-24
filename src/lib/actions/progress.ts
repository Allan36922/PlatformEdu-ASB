"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/auth-helpers";

export async function markLessonCompleteAction(courseId: string, lessonId: string) {
  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("lesson_progress").upsert(
    { student_id: user.id, lesson_id: lessonId, completed_at: new Date().toISOString() },
    { onConflict: "student_id,lesson_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/aprender/${courseId}/${lessonId}`);
  revalidatePath("/estudiante");
  return { success: true };
}

export async function saveLessonPositionAction(lessonId: string, seconds: number) {
  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) return;

  await supabase.from("lesson_progress").upsert(
    { student_id: user.id, lesson_id: lessonId, last_position_seconds: Math.round(seconds) },
    { onConflict: "student_id,lesson_id" },
  );
}
