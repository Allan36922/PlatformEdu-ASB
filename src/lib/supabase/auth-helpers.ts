import type { SupabaseClient } from "@supabase/supabase-js";

const AUTH_TIMEOUT_MS = 2_000;

/**
 * Wraps `supabase.auth.getUser()` with a timeout so that when Supabase is
 * unreachable (Docker off, network down, etc.) the caller gets `null` in
 * ~2 s instead of hanging for 25+ s and flooding the console with
 * `AuthRetryableFetchError`.
 */
export async function safeGetUser(
  supabase: SupabaseClient,
): Promise<{ id: string; email?: string } | null> {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("getUser timeout")), AUTH_TIMEOUT_MS),
      ),
    ]);
    const u = result.data.user;
    return u ? { id: u.id, email: u.email } : null;
  } catch {
    return null;
  }
}
