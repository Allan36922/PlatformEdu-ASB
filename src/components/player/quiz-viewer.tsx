"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitQuizAnswersAction, type QuizResult } from "@/lib/actions/quiz";

interface QuizViewerProps {
  lessonId: string;
  questions: { id: string; question: string; options: string[] }[];
}

export function QuizViewer({ lessonId, questions }: QuizViewerProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitQuizAnswersAction(lessonId, answers);
      setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={question.id} className="rounded-lg border p-4">
          <p className="mb-3 font-medium">
            {index + 1}. {question.question}
          </p>
          <div className="space-y-2">
            {question.options.map((option, oIndex) => {
              const isSelected = answers[question.id] === oIndex;
              const isCorrectSelection = result && isSelected && result.results[question.id];
              const isWrongSelection = result && isSelected && !result.results[question.id];
              return (
                <button
                  key={oIndex}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: oIndex }))}
                  className={cn(
                    "flex w-full items-center rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    isSelected && !result && "border-primary bg-primary/5",
                    isCorrectSelection && "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                    isWrongSelection && "border-destructive bg-destructive/5 text-destructive",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!result ? (
        <Button
          onClick={handleSubmit}
          disabled={pending || Object.keys(answers).length < questions.length}
        >
          {pending ? "Enviando..." : "Enviar respuestas"}
        </Button>
      ) : (
        <p className="font-medium">
          Obtuviste {result.score} de {result.total} respuestas correctas.
        </p>
      )}
    </div>
  );
}
