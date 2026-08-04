"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteCourseAction, publishCourseAction, unpublishCourseAction } from "@/lib/actions/courses";

export function CourseRowActions({ courseId, status }: { courseId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handlePublish() {
    startTransition(async () => {
      const result = await publishCourseAction(courseId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Curso publicado");
        router.refresh();
      }
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      await unpublishCourseAction(courseId);
      toast.success("Curso movido a borrador");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("¿Eliminar este curso? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      await deleteCourseAction(courseId);
    });
  }

  return (
    <div className="flex gap-2">
      {status === "published" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={handleUnpublish}>
          Pasar a borrador
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={handlePublish}>
          Publicar
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={handleDelete}
      >
        Eliminar
      </Button>
    </div>
  );
}
