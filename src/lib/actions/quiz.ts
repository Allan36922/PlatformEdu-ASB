"use server";

import { createClient } from "@/lib/supabase/server";

export interface QuizResult {
  score: number;
  total: number;
  results: Record<string, boolean>;
}

export async function submitQuizAnswersAction(
  lessonId: string,
  answers: Record<string, number>,
): Promise<QuizResult> {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_option")
    .eq("lesson_id", lessonId);

  if (!questions) return { score: 0, total: 0, results: {} };

  const results: Record<string, boolean> = {};
  let score = 0;
  for (const question of questions) {
    const isCorrect = answers[question.id] === question.correct_option;
    results[question.id] = isCorrect;
    if (isCorrect) score += 1;
  }

  return { score, total: questions.length, results };
}
