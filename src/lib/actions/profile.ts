"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/supabase/auth-helpers";
import { profileSchema } from "@/lib/validations/profile";

export interface ProfileActionState {
  error?: string;
  success?: boolean;
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    headline: formData.get("headline"),
    bio: formData.get("bio"),
    website_url: formData.get("website_url"),
    twitter_url: formData.get("twitter_url"),
    linkedin_url: formData.get("linkedin_url"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const supabase = await createClient();
  const user = await safeGetUser(supabase);
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      headline: parsed.data.headline || null,
      bio: parsed.data.bio || null,
      website_url: parsed.data.website_url || null,
      twitter_url: parsed.data.twitter_url || null,
      linkedin_url: parsed.data.linkedin_url || null,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/perfil");
  return { success: true };
}
