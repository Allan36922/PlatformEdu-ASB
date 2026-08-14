import { NextResponse } from "next/server";
import { checkAgentAuth } from "@/lib/agent-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { getFirstLessonId } from "@/lib/queries/courses";

/**
 * Inscripción disparada por el agente de voz Edy: sin cookie de sesión, el
 * estudiante llega como studentId explícito en el body. Cursos gratis se
 * inscriben directo (misma validación que enrollFreeCourseAction, sin
 * redirect); cursos pagos devuelven un link de checkout de Stripe.
 */
export async function POST(request: Request) {
  const authError = checkAgentAuth(request);
  if (authError) return authError;

  let body: { courseId?: string; studentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const { courseId, studentId } = body;
  if (!courseId || !studentId) {
    return NextResponse.json({ error: "Faltan courseId y/o studentId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("id, title, price, thumbnail_url, status, slug")
    .eq("id", courseId)
    .maybeSingle();

  if (!course || course.status !== "published") {
    return NextResponse.json({ error: "Este curso no está disponible" }, { status: 404 });
  }

  const { data: existingEnrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingEnrollment) {
    return NextResponse.json({ enrolled: true, courseUrl: `/cursos/${course.slug}` });
  }

  if (Number(course.price) <= 0) {
    const { error } = await admin.from("enrollments").upsert(
      { student_id: studentId, course_id: courseId, amount_paid: 0 },
      { onConflict: "student_id,course_id", ignoreDuplicates: true },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const lessonId = await getFirstLessonId(courseId);
    return NextResponse.json({
      enrolled: true,
      learnUrl: lessonId ? `/aprender/${courseId}/${lessonId}` : null,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
              images: course.thumbnail_url ? [course.thumbnail_url] : undefined,
            },
            unit_amount: Math.round(Number(course.price) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { courseId: course.id, studentId },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cursos/${course.slug}`,
    });
    if (!session.url) {
      return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
    }
    return NextResponse.json({ enrolled: false, checkoutUrl: session.url });
  } catch (err) {
    console.error("Stripe checkout session error", err);
    return NextResponse.json(
      { error: "No se pudo conectar con Stripe. Verifica la configuración de pagos." },
      { status: 500 },
    );
  }
}
