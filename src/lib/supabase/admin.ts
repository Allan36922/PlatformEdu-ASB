import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: bypassa RLS. Uso exclusivo en código de
 * servidor de confianza (webhooks de Stripe, jobs internos) — nunca en
 * código expuesto al cliente ni en Server Actions invocadas directamente
 * desde un formulario sin validar el actor primero.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
