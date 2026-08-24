import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/auth-helpers";
import type { Course, Lesson, LessonProgress, QuizQuestion, Section } from "@/types/database";

export type LessonWithQuiz = Lesson & { quiz_questions: QuizQuestion[] };
export type SectionWithLessons = Section & { lessons: LessonWithQuiz[] };

export interface LearningData {
  course: Course;
  sections: SectionWithLessons[];
  currentLesson: LessonWithQuiz;
  isEnrolled: boolean;
  isOwner: boolean;
  canAccess: boolean;
  progressPercent: number;
  progressMap: Map<string, LessonProgress>;
}

export async function getLearningData(courseId: string, lessonId: string): Promise<LearningData | null> {
  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) return null;

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
  if (!course) return null;

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  const { data: sectionsRaw } = await supabase
    .from("sections")
    .select("*, lessons(*, quiz_questions(*))")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  const sections: SectionWithLessons[] = (sectionsRaw ?? []).map((section) => ({
    ...(section as Section),
    lessons: [
      ...(((section as unknown as { lessons: LessonWithQuiz[] }).lessons) ?? []),
    ]
      .sort((a, b) => a.position - b.position)
      .map((lesson) => ({
        ...lesson,
        quiz_questions: [...(lesson.quiz_questions ?? [])].sort((a, b) => a.position - b.position),
      })),
  }));

  const currentLesson = sections.flatMap((section) => section.lessons).find((l) => l.id === lessonId);
  if (!currentLesson) return null;

  const isEnrolled = Boolean(enrollment);
  const isOwner = course.instructor_id === user.id;
  const canAccess = isEnrolled || isOwner || currentLesson.is_free_preview;

  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("student_id", user.id);

  const progressMap = new Map((progressRows ?? []).map((row) => [row.lesson_id, row as LessonProgress]));

  return {
    course: course as Course,
    sections,
    currentLesson,
    isEnrolled,
    isOwner,
    canAccess,
    progressPercent: enrollment?.progress_percent ?? 0,
    progressMap,
  };
}
