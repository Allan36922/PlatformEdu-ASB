import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCertificatePdf } from "@/lib/actions/certificates";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: certificate } = await supabase.from("certificates").select("*").eq("id", id).single();
  if (!certificate || certificate.student_id !== user.id) {
    return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });
  }

  let path = certificate.pdf_url;
  if (!path) {
    const updated = await ensureCertificatePdf(certificate.course_id);
    path = updated?.pdf_url ?? null;
  }
  if (!path) {
    return NextResponse.json({ error: "No se pudo generar el certificado" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage.from("certificates").createSignedUrl(path, 120);
  if (error || !signed) {
    return NextResponse.json({ error: "No se pudo generar el enlace de descarga" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
