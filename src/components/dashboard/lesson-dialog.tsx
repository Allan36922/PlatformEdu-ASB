"use client";

import { useActionState, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuizQuestionsEditor, type QuizQuestionDraft } from "./quiz-questions-editor";
import type { Lesson, LessonType, QuizQuestion } from "@/types/database";

interface LessonActionState {
  error?: string;
  success?: boolean;
}

interface LessonDialogProps {
  action: (state: LessonActionState, formData: FormData) => Promise<LessonActionState>;
  lesson?: Lesson & { quiz_questions?: QuizQuestion[] };
  trigger: ReactElement;
}

const initialState: LessonActionState = {};

export function LessonDialog({ action, lesson, trigger }: LessonDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LessonType>(lesson?.type ?? "video");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDraft[]>(
    (lesson?.quiz_questions ?? []).map((q) => ({
      question: q.question,
      options: q.options,
      correct_option: q.correct_option,
    })),
  );

  const [state, formAction, pending] = useActionState(async (
    prevState: LessonActionState,
    formData: FormData,
  ) => {
    const result = await action(prevState, formData);
    if (!result?.error) setOpen(false);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lesson ? "Editar lección" : "Nueva lección"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Título</Label>
            <Input id="lesson-title" name="title" defaultValue={lesson?.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-type">Tipo de lección</Label>
            <Select name="type" value={type} onValueChange={(value) => setType(value as LessonType)}>
              <SelectTrigger id="lesson-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "video" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="content_url">URL del video (Storage, YouTube o Vimeo)</Label>
                <Input
                  id="content_url"
                  name="content_url"
                  type="url"
                  defaultValue={lesson?.content_url ?? ""}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_seconds">Duración (segundos)</Label>
                <Input
                  id="duration_seconds"
                  name="duration_seconds"
                  type="number"
                  min="0"
                  defaultValue={lesson?.duration_seconds ?? 0}
                />
              </div>
            </>
          )}

          {type === "text" && (
            <div className="space-y-2">
              <Label htmlFor="content_text">Contenido</Label>
              <Textarea
                id="content_text"
                name="content_text"
                rows={8}
                defaultValue={lesson?.content_text ?? ""}
              />
            </div>
          )}

          {type === "quiz" && (
            <>
              <input type="hidden" name="quiz_questions_json" value={JSON.stringify(quizQuestions)} />
              <QuizQuestionsEditor initialQuestions={quizQuestions} onChange={setQuizQuestions} />
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="attachment_url">Archivo adjunto (PDF/ZIP, opcional)</Label>
            <Input
              id="attachment_url"
              name="attachment_url"
              type="url"
              defaultValue={lesson?.attachment_url ?? ""}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="is_free_preview" name="is_free_preview" defaultChecked={lesson?.is_free_preview} />
            <Label htmlFor="is_free_preview" className="font-normal">
              Vista previa gratuita (visible sin comprar)
            </Label>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar lección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
