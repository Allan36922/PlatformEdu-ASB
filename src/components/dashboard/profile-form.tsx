"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction, type ProfileActionState } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

const initialState: ProfileActionState = {};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="headline">Especialidad / titular</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={profile.headline ?? ""}
          placeholder="Ej. Desarrollador Full Stack"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Biografía</Label>
        <Textarea id="bio" name="bio" rows={4} defaultValue={profile.bio ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="website_url">Sitio web</Label>
          <Input id="website_url" name="website_url" type="url" defaultValue={profile.website_url ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter_url">Twitter / X</Label>
          <Input id="twitter_url" name="twitter_url" type="url" defaultValue={profile.twitter_url ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn</Label>
          <Input id="linkedin_url" name="linkedin_url" type="url" defaultValue={profile.linkedin_url ?? ""} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Perfil actualizado</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
