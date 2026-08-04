"use client";

import { useState, useTransition } from "react";
import { GraduationCap, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction } from "@/lib/actions/auth";

const ROLES = [
  {
    id: "student" as const,
    title: "Quiero aprender",
    description: "Explora cursos, sigue tu progreso y obtén certificados.",
    icon: GraduationCap,
  },
  {
    id: "instructor" as const,
    title: "Quiero enseñar",
    description: "Crea y publica cursos, gestiona ventas y estudiantes.",
    icon: PenLine,
  },
];

export function OnboardingForm() {
  const [selected, setSelected] = useState<"student" | "instructor" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selected) {
      setError("Selecciona una opción para continuar");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("role", selected);
    startTransition(async () => {
      const result = await completeOnboardingAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected(id)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:border-foreground/40",
              selected === id && "border-foreground bg-muted",
            )}
          >
            <Icon className="size-6" />
            <span className="font-medium">{title}</span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={pending} onClick={handleSubmit}>
        {pending ? "Guardando..." : "Continuar"}
      </Button>
    </div>
  );
}
