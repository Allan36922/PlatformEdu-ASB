import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Award, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LessonSidebar } from "@/components/player/lesson-sidebar";
import { VideoPlayer } from "@/components/player/video-player";
import { QuizViewer } from "@/components/player/quiz-viewer";
import { MarkCompleteButton } from "@/components/player/mark-complete-button";
import { getLearningData } from "@/lib/queries/learning";
import { createClient } from "@/lib/supabase/server";

interface PlayerPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const data = await getLearningData(courseId, lessonId);
  return { title: data ? `${data.currentLesson.title} · ${data.course.title}` : "Lección" };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { courseId, lessonId } = await params;
  const data = await getLearningData(courseId, lessonId);
  if (!data) notFound();

  const { course, sections, currentLesson, canAccess, isEnrolled, progressPercent, progressMap } = data;

  if (!canAccess) {
    redirect(`/cursos/${course.slug}`);
  }

  const allLessons = sections.flatMap((section) => section.lessons);
  const currentIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const completedLessonIds = new Set(
    Array.from(progressMap.values())
      .filter((p) => p.completed_at)
      .map((p) => p.lesson_id),
  );

  let certificateId: string | null = null;
  if (isEnrolled && progressPercent === 100) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: certificate } = await supabase
        .from("certificates")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();
      certificateId = certificate?.id ?? null;
    }
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col lg:flex-row">
      <aside className="order-2 flex flex-col border-t lg:order-1 lg:w-80 lg:shrink-0 lg:border-t-0 lg:border-r">
        <div className="space-y-2 border-b p-4">
          <Link href={`/cursos/${course.slug}`} className="text-sm font-medium hover:underline">
            {course.title}
          </Link>
          {isEnrolled && (
            <div className="space-y-1">
              <Progress value={progressPercent} />
              <p className="text-xs text-muted-foreground">{progressPercent}% completado</p>
            </div>
          )}
          {certificateId && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              render={
                <a href={`/api/certificates/${certificateId}`} target="_blank" rel="noreferrer">
                  <Award className="mr-1 size-4" /> Descargar certificado
                </a>
              }
            />
          )}
        </div>
        <LessonSidebar
          courseId={courseId}
          sections={sections}
          currentLessonId={lessonId}
          completedLessonIds={completedLessonIds}
        />
      </aside>

      <main className="order-1 flex-1 space-y-6 p-4 sm:p-8 lg:order-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{currentLesson.title}</h1>
        </div>

        {currentLesson.type === "video" && currentLesson.content_url && (
          <VideoPlayer url={currentLesson.content_url} />
        )}

        {currentLesson.type === "text" && (
          <div className="prose prose-neutral max-w-none whitespace-pre-line dark:prose-invert">
            {currentLesson.content_text}
          </div>
        )}

        {currentLesson.type === "quiz" && (
          <QuizViewer
            lessonId={currentLesson.id}
            questions={currentLesson.quiz_questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: q.options,
            }))}
          />
        )}

        {currentLesson.attachment_url && (
          <a
            href={currentLesson.attachment_url}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            <Download className="size-4" /> Descargar material adjunto
          </a>
        )}

        {isEnrolled && (
          <div className="flex items-center justify-between border-t pt-6">
            <div>
              {prevLesson ? (
                <Button
                  variant="ghost"
                  render={
                    <Link href={`/aprender/${courseId}/${prevLesson.id}`}>
                      <ChevronLeft className="mr-1 size-4" /> Anterior
                    </Link>
                  }
                />
              ) : (
                <span />
              )}
            </div>
            <MarkCompleteButton
              courseId={courseId}
              lessonId={lessonId}
              isCompleted={completedLessonIds.has(lessonId)}
            />
            <div>
              {nextLesson ? (
                <Button
                  variant="ghost"
                  render={
                    <Link href={`/aprender/${courseId}/${nextLesson.id}`}>
                      Siguiente <ChevronRight className="ml-1 size-4" />
                    </Link>
                  }
                />
              ) : (
                <span />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
