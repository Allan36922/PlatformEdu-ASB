"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markLessonCompleteAction } from "@/lib/actions/progress";

interface MarkCompleteButtonProps {
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
}

export function MarkCompleteButton({ courseId, lessonId, isCompleted }: MarkCompleteButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 font-medium text-emerald-400">
        <CheckCircle2 className="size-5" />
        Lección completada
      </div>
    );
  }

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markLessonCompleteAction(courseId, lessonId);
          if (result?.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Lección marcada como completada");
          router.refresh();
        })
      }
    >
      {pending ? "Guardando..." : "Marcar como completada"}
    </Button>
  );
}
