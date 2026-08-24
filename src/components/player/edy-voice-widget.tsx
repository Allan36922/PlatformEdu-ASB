"use client";

/**
 * Edy Voice Widget - Simple voice widget using livekit-client directly.
 * Avoids React SDK hook context issues by using the Room API directly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

interface EdyVoiceWidgetProps {
  livekitUrl: string;
  token: string | null;
  studentId: string;
}

export function EdyVoiceWidget({
  livekitUrl,
  token,
  studentId,
}: EdyVoiceWidgetProps) {
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to LiveKit room
  useEffect(() => {
    if (!token || !livekitUrl) {
      if (!token) setError("Token no disponible");
      return;
    }

    let room: Room;
    let cancelled = false;

    async function connect() {
      try {
        setConnectionState("connecting");

        room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        // Handle events
        room.on(RoomEvent.Connected, () => {
          if (!cancelled) setConnectionState("connected");
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) setConnectionState("disconnected");
        });

        room.on(RoomEvent.ParticipantConnected, (participant) => {
          // Agent connected
          participant.on("isSpeakingChanged", (speaking: boolean) => {
            if (!cancelled) setIsAgentSpeaking(speaking);
          });
        });

        room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
          if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
          }
        });

        // Connect to room
        await room.connect(livekitUrl, token!);

        // Enable microphone after connected
        await room.localParticipant.setMicrophoneEnabled(true);

        if (cancelled) {
          await room.disconnect();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error de conexión");
          setConnectionState("error");
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [token, livekitUrl]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const newMuted = !isMuted;
    room.localParticipant.setMicrophoneEnabled(!newMuted).catch(() => {});
    setIsMuted(newMuted);
  }, [isMuted]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setConnectionState("disconnected");
    }
  }, []);

  // Error state
  if (error || (!token && connectionState !== "connecting")) {
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
          {error || "Token no disponible"}
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

  // Loading state
  if (connectionState === "connecting" || !token) {
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
        <p className="text-sm text-muted-foreground">Conectando con Edy...</p>
      </div>
    );
  }

  // Connected state
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hidden audio element for agent voice */}
      <audio ref={audioRef} autoPlay />

      {/* Connection status */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {connectionState === "connected"
            ? "🟢 Edy está conectado"
            : "⏳ Conectando..."}
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
        <button
          onClick={disconnect}
          className="px-6 py-3 rounded-full font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
        >
          ❌ Salir
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
