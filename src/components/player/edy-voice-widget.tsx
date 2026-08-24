"use client";

/**
 * Edy Voice Widget - Componente de voz para interactuar con el agente Edy.
 * Usa LiveKit React SDK para conexión de voz en tiempo real.
 */

import { useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useIsSpeaking,
} from "@livekit/components-react";

function InnerEdyWidget() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  // Find agent participant (the non-local one)
  const agentParticipant = participants.find((p) => !p.isLocal);
  const isAgentSpeaking = useIsSpeaking(agentParticipant);

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [localParticipant]);

  const toggleMute = useCallback(() => {
    if (localParticipant) {
      const newMuted = !isMuted;
      localParticipant.setMicrophoneEnabled(!newMuted);
      setIsMuted(newMuted);
    }
  }, [localParticipant, isMuted]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Connection status */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {participants.length > 1
            ? "🟢 Edy está conectado"
            : "⏳ Conectando con Edy..."}
        </p>
      </div>

      {/* Voice visualization */}
      <div className="relative">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isAgentSpeaking
              ? "bg-primary/20 scale-110 shadow-lg shadow-primary/20"
              : "bg-muted"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-primary transition-transform duration-300 ${
              isAgentSpeaking ? "scale-110" : ""
            }`}
          >
            <path d="M12 8V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
            <path d="M16 16v-2a4 4 0 0 0-8 0v2" />
            <path d="M12 16v4" />
            <path d="M8 20h8" />
            <path d="M12 12v4" />
          </svg>
        </div>
        {isAgentSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={toggleMute}
          className={`px-6 py-3 rounded-full font-medium transition-all ${
            isMuted
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isMuted ? "🔇 Activar micrófono" : "🎤 Micrófono activo"}
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p>
          Habla con Edy para descubrir cursos, ver detalles o inscribirte.
        </p>
        <p className="mt-1 text-xs opacity-60">
          Ejemplo: &quot;¿Qué cursos de Python tienes?&quot;
        </p>
      </div>
    </div>
  );
}

export function EdyVoiceWidget({
  livekitUrl,
  roomName,
  tokenEndpoint,
  studentId,
}: {
  livekitUrl: string;
  roomName: string;
  tokenEndpoint: string;
  studentId: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchToken() {
      try {
        const resp = await fetch(
          `${tokenEndpoint}?studentId=${studentId}`,
        );

        if (!resp.ok) {
          throw new Error(`Token error: ${resp.status}`);
        }

        const data = await resp.json();
        if (!cancelled) {
          setToken(data.token);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error connecting to Edy",
          );
        }
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [tokenEndpoint, studentId]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-destructive font-medium">Error de conexión</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground"
          >
            <path d="M12 8V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
            <path d="M16 16v-2a4 4 0 0 0-8 0v2" />
            <path d="M12 16v4" />
            <path d="M8 20h8" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">
          Conectando con Edy...
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={true}
      video={false}
      data-lk-theme="default"
      style={{ minHeight: "400px" }}
    >
      <RoomAudioRenderer />
      <InnerEdyWidget />
    </LiveKitRoom>
  );
}
