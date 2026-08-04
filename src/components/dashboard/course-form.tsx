"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { courseCategories } from "@/lib/validations/course";
import type { Course } from "@/types/database";
import type { CourseActionState } from "@/lib/actions/courses";

interface CourseFormProps {
  action: (state: CourseActionState, formData: FormData) => Promise<CourseActionState>;
  course?: Course;
  submitLabel: string;
}

const initialState: CourseActionState = {};

export function CourseForm({ action, course, submitLabel }: CourseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Título del curso</Label>
        <Input id="title" name="title" defaultValue={course?.title} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="short_description">Descripción corta</Label>
        <Input
          id="short_description"
          name="short_description"
          defaultValue={course?.short_description ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción completa</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={course?.description ?? ""}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select name="category" defaultValue={course?.category}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {courseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Nivel</Label>
          <Select name="level" defaultValue={course?.level ?? "beginner"}>
            <SelectTrigger id="level" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Principiante</SelectItem>
              <SelectItem value="intermediate">Intermedio</SelectItem>
              <SelectItem value="advanced">Avanzado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Precio (USD, 0 = gratis)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={course?.price ?? 0}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="thumbnail_url">URL de imagen de portada</Label>
          <Input
            id="thumbnail_url"
            name="thumbnail_url"
            type="url"
            defaultValue={course?.thumbnail_url ?? ""}
            placeholder="https://..."
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
