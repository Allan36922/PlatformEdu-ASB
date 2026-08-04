"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validations/review";

export interface ReviewActionState {
  error?: string;
  success?: boolean;
}

export async function submitReviewAction(
  courseId: string,
  slug: string,
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para dejar una reseña" };

  const { error } = await supabase.from("reviews").upsert(
    {
      student_id: user.id,
      course_id: courseId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    { onConflict: "student_id,course_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/cursos/${slug}`);
  return { success: true };
}
