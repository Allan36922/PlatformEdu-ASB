"use client";

/**
 * LLM Status Indicator - Shows whether the NVIDIA NIM LLM is reachable.
 * Polls a health-check endpoint periodically to give visual feedback.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "checking" | "connected" | "error";

const POLL_INTERVAL_MS = 30_000; // check every 30s

export function LlmStatusIndicator() {
  const [status, setStatus] = useState<Status>("checking");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const checkHealth = useCallback(async () => {
    try {
      const start = performance.now();
      const res = await fetch("/api/agent/llm-health", { method: "GET" });
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setStatus(res.ok ? "connected" : "error");
    } catch {
      setStatus("error");
      setLatencyMs(null);
    } finally {
      setLastChecked(
        new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
  }, []);

  useEffect(() => {
    // Initial check via fetch (not calling checkHealth directly to avoid
    // the setState-in-effect lint rule — we replicate the logic here).
    (async () => {
      try {
        const start = performance.now();
        const res = await fetch("/api/agent/llm-health", { method: "GET" });
        const elapsed = Math.round(performance.now() - start);
        setLatencyMs(elapsed);
        setStatus(res.ok ? "connected" : "error");
      } catch {
        setStatus("error");
        setLatencyMs(null);
      } finally {
        setLastChecked(
          new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      }
    })();

    timerRef.current = setInterval(checkHealth, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkHealth]);

  const config = {
    checking: {
      dot: "bg-yellow-500 animate-pulse",
      label: "Verificando conexión…",
      ring: "",
    },
    connected: {
      dot: "bg-green-500",
      label: "LLM conectado",
      ring: "ring-green-500/30",
    },
    error: {
      dot: "bg-red-500",
      label: "LLM sin conexión",
      ring: "ring-red-500/30",
    },
  }[status];

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
      {/* Status dot */}
      <span className="relative flex h-3 w-3">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ring-4 ${config.dot} ${config.ring}`}
        />
        <span
          className={`relative inline-flex h-3 w-3 rounded-full ${config.dot}`}
        />
      </span>

      {/* Label + latency */}
      <div className="flex flex-col">
        <span className="font-medium leading-tight">{config.label}</span>
        <span className="text-xs text-muted-foreground">
          {latencyMs !== null && status === "connected"
            ? `${latencyMs}ms de latencia`
            : status === "error"
              ? "Verifica la API key de NVIDIA NIM"
              : "Esperando respuesta…"}
        </span>
      </div>

      {/* Last checked */}
      {lastChecked && (
        <span className="ml-auto text-xs text-muted-foreground">
          {lastChecked}
        </span>
      )}

      {/* Manual refresh */}
      <button
        onClick={checkHealth}
        className="ml-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Verificar conexión"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </svg>
      </button>
    </div>
  );
}
