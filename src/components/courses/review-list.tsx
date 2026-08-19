import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewListItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student: { full_name: string | null; avatar_url: string | null } | null;
}

export function ReviewList({ reviews }: { reviews: ReviewListItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Este curso todavía no tiene reseñas.</p>;
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => {
        const initials = (review.student?.full_name ?? "U")
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <li key={review.id} className="flex gap-3">
            <Avatar className="size-9">
              <AvatarImage
                src={review.student?.avatar_url ?? undefined}
                alt={`Foto de ${review.student?.full_name ?? "estudiante"}`}
              />
              <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{review.student?.full_name ?? "Estudiante"}</span>
                <span
                  className="flex items-center gap-0.5"
                  role="img"
                  aria-label={`Calificación: ${review.rating} de 5 estrellas`}
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      aria-hidden="true"
                      className={`size-3.5 ${
                        index < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </span>
              </div>
              {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
