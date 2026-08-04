import { createClient } from "@/lib/supabase/server";

export async function getStudentDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, course:courses(id, title, slug, thumbnail_url, category)")
    .eq("student_id", user.id)
    .order("purchased_at", { ascending: false });

  const { data: certificates } = await supabase
    .from("certificates")
    .select("*, course:courses(title)")
    .eq("student_id", user.id)
    .order("issued_at", { ascending: false });

  type EnrollmentWithCourse = {
    id: string;
    progress_percent: number;
    amount_paid: number;
    purchased_at: string;
    course: { id: string; title: string; slug: string; thumbnail_url: string | null; category: string } | null;
  };

  const rows = (enrollments ?? []) as unknown as EnrollmentWithCourse[];

  return {
    enrollments: rows,
    inProgress: rows.filter((e) => e.progress_percent < 100),
    completed: rows.filter((e) => e.progress_percent === 100),
    certificates: (certificates ?? []) as unknown as Array<{
      id: string;
      issued_at: string;
      verification_code: string;
      course: { title: string } | null;
    }>,
  };
}
