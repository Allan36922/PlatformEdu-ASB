"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderCertificatePdf } from "@/lib/certificates/generate";
import type { Certificate } from "@/types/database";

/**
 * Genera el PDF del certificado (si todavía no existe) y lo sube al bucket
 * privado `certificates`. Se ejecuta de forma perezosa la primera vez que el
 * estudiante intenta ver/descargar su certificado.
 */
export async function ensureCertificatePdf(courseId: string): Promise<Certificate | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: certificate } = await admin
    .from("certificates")
    .select("*")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!certificate) return null;
  if (certificate.pdf_url) return certificate as Certificate;

  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: course } = await admin
    .from("courses")
    .select("title, instructor_id")
    .eq("id", courseId)
    .single();
  const { data: instructor } = course
    ? await admin.from("profiles").select("full_name").eq("id", course.instructor_id).single()
    : { data: null };

  const pdfBuffer = await renderCertificatePdf({
    studentName: profile?.full_name || "Estudiante",
    courseTitle: course?.title || "Curso",
    instructorName: instructor?.full_name || "Instructor",
    issuedAt: new Date(certificate.issued_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    verificationCode: certificate.verification_code,
  });

  const path = `${user.id}/${certificate.id}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("certificates")
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    console.error("No se pudo subir el certificado", uploadError);
    return certificate as Certificate;
  }

  const { data: updated } = await admin
    .from("certificates")
    .update({ pdf_url: path })
    .eq("id", certificate.id)
    .select("*")
    .single();

  return (updated ?? certificate) as Certificate;
}
