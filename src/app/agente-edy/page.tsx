import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type EdyVoiceWidgetProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  "livekit-url"?: string;
  room?: string;
  "token-endpoint"?: string;
  "student-id"?: string;
};

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "edy-voice-widget": EdyVoiceWidgetProps;
    }
  }
}

/**
 * Página para el asistente de voz Edy.
 * Requiere autenticación (protegida por middleware).
 * Se puede embeber vía iframe o navegar directamente.
 */
export default async function AgenteEdyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/agente-edy");
  }

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-heading text-lg font-bold tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap size-5 text-primary" aria-hidden="true">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" />
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
            EduPlatform
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Conectado como {user.email}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Script src="/edy-widget.js" strategy="afterInteractive" />
        <edy-voice-widget
          livekit-url={livekitUrl}
          room="edtech-widget"
          token-endpoint="/api/agent/token"
          student-id={user.id}
        />
      </main>
    </div>
  );
}