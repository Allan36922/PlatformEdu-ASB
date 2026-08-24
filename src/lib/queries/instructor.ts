import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/auth-helpers";
import type { Course, Lesson, QuizQuestion, Section } from "@/types/database";

export async function getInstructorCourses() {
  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) return [];

  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as Course[];
}

export async function getInstructorCourseById(courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").eq("id", courseId).single();
  return data as Course | null;
}

export async function getCourseCurriculum(courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sections")
    .select("*, lessons(*, quiz_questions(*))")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  return (data ?? []).map((section) => ({
    ...(section as Section),
    lessons: [
      ...(((section as unknown as { lessons: (Lesson & { quiz_questions: QuizQuestion[] })[] })
        .lessons) ?? []),
    ]
      .sort((a, b) => a.position - b.position)
      .map((lesson) => ({
        ...lesson,
        quiz_questions: [...(lesson.quiz_questions ?? [])].sort((a, b) => a.position - b.position),
      })),
  }));
}
