"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitReviewAction, type ReviewActionState } from "@/lib/actions/reviews";

interface ReviewFormProps {
  courseId: string;
  slug: string;
  existingReview?: { rating: number; comment: string | null };
}

const initialState: ReviewActionState = {};

export function ReviewForm({ courseId, slug, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const boundAction = submitReviewAction.bind(null, courseId, slug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-4">
      <p className="font-medium">{existingReview ? "Edita tu reseña" : "Deja tu reseña"}</p>
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(value)}
            aria-label={`${value} estrellas`}
          >
            <Star
              className={cn(
                "size-6",
                (hovered || rating) >= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        name="comment"
        placeholder="¿Qué te pareció el curso? (opcional)"
        defaultValue={existingReview?.comment ?? ""}
        rows={3}
      />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending || rating === 0}>
        {pending ? "Guardando..." : "Enviar reseña"}
      </Button>
    </form>
  );
}
