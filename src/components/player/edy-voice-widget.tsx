"use client";

/**
 * Edy Voice Widget - Voice widget with microphone meter and agent indicators.
 * Uses livekit-client directly for audio, with Web Audio API for mic level.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

interface EdyVoiceWidgetProps {
  livekitUrl: string;
  token: string | null;
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
type AgentState = "idle" | "listening" | "thinking" | "speaking";

export function EdyVoiceWidget({
  livekitUrl,
  token,
}: EdyVoiceWidgetProps) {
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  // Ref to hold the latest updateMicLevel callback (avoids stale closure + hoisting issues)
  const updateMicLevelRef = useRef<(() => void) | null>(null);

  // Audio level visualization
  const updateMicLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS level (0-100)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const level = Math.min(100, Math.round(avg * 1.5));

    setMicLevel(level);
    animFrameRef.current = requestAnimationFrame(() => updateMicLevelRef.current?.());
  }, []);

  // Keep ref in sync with latest callback
  useEffect(() => {
    updateMicLevelRef.current = updateMicLevel;
  }, [updateMicLevel]);

  // Start mic level monitoring
  const startMicMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      animFrameRef.current = requestAnimationFrame(() => updateMicLevelRef.current?.());
    } catch (err) {
      console.warn("Could not access microphone for level monitoring:", err);
    }
  }, []);

  // Stop mic level monitoring
  const stopMicMonitoring = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setMicLevel(0);
  }, []);

  // Connect to LiveKit room
  useEffect(() => {
    if (!token || !livekitUrl) {
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

        // Handle connection events
        room.on(RoomEvent.Connected, () => {
          if (!cancelled) setConnectionState("connected");
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) {
            setConnectionState("disconnected");
            setAgentState("idle");
            stopMicMonitoring();
          }
        });

        // Handle participant (agent) events
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          participant.on("isSpeakingChanged", (speaking: boolean) => {
            if (!cancelled) {
              setAgentState(speaking ? "speaking" : "listening");
            }
          });

          // Track data channel for transcripts/status
          participant.on("dataReceived", (payload) => {
            try {
              const data = JSON.parse(new TextDecoder().decode(payload));
              if (data.type === "transcript") {
                setTranscript(data.text);
              } else if (data.type === "thinking") {
                setAgentState("thinking");
              }
            } catch {
              // Ignore non-JSON data
            }
          });
        });

        // Handle agent leaving
        room.on(RoomEvent.ParticipantDisconnected, () => {
          if (!cancelled) setAgentState("idle");
        });

        // Handle audio tracks from agent
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
          }
        });

        // Handle local microphone
        room.on(RoomEvent.TrackPublished, (_track, participant) => {
          if (participant.isLocal && _track.kind === Track.Kind.Audio) {
            // Local mic track published
          }
        });

        // Connect to room
        await room.connect(livekitUrl, token!);

        // Enable microphone after connected
        await room.localParticipant.setMicrophoneEnabled(true);

        // Start mic level monitoring
        startMicMonitoring();

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
      stopMicMonitoring();
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [token, livekitUrl, startMicMonitoring, stopMicMonitoring]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const newMuted = !isMuted;
    room.localParticipant.setMicrophoneEnabled(!newMuted).catch(() => {});
    setIsMuted(newMuted);

    if (newMuted) {
      stopMicMonitoring();
    } else {
      startMicMonitoring();
    }
  }, [isMuted, startMicMonitoring, stopMicMonitoring]);

  const disconnect = useCallback(() => {
    stopMicMonitoring();
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setConnectionState("disconnected");
      setAgentState("idle");
    }
  }, [stopMicMonitoring]);

  // Agent state helpers
  const getAgentStateLabel = (): string => {
    switch (agentState) {
      case "speaking":
        return "🗣️ Edy está hablando...";
      case "thinking":
        return "💭 Edy está pensando...";
      case "listening":
        return "👂 Edy está escuchando";
      default:
        return "🟢 Edy está listo";
    }
  };

  const getAgentStateColor = (): string => {
    switch (agentState) {
      case "speaking":
        return "text-primary";
      case "thinking":
        return "text-yellow-500";
      case "listening":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

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

      {/* Agent state indicator */}
      <div className="text-center">
        <p className={`text-sm font-medium ${getAgentStateColor()}`}>
          {getAgentStateLabel()}
        </p>
      </div>

      {/* Main voice visualization */}
      <div className="relative">
        {/* Agent avatar with speaking animation */}
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            agentState === "speaking"
              ? "bg-primary/20 scale-110 shadow-lg shadow-primary/20"
              : agentState === "thinking"
                ? "bg-yellow-500/10"
                : agentState === "listening"
                  ? "bg-green-500/10"
                  : "bg-muted"
          }`}
        >
          {/* Agent icon */}
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
              agentState === "speaking" ? "scale-110 animate-bounce" : ""
            }`}
          >
            <path d="M12 8V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
            <path d="M16 16v-2a4 4 0 0 0-8 0v2" />
            <path d="M12 16v4" />
            <path d="M8 20h8" />
            <path d="M12 12v4" />
          </svg>
        </div>

        {/* Speaking animation rings */}
        {agentState === "speaking" && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
          </>
        )}

        {/* Thinking animation */}
        {agentState === "thinking" && (
          <div className="absolute -top-2 -right-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Microphone level meter */}
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isMuted ? "text-destructive" : "text-muted-foreground"}
          >
            <path d="M12 8V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
            <path d="M16 16v-2a4 4 0 0 0-8 0v2" />
            <path d="M12 16v4" />
            <path d="M8 20h8" />
          </svg>
          <span className="text-xs text-muted-foreground">
            {isMuted ? "Micrófono muteado" : "Nivel del micrófono"}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              micLevel > 70
                ? "bg-destructive"
                : micLevel > 40
                  ? "bg-yellow-500"
                  : "bg-primary"
            }`}
            style={{ width: `${isMuted ? 0 : micLevel}%` }}
          />
        </div>
        {/* Audio level bars */}
        <div className="flex justify-center gap-0.5 mt-2 h-4">
          {Array.from({ length: 12 }).map((_, i) => {
            const threshold = (i + 1) * 8;
            const active = !isMuted && micLevel >= threshold;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  active
                    ? i >= 9
                      ? "bg-destructive"
                      : i >= 6
                        ? "bg-yellow-500"
                        : "bg-primary"
                    : "bg-muted"
                }`}
                style={{
                  height: `${Math.max(4, (i + 1) * 2)}px`,
                }}
              />
            );
          })}
        </div>
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

      {/* Transcript display */}
      {transcript && (
        <div className="w-full max-w-md p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-1">Último mensaje:</p>
          <p className="text-sm italic">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

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
