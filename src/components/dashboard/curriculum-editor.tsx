"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, HelpCircle, Lock, PlayCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LessonDialog } from "./lesson-dialog";
import {
  createLessonAction,
  createSectionAction,
  deleteLessonAction,
  deleteSectionAction,
  reorderLessonsAction,
  reorderSectionsAction,
  updateLessonAction,
  updateSectionAction,
} from "@/lib/actions/curriculum";
import type { Lesson, QuizQuestion, Section } from "@/types/database";
import { cn, formatDuration } from "@/lib/utils";

type LessonWithQuiz = Lesson & { quiz_questions: QuizQuestion[] };
type SectionWithLessons = Section & { lessons: LessonWithQuiz[] };

const LESSON_ICONS = { video: PlayCircle, text: FileText, quiz: HelpCircle };

interface CurriculumEditorProps {
  courseId: string;
  initialSections: SectionWithLessons[];
}

export function CurriculumEditor({ courseId, initialSections }: CurriculumEditorProps) {
  const [sections, setSections] = useState(initialSections);
  const [prevInitialSections, setPrevInitialSections] = useState(initialSections);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (initialSections !== prevInitialSections) {
    setPrevInitialSections(initialSections);
    setSections(initialSections);
  }

  function handleAddSection() {
    if (!newSectionTitle.trim()) return;
    const formData = new FormData();
    formData.set("title", newSectionTitle.trim());
    startTransition(async () => {
      const result = await createSectionAction(courseId, formData);
      if (result?.error) toast.error(result.error);
      else setNewSectionTitle("");
    });
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);
    startTransition(() => reorderSectionsAction(courseId, reordered.map((s) => s.id)));
  }

  function handleLessonsReordered(sectionId: string, lessons: LessonWithQuiz[]) {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, lessons } : s)));
    startTransition(async () => {
      await reorderLessonsAction(sectionId, courseId, lessons.map((l) => l.id));
    });
  }

  function handleDeleteSection(sectionId: string) {
    if (!confirm("¿Eliminar esta sección y todas sus lecciones?")) return;
    startTransition(async () => {
      const result = await deleteSectionAction(sectionId, courseId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                courseId={courseId}
                section={section}
                pending={pending}
                onLessonsReordered={(lessons) => handleLessonsReordered(section.id, lessons)}
                onDeleteSection={() => handleDeleteSection(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2 rounded-lg border border-dashed p-4">
        <Input
          value={newSectionTitle}
          onChange={(event) => setNewSectionTitle(event.target.value)}
          placeholder="Título de la nueva sección"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAddSection();
            }
          }}
        />
        <Button type="button" onClick={handleAddSection} disabled={pending}>
          <Plus className="mr-1 size-4" /> Agregar sección
        </Button>
      </div>
    </div>
  );
}

function SortableSection({
  courseId,
  section,
  pending,
  onLessonsReordered,
  onDeleteSection,
}: {
  courseId: string;
  section: SectionWithLessons;
  pending: boolean;
  onLessonsReordered: (lessons: LessonWithQuiz[]) => void;
  onDeleteSection: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const [title, setTitle] = useState(section.title);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const style = { transform: CSS.Transform.toString(transform), transition };

  function handleTitleBlur() {
    if (title.trim() === section.title || !title.trim()) {
      setTitle(section.title);
      return;
    }
    const formData = new FormData();
    formData.set("title", title.trim());
    updateSectionAction(section.id, courseId, formData);
  }

  function handleLessonDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = section.lessons.findIndex((l) => l.id === active.id);
    const newIndex = section.lessons.findIndex((l) => l.id === over.id);
    onLessonsReordered(arrayMove(section.lessons, oldIndex, newIndex));
  }

  const boundCreateLesson = createLessonAction.bind(null, section.id, courseId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("rounded-lg border bg-background", isDragging && "opacity-60 shadow-lg")}
    >
      <div className="flex items-center gap-2 border-b p-3">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Reordenar sección"
        >
          <GripVertical className="size-4" />
        </button>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={handleTitleBlur}
          className="h-8 max-w-sm border-none px-1 font-medium shadow-none focus-visible:ring-1"
        />
        <span className="text-xs text-muted-foreground">{section.lessons.length} lecciones</span>
        <div className="ml-auto flex items-center gap-2">
          <LessonDialog
            action={boundCreateLesson}
            trigger={
              <Button type="button" size="sm" variant="outline" disabled={pending}>
                <Plus className="mr-1 size-3.5" /> Lección
              </Button>
            }
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDeleteSection}
            disabled={pending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {section.lessons.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
          <SortableContext items={section.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y">
              {section.lessons.map((lesson) => (
                <SortableLesson key={lesson.id} courseId={courseId} lesson={lesson} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableLesson({ courseId, lesson }: { courseId: string; lesson: LessonWithQuiz }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });
  const [pending, startTransition] = useTransition();
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = LESSON_ICONS[lesson.type];
  const boundUpdateLesson = updateLessonAction.bind(null, lesson.id, courseId);

  function handleDelete() {
    if (!confirm("¿Eliminar esta lección?")) return;
    startTransition(async () => {
      const result = await deleteLessonAction(lesson.id, courseId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-3 px-3 py-2.5 text-sm", isDragging && "opacity-60")}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Reordenar lección"
      >
        <GripVertical className="size-4" />
      </button>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">{lesson.title}</span>
      {lesson.is_free_preview && (
        <span className="flex items-center gap-1 text-xs font-medium text-primary">
          Vista previa
        </span>
      )}
      {!lesson.is_free_preview && <Lock className="size-3.5 text-muted-foreground" />}
      {lesson.duration_seconds > 0 && (
        <span className="text-xs text-muted-foreground">{formatDuration(lesson.duration_seconds)}</span>
      )}
      <LessonDialog
        action={boundUpdateLesson}
        lesson={lesson}
        trigger={
          <Button type="button" size="sm" variant="ghost" disabled={pending}>
            Editar
          </Button>
        }
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={handleDelete}
        disabled={pending}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
