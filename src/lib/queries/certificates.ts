import { createAdminClient } from "@/lib/supabase/admin";

export interface CertificateVerification {
  id: string;
  issued_at: string;
  verification_code: string;
  student: { full_name: string | null } | null;
  course: { title: string; instructor: { full_name: string | null } | null } | null;
}

/**
 * Búsqueda pública por código de verificación (no protegida por RLS de sesión
 * porque cualquiera con el código impreso en un certificado debe poder
 * validarlo). Se usa el cliente admin exclusivamente para este lookup acotado.
 */
export async function getCertificateByCode(code: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("certificates")
    .select("id, issued_at, verification_code, student:profiles(full_name), course:courses(title, instructor:profiles(full_name))")
    .eq("verification_code", code)
    .maybeSingle();

  return data as unknown as CertificateVerification | null;
}
