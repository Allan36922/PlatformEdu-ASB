"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseReachable } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeGetUser } from "@/lib/supabase/auth-helpers";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";
import { onboardingSchema } from "@/lib/validations/profile";

const AUTH_TIMEOUT_MS = 5_000;

/** Wrapper that races an auth call against a timeout to avoid long hangs. */
async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Servicio de autenticación no disponible")), AUTH_TIMEOUT_MS),
    ),
  ]);
}

export interface AuthActionState {
  error?: string;
  info?: string;
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (!(await isSupabaseReachable())) {
    return { error: "El servicio de autenticación no está disponible en este momento. Intenta más tarde." };
  }

  const supabase = await createClient();
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { data: { full_name: parsed.data.fullName } },
      }),
    );

    if (error) return { error: error.message };

    if (!data.session) {
      return { info: "Revisa tu correo para confirmar tu cuenta antes de continuar." };
    }

    redirect("/onboarding");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear la cuenta" };
  }
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (!(await isSupabaseReachable())) {
    return { error: "El servicio de autenticación no está disponible en este momento. Intenta más tarde." };
  }

  const supabase = await createClient();
  try {
    const { error } = await withTimeout(supabase.auth.signInWithPassword(parsed.data));
    if (error) return { error: "Email o contraseña incorrectos" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al iniciar sesión" };
  }

  const user = await safeGetUser(supabase);

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded")
      .eq("id", user.id)
      .maybeSingle();

    // If profile doesn't exist yet (trigger race condition), go to onboarding
    if (!profile || !profile.onboarded) redirect("/onboarding");
    redirect(profile.role === "instructor" ? "/instructor" : "/estudiante");
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore signOut errors — proceed with redirect
  }
  redirect("/");
}

export async function completeOnboardingAction(formData: FormData) {
  const parsed = onboardingSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) return { error: "Selecciona un rol válido" };

  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) redirect("/login");

  // Use admin client to ensure the profile exists and can be updated
  // (bypasses RLS — this is a trusted server-only action that only
  // updates the caller's own profile, gated by the auth check above)
  const admin = createAdminClient();

  // Ensure profile row exists (the trigger may have failed)
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("profiles").insert({
      id: user.id,
      role: parsed.data.role,
      onboarded: true,
    });
  } else {
    const { error } = await admin
      .from("profiles")
      .update({ role: parsed.data.role, onboarded: true })
      .eq("id", user.id);
    if (error) return { error: error.message };
  }

  redirect(parsed.data.role === "instructor" ? "/instructor" : "/estudiante");
}
