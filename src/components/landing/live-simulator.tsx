"use client";

import { useState, useEffect } from "react";
import { Play, Pause, CheckCircle, Lock, BookOpen, Layers, Award } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  type: "video" | "text";
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

const MOCK_CURRICULUM: Section[] = [
  {
    id: "sec-1",
    title: "1. Introducción al Ecosistema",
    lessons: [
      { id: "les-1", title: "Bienvenida y estructura del curso", duration: "03:45", isCompleted: true, isLocked: false, type: "video" },
      { id: "les-2", title: "Configuración de Next.js & Supabase", duration: "12:20", isCompleted: false, isLocked: false, type: "video" },
    ],
  },
  {
    id: "sec-2",
    title: "2. Base de Datos y Autenticación",
    lessons: [
      { id: "les-3", title: "Modelado de datos en PostgreSQL", duration: "18:15", isCompleted: false, isLocked: true, type: "video" },
      { id: "les-4", title: "Políticas RLS en Supabase", duration: "08:40", isCompleted: false, isLocked: true, type: "text" },
    ],
  },
];

export function LiveSimulator() {
  const [activeLesson, setActiveLesson] = useState<Lesson>(MOCK_CURRICULUM[0].lessons[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35); // simulated overall progress percentage
  const [videoProgress, setVideoProgress] = useState(0); // active video progress
  const [activeTab, setActiveTab] = useState<"video" | "resources" | "quiz">("video");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Handle simulated video playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            // Simulate completion
            setProgress(65);
            return 100;
          }
          return prev + 1.5;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const selectLesson = (lesson: Lesson) => {
    if (lesson.isLocked) return;
    setActiveLesson(lesson);
    setVideoProgress(0);
    setIsPlaying(false);
    setActiveTab("video");
  };

  const handleQuizSubmit = (index: number) => {
    setSelectedOption(index);
    if (index === 1) {
      setQuizScore(100);
    } else {
      setQuizScore(0);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden text-foreground">
      {/* Simulator Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-green-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-foreground/40 ml-2">PRO_PLAYER_SIMULATOR_V1.0</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-primary">
            <Award className="w-4 h-4" />
            <span>Progreso del Curso: {Math.round(progress)}%</span>
          </div>
          <div className="w-24 bg-border rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-amber-500 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Main Content Area */}
        <div className="md:col-span-2 flex flex-col">
          {/* Mock Screen / Video Player */}
          <div className="relative aspect-video bg-background overflow-hidden group">
            {activeTab === "video" ? (
              <>
                {/* Gradient Background Aura */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-amber-500/15 mix-blend-screen pointer-events-none" />

                {/* Playing Screen Mockup */}
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  {/* Status Overlay */}
                  <div className="self-end px-3 py-1 rounded bg-black/60 backdrop-blur border border-white/5 text-[10px] font-mono tracking-wider text-primary">
                    {isPlaying ? "REPRODUCIENDO CONTENIDO HD" : "PAUSADO"}
                  </div>

                  {/* Centered Controls */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                    </button>
                  </div>

                  {/* Bottom Controls / Progress Bar */}
                  <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 rounded-lg p-3 space-y-2 mt-auto">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>{activeLesson.title}</span>
                      <span>{Math.round(videoProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${videoProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === "resources" ? (
              <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center space-y-4">
                <BookOpen className="w-12 h-12 text-primary" />
                <h3 className="text-lg font-heading font-medium">Recursos de la Lección</h3>
                <p className="text-sm text-foreground/60 max-w-sm">
                  Descarga los recursos exclusivos de esta lección para agilizar tu aprendizaje.
                </p>
                <div className="flex gap-3">
                  <a href="#descarga" className="px-4 py-2 rounded-lg bg-card border border-border text-xs hover:bg-border transition-colors">
                    proyecto-codigo.zip
                  </a>
                  <a href="#descarga" className="px-4 py-2 rounded-lg bg-card border border-border text-xs hover:bg-border transition-colors">
                    arquitectura-esquema.pdf
                  </a>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col justify-center p-8 space-y-4">
                <h3 className="text-md font-heading font-semibold text-primary">Quiz de Control:</h3>
                <p className="text-sm">¿Qué capa de Supabase asegura la privacidad de los datos por usuario?</p>
                <div className="space-y-2">
                  {[
                    "Database Webhooks",
                    "Row Level Security (RLS)",
                    "Edge Functions",
                  ].map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuizSubmit(idx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                        selectedOption === idx
                          ? idx === 1
                            ? "bg-green-500/10 border-green-500/40 text-green-400"
                            : "bg-red-500/10 border-red-500/40 text-red-400"
                          : "bg-card/60 border-border hover:bg-card"
                      }`}
                    >
                      <span className="font-mono mr-2">{String.fromCharCode(65 + idx)})</span> {option}
                    </button>
                  ))}
                </div>
                {quizScore !== null && (
                  <p className={`text-xs font-mono ${quizScore === 100 ? "text-green-400" : "text-red-400"}`}>
                    {quizScore === 100 ? "✓ ¡Correcto! RLS restringe el acceso a nivel de fila." : "✗ Inténtalo de nuevo."}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tabs for Navigation */}
          <div className="flex border-t border-border bg-card/20 text-xs">
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 py-3 px-4 text-center font-medium border-b-2 hover:bg-card/30 transition-all ${
                activeTab === "video" ? "border-primary text-primary" : "border-transparent text-foreground/60"
              }`}
            >
              Video Clase
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`flex-1 py-3 px-4 text-center font-medium border-b-2 hover:bg-card/30 transition-all ${
                activeTab === "resources" ? "border-primary text-primary" : "border-transparent text-foreground/60"
              }`}
            >
              Materiales (.ZIP)
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex-1 py-3 px-4 text-center font-medium border-b-2 hover:bg-card/30 transition-all ${
                activeTab === "quiz" ? "border-primary text-primary" : "border-transparent text-foreground/60"
              }`}
            >
              Evaluación rápida
            </button>
          </div>
        </div>

        {/* Sidebar Curriculum */}
        <div className="bg-card/20 p-5 flex flex-col h-[320px] md:h-auto overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-foreground/60">Contenido del Curso</h3>
          </div>
          <div className="space-y-4 flex-1">
            {MOCK_CURRICULUM.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-foreground/80 tracking-wide font-heading">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {section.lessons.map((lesson) => {
                    const isActive = activeLesson.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson)}
                        disabled={lesson.isLocked}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-primary/10 to-amber-500/5 border border-primary/30 text-primary"
                            : lesson.isLocked
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-card/40 border border-transparent text-foreground/75"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {lesson.isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          ) : lesson.isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-50 shrink-0 ml-2">{lesson.duration}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
