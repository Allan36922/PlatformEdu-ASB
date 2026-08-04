import { createClient } from "@/lib/supabase/server";

export async function getInstructorDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, price, student_count, status")
    .eq("instructor_id", user.id);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance_available")
    .eq("id", user.id)
    .single();

  const totalRevenue = (transactions ?? []).reduce((sum, t) => sum + Number(t.instructor_earnings), 0);
  const totalStudents = (courses ?? []).reduce((sum, c) => sum + c.student_count, 0);

  const courseIds = (courses ?? []).map((c) => c.id);
  let completionRate = 0;
  if (courseIds.length > 0) {
    const { count: totalEnrollments } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .in("course_id", courseIds);
    const { count: completedEnrollments } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .in("course_id", courseIds)
      .not("completed_at", "is", null);
    completionRate = totalEnrollments ? Math.round(((completedEnrollments ?? 0) / totalEnrollments) * 100) : 0;
  }

  const { data: recentReviews } =
    courseIds.length > 0
      ? await supabase
          .from("reviews")
          .select("*, student:profiles(full_name, avatar_url), course:courses(title)")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] };

  const revenueByCourse = new Map<string, number>();
  for (const transaction of transactions ?? []) {
    if (transaction.course_id) {
      revenueByCourse.set(
        transaction.course_id,
        (revenueByCourse.get(transaction.course_id) ?? 0) + Number(transaction.instructor_earnings),
      );
    }
  }

  return {
    courses: (courses ?? []).map((course) => ({
      ...course,
      revenue: revenueByCourse.get(course.id) ?? 0,
    })),
    totalRevenue,
    totalStudents,
    completionRate,
    balanceAvailable: profile?.balance_available ?? 0,
    recentReviews: (recentReviews ?? []) as unknown as Array<{
      id: string;
      rating: number;
      comment: string | null;
      student: { full_name: string | null; avatar_url: string | null } | null;
      course: { title: string } | null;
    }>,
  };
}
