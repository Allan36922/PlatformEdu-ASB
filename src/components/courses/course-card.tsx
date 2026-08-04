import Image from "next/image";
import Link from "next/link";
import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { courseLevelLabel, formatCurrency } from "@/lib/utils";
import type { CourseWithInstructor } from "@/types/database";

export function CourseCard({ course }: { course: CourseWithInstructor }) {
  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            {course.category}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Badge variant="secondary" className="w-fit">
          {course.category}
        </Badge>
        <h3 className="line-clamp-2 font-semibold leading-snug">{course.title}</h3>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {course.instructor?.full_name ?? "Instructor"} · {courseLevelLabel(course.level)}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {course.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {course.rating_average.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {course.student_count}
            </span>
          </div>
          <span className="font-semibold">{formatCurrency(course.price)}</span>
        </div>
      </div>
    </Link>
  );
}
