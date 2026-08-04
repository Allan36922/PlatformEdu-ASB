import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
