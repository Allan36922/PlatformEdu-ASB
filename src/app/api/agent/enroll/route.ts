import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentRequest } from "@/lib/utils/agentAuth";

export async function POST(request: NextRequest) {
  const authError = validateAgentRequest(request);
  if (authError) return authError;

  let body: { courseId: string; studentId: string; confirmed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { courseId, studentId, confirmed } = body;

  if (!courseId || !studentId) {
    return NextResponse.json(
      { error: "courseId y studentId son requeridos" },
      { status: 400 }
    );
  }

  if (!confirmed) {
    return NextResponse.json(
      { error: "Se requiere confirmación explícita (confirmed: true)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Obtener el curso con su precio
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, price, status")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json({ error: courseError.message }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  if (course.status !== "published") {
    return NextResponse.json({ error: "El curso no está disponible" }, { status: 400 });
  }

  const price = course.price ?? 0;
  const isFree = price === 0;

  // Verificar si ya está inscrito
  const { data: existingEnrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existingEnrollment) {
    return NextResponse.json({
      alreadyEnrolled: true,
      message: "Ya estás inscrito en este curso",
    });
  }

  if (isFree) {
    // Curso gratis: inscribir directamente con service role
    const { error: enrollError } = await admin
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: courseId,
        amount_paid: 0,
        stripe_checkout_session_id: `free-${Date.now()}`,
      });

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      message: `Te has inscrito gratis en "${course.title}"`,
    });
  }

  // Curso de pago: SIMULAR checkout (sin cobro real)
  // Cuando se integre Stripe real, aquí se crearía la sesión de Stripe Checkout
  // y se devolvería la URL real. Por ahora devolvemos un link simulado.
  const simulatedCheckoutUrl = `https://checkout.simulado.local/curso/${courseId}?student=${studentId}`;

  return NextResponse.json({
    success: true,
    enrolled: false,
    requiresPayment: true,
    checkoutUrl: simulatedCheckoutUrl,
    message: `Este curso cuesta $${price.toFixed(2)}. Como los pagos aún no están integrados en la plataforma, este es un enlace SIMULADO para practicar el flujo: ${simulatedCheckoutUrl}. Cuando se integre un proveedor real (Stripe), este enlace será reemplazado por una sesión de checkout real.`,
    courseTitle: course.title,
    price,
  });
}