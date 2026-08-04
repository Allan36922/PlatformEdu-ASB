import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFirstLessonId } from "@/lib/queries/courses";

export const metadata: Metadata = { title: "Compra exitosa" };

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/cursos");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let courseId: string | undefined;
  let courseTitle = "";
  let courseSlug = "";

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    courseId = session.metadata?.courseId;

    if (session.payment_status === "paid" && courseId) {
      // Respaldo por si el webhook de Stripe todavía no procesó el evento.
      const admin = createAdminClient();
      await admin.from("enrollments").upsert(
        {
          student_id: user.id,
          course_id: courseId,
          amount_paid: (session.amount_total ?? 0) / 100,
          stripe_checkout_session_id: session.id,
        },
        { onConflict: "student_id,course_id", ignoreDuplicates: true },
      );
    }
  } catch (err) {
    console.error("No se pudo verificar la sesión de Stripe", err);
  }

  if (courseId) {
    const { data: course } = await supabase
      .from("courses")
      .select("title, slug")
      .eq("id", courseId)
      .single();
    courseTitle = course?.title ?? "";
    courseSlug = course?.slug ?? "";
  }

  const firstLessonId = courseId ? await getFirstLessonId(courseId) : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto mb-4 size-14 text-emerald-500" />
      <h1 className="text-2xl font-bold">¡Compra exitosa!</h1>
      <p className="mt-2 text-muted-foreground">
        Ya tienes acceso {courseTitle ? <>a <strong>{courseTitle}</strong></> : "a tu nuevo curso"}.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        {courseId && firstLessonId ? (
          <Button
            size="lg"
            render={<Link href={`/aprender/${courseId}/${firstLessonId}`}>Empezar a aprender</Link>}
          />
        ) : (
          <Button size="lg" render={<Link href="/estudiante">Ir a mi panel</Link>} />
        )}
        {courseSlug && (
          <Button
            size="lg"
            variant="outline"
            render={<Link href={`/cursos/${courseSlug}`}>Ver curso</Link>}
          />
        )}
      </div>
    </div>
  );
}
