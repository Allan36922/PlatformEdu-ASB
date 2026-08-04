import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata: Metadata = { title: "Elige tu rol | EduPlatform" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded, role")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) {
    redirect(profile.role === "instructor" ? "/instructor" : "/estudiante");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">¿Cómo quieres usar EduPlatform?</h1>
          <p className="text-sm text-muted-foreground">
            Puedes cambiar esto más adelante desde tu perfil
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
