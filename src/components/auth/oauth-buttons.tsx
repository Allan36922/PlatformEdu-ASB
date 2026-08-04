"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const PROVIDERS = [
  { id: "google" as const, label: "Google" },
  { id: "github" as const, label: "GitHub" },
];

export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  async function handleOAuth(provider: "google" | "github") {
    setLoadingProvider(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setLoadingProvider(null);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth(provider.id)}
        >
          {loadingProvider === provider.id ? "Redirigiendo..." : provider.label}
        </Button>
      ))}
    </div>
  );
}
