import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Iniciar sesión | EduPlatform" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Bienvenido de nuevo</h1>
        <p className="text-sm text-muted-foreground">Inicia sesión para continuar aprendiendo</p>
      </div>
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o con email</span>
        <Separator className="flex-1" />
      </div>
      <LoginForm />
    </div>
  );
}
