"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface QuizQuestionDraft {
  question: string;
  options: string[];
  correct_option: number;
}

interface QuizQuestionsEditorProps {
  initialQuestions: QuizQuestionDraft[];
  onChange: (questions: QuizQuestionDraft[]) => void;
}

export function QuizQuestionsEditor({ initialQuestions, onChange }: QuizQuestionsEditorProps) {
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>(initialQuestions);

  function update(next: QuizQuestionDraft[]) {
    setQuestions(next);
    onChange(next);
  }

  function addQuestion() {
    update([...questions, { question: "", options: ["", ""], correct_option: 0 }]);
  }

  function removeQuestion(index: number) {
    update(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestionDraft>) {
    update(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function addOption(qIndex: number) {
    updateQuestion(qIndex, { options: [...questions[qIndex].options, ""] });
  }

  function removeOption(qIndex: number, oIndex: number) {
    const options = questions[qIndex].options.filter((_, i) => i !== oIndex);
    const correct =
      questions[qIndex].correct_option >= options.length ? 0 : questions[qIndex].correct_option;
    updateQuestion(qIndex, { options, correct_option: correct });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Preguntas del quiz</p>
        <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
          <Plus className="mr-1 size-4" /> Agregar pregunta
        </Button>
      </div>
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Agrega al menos una pregunta de opción múltiple.
        </p>
      )}
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="space-y-3 rounded-md border p-3">
          <div className="flex items-start gap-2">
            <Input
              value={question.question}
              onChange={(event) => updateQuestion(qIndex, { question: event.target.value })}
              placeholder={`Pregunta ${qIndex + 1}`}
            />
            <Button type="button" size="icon" variant="ghost" onClick={() => removeQuestion(qIndex)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="space-y-2 pl-2">
            {question.options.map((option, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={question.correct_option === oIndex}
                  onChange={() => updateQuestion(qIndex, { correct_option: oIndex })}
                  aria-label={`Marcar opción ${oIndex + 1} como correcta`}
                />
                <Input
                  value={option}
                  onChange={(event) => {
                    const options = [...question.options];
                    options[oIndex] = event.target.value;
                    updateQuestion(qIndex, { options });
                  }}
                  placeholder={`Opción ${oIndex + 1}`}
                />
                {question.options.length > 2 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeOption(qIndex, oIndex)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {question.options.length < 6 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => addOption(qIndex)}>
                <Plus className="mr-1 size-3.5" /> Agregar opción
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
