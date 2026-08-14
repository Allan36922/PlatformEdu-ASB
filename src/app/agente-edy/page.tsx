import Script from "next/script";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type EdyVoiceWidgetProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  "livekit-url"?: string;
  room?: string;
  "token-endpoint"?: string;
};

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required by React's JSX.IntrinsicElements augmentation pattern for custom elements
  namespace JSX {
    interface IntrinsicElements {
      "edy-voice-widget": EdyVoiceWidgetProps;
    }
  }
}

/**
 * Página standalone pensada para embeberse vía <iframe src="/agente-edy"
 * allow="microphone">, no vive bajo (main) para no cargar Navbar/Footer.
 */
export default function AgenteEdyPage() {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Script src="/edy-widget.js" strategy="afterInteractive" />
      <edy-voice-widget
        livekit-url={livekitUrl}
        room="edtech-widget"
        token-endpoint="/api/agent/token"
      />
    </div>
  );
}
