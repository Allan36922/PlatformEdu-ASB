import type { Metadata } from "next";
import { CheckCircle2, Star, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { getInstructorDashboardData } from "@/lib/queries/instructor-dashboard";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Panel de instructor" };

export default async function InstructorDashboardPage() {
  const data = await getInstructorDashboardData();
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Panel de instructor</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Ingresos totales" value={formatCurrency(data.totalRevenue)} />
        <StatCard icon={Users} label="Estudiantes" value={String(data.totalStudents)} />
        <StatCard icon={CheckCircle2} label="Tasa de finalización" value={`${data.completionRate}%`} />
        <StatCard icon={Star} label="Saldo disponible" value={formatCurrency(data.balanceAvailable)} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Ingresos por curso</h2>
        {data.courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tienes cursos.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {data.courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 text-sm">
                <span className="font-medium">{course.title}</span>
                <div className="flex items-center gap-6 text-muted-foreground">
                  <span>{course.student_count} estudiantes</span>
                  <span className="font-medium text-foreground">{formatCurrency(course.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Reseñas recientes</h2>
        {data.recentReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tienes reseñas.</p>
        ) : (
          <ul className="space-y-3">
            {data.recentReviews.map((review) => (
              <li key={review.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.student?.full_name}</span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="size-4 fill-amber-400" /> {review.rating}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{review.course?.title}</p>
                {review.comment && <p className="mt-2">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
