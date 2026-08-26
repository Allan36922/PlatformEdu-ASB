"use client";

/**
 * Edy Chat Widget - Interacción por texto con el agente Edy.
 * Envía mensajes a /api/agent/chat y muestra las respuestas.
 */

import { useCallback, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EdyChatWidgetProps {
  studentId?: string;
}

export function EdyChatWidget(_props: EdyChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await resp.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [input, isLoading, messages, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  return (
    <div className="flex flex-col h-full max-h-[600px] border rounded-xl bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
          >
            <path d="M12 8V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
            <path d="M16 16v-2a4 4 0 0 0-8 0v2" />
            <path d="M12 16v4" />
            <path d="M8 20h8" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">Edy</p>
          <p className="text-xs text-muted-foreground">Asistente EduPlatform</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-sm">
              ¡Hola! Soy Edy. Pregúntame sobre cursos, categorías o inscripciones.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                "¿Qué cursos de Python hay?",
                "Muéstrame cursos de diseño",
                "¿Cuáles son las categorías?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-xs bg-muted rounded-full hover:bg-muted/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted px-3 py-2 rounded-lg text-sm">
              <span className="animate-pulse">Escribiendo...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
            className="flex-1 resize-none bg-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
