import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/instructor", "/estudiante", "/aprender", "/onboarding", "/checkout"];

/**
 * Quick check: returns true if the Supabase URL looks reachable.
 * We cache the result for 30 s so we don't probe on every single request.
 */
let _lastProbe = 0;
let _reachable = true;

async function isSupabaseReachable(url: string): Promise<boolean> {
  const now = Date.now();
  if (now - _lastProbe < 30_000) return _reachable;
  _lastProbe = now;

  try {
    const res = await fetch(url + "/rest/v1/", {
      method: "HEAD",
      signal: AbortSignal.timeout(2_000),
    });
    _reachable = res.ok || res.status === 401; // 401 = reachable, just needs auth
    return _reachable;
  } catch {
    _reachable = false;
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // If Supabase is down, skip auth entirely — no hanging fetches
  if (supabaseUrl && !(await isSupabaseReachable(supabaseUrl))) {
    const path = request.nextUrl.pathname;
    const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user: { id: string } | null = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("getUser timeout")), 5_000),
      ),
    ]);
    user = result.data.user;
  } catch {
    // Supabase no disponible — tratar como no autenticado
  }

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
