import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PROTECTED_PREFIXES = ["/instructor", "/estudiante", "/aprender", "/onboarding", "/checkout"];

/**
 * Quick probe with a 2 s timeout, cached for 30 s.
 * Returns false when Supabase is unreachable (Docker off, network down, etc.).
 */
let _lastProbe = 0;
let _reachable = true;

export async function isSupabaseReachable(): Promise<boolean> {
  const now = Date.now();
  if (now - _lastProbe < 30_000) return _reachable;
  _lastProbe = now;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;

  try {
    const res = await fetch(url + "/rest/v1/", {
      method: "HEAD",
      signal: AbortSignal.timeout(2_000),
    });
    _reachable = res.ok || res.status === 401;
    return _reachable;
  } catch {
    _reachable = false;
    return false;
  }
}

/** Cliente Supabase para Server Components, Server Actions y Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llamó desde un Server Component: la sesión se refresca en middleware.ts.
          }
        },
      },
    },
  );
}
