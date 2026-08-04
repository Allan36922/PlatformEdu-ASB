import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star, Users, Clock, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseCurriculum } from "@/components/courses/course-curriculum";
import { ReviewList } from "@/components/courses/review-list";
import { ReviewForm } from "@/components/courses/review-form";
import { EnrollButton } from "@/components/courses/enroll-button";
import { getCourseBySlug, getFirstLessonId } from "@/lib/queries/courses";
import { createClient } from "@/lib/supabase/server";
import { courseLevelLabel, formatCurrency, formatDuration } from "@/lib/utils";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCourseBySlug(slug);
  if (!result) return { title: "Curso no encontrado" };
  return {
    title: result.course.title,
    description: result.course.short_description ?? undefined,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const result = await getCourseBySlug(slug);
  if (!result) notFound();

  const { course, sections, reviews, isEnrolled } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstLessonId = isEnrolled ? await getFirstLessonId(course.id) : null;
  const totalSeconds = sections.reduce(
    (acc, section) => acc + section.lessons.reduce((sum, lesson) => sum + lesson.duration_seconds, 0),
    0,
  );

  let existingReview: { rating: number; comment: string | null } | null = null;
  if (isEnrolled && user) {
    const { data } = await supabase
      .from("reviews")
      .select("rating, comment")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    existingReview = data;
  }

  return (
    <div>
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Badge variant="secondary">{course.category}</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-balance">{course.title}</h1>
            <p className="text-lg text-muted-foreground text-balance">{course.short_description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {course.rating_count > 0 && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  {course.rating_average.toFixed(1)} ({course.rating_count} reseñas)
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="size-4" /> {course.student_count} estudiantes
              </span>
              <span className="flex items-center gap-1">
                <BarChart className="size-4" /> {courseLevelLabel(course.level)}
              </span>
              {totalSeconds > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-4" /> {formatDuration(totalSeconds)}
                </span>
              )}
            </div>
            {course.instructor && (
              <div className="flex items-center gap-3 pt-2">
                <Avatar>
                  <AvatarImage src={course.instructor.avatar_url ?? undefined} />
                  <AvatarFallback>{(course.instructor.full_name ?? "I")[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Creado por</p>
                  <p className="font-medium">{course.instructor.full_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Descripción</h2>
            <p className="whitespace-pre-line text-muted-foreground">{course.description}</p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Temario del curso</h2>
            <CourseCurriculum sections={sections} isEnrolled={isEnrolled} />
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Reseñas de estudiantes</h2>
            {isEnrolled && (
              <ReviewForm courseId={course.id} slug={course.slug} existingReview={existingReview ?? undefined} />
            )}
            <ReviewList
              reviews={reviews.map((review) => ({
                ...review,
                student: (review as unknown as { student: { full_name: string | null; avatar_url: string | null } }).student,
              }))}
            />
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-xl border p-5 shadow-sm">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              {course.thumbnail_url && (
                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
              )}
            </div>
            <p className="text-3xl font-bold">{formatCurrency(course.price)}</p>
            <EnrollButton
              courseId={course.id}
              price={course.price}
              isEnrolled={isEnrolled}
              isAuthenticated={Boolean(user)}
              firstLessonHref={firstLessonId ? `/aprender/${course.id}/${firstLessonId}` : null}
            />
            <p className="text-center text-xs text-muted-foreground">
              Acceso de por vida · Certificado al completar el curso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
