"use client";

import { FileText, HelpCircle, Lock, PlayCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn, formatDuration } from "@/lib/utils";
import type { Lesson, Section } from "@/types/database";

const ICONS = { video: PlayCircle, text: FileText, quiz: HelpCircle };

interface CourseCurriculumProps {
  sections: (Section & { lessons: Lesson[] })[];
  isEnrolled: boolean;
}

export function CourseCurriculum({ sections, isEnrolled }: CourseCurriculumProps) {
  const totalLessons = sections.reduce((acc, section) => acc + section.lessons.length, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {sections.length} secciones · {totalLessons} lecciones
      </p>
      <Accordion multiple defaultValue={sections.slice(0, 1).map((s) => s.id)}>
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-medium">{section.title}</span>
              <span className="ml-auto mr-2 shrink-0 text-xs font-normal text-muted-foreground">
                {section.lessons.length} lecciones
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {section.lessons.map((lesson) => {
                  const Icon = ICONS[lesson.type];
                  const unlocked = isEnrolled || lesson.is_free_preview;
                  return (
                    <li key={lesson.id} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm">
                      {unlocked ? (
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Lock className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn("flex-1", !unlocked && "text-muted-foreground")}>
                        {lesson.title}
                      </span>
                      {lesson.is_free_preview && !isEnrolled && (
                        <span className="text-xs font-medium text-primary">Vista previa</span>
                      )}
                      {lesson.duration_seconds > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
