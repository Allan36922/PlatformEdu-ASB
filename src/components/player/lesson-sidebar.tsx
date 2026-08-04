import Link from "next/link";
import { CheckCircle2, Circle, FileText, HelpCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionWithLessons } from "@/lib/queries/learning";

const ICONS = { video: PlayCircle, text: FileText, quiz: HelpCircle };

interface LessonSidebarProps {
  courseId: string;
  sections: SectionWithLessons[];
  currentLessonId: string;
  completedLessonIds: Set<string>;
}

export function LessonSidebar({
  courseId,
  sections,
  currentLessonId,
  completedLessonIds,
}: LessonSidebarProps) {
  return (
    <nav className="divide-y overflow-y-auto">
      {sections.map((section) => (
        <div key={section.id} className="py-2">
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </p>
          <ul>
            {section.lessons.map((lesson) => {
              const Icon = ICONS[lesson.type];
              const isCurrent = lesson.id === currentLessonId;
              const isCompleted = completedLessonIds.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/aprender/${courseId}/${lesson.id}`}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-muted",
                      isCurrent && "bg-muted font-medium",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2 flex-1">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
