import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/signup-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Crear cuenta | EduPlatform" };

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Empieza a enseñar o a aprender en minutos
        </p>
      </div>
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o con email</span>
        <Separator className="flex-1" />
      </div>
      <SignUpForm />
    </div>
  );
}
