"use client";

/**
 * Edy Tab Selector - Permite cambiar entre modo voz y chat.
 */

import { useState } from "react";

interface EdyTabSelectorProps {
  voiceWidget: React.ReactNode;
  chatWidget: React.ReactNode;
}

export function EdyTabSelector({ voiceWidget, chatWidget }: EdyTabSelectorProps) {
  const [activeTab, setActiveTab] = useState<"voice" | "chat">("chat");

  return (
    <div className="w-full max-w-2xl">
      {/* Tab buttons */}
      <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "chat"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          Chat
        </button>
        <button
          onClick={() => setActiveTab("voice")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "voice"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
            <path d="M16 16v-2a4 4 0 0 0-8 0v2" />
            <path d="M12 16v4" />
            <path d="M8 20h8" />
          </svg>
          Voz
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "chat" ? chatWidget : voiceWidget}
    </div>
  );
}
