import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/auth-helpers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    let error = null;
    try {
      const result = await Promise.race([
        supabase.auth.exchangeCodeForSession(code),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5_000),
        ),
      ]);
      error = result.error;
    } catch {
      // Supabase no disponible
    }

    if (!error) {
      const user = await safeGetUser(supabase);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarded")
          .eq("id", user.id)
          .single();

        if (!profile?.onboarded) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
        return NextResponse.redirect(
          `${origin}/${profile.role === "instructor" ? "instructor" : "estudiante"}`,
        );
      }
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
