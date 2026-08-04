import { describe, expect, it } from "vitest";
import { courseLevelLabel, formatCurrency, formatDuration, getVideoEmbedUrl, slugify } from "./utils";

describe("formatCurrency", () => {
  it("shows 'Gratis' for zero amount", () => {
    expect(formatCurrency(0)).toBe("Gratis");
  });

  it("formats a positive amount as USD currency", () => {
    const result = formatCurrency(49.99);
    expect(result).not.toBe("Gratis");
    expect(result).toMatch(/49[.,]99/);
  });
});

describe("formatDuration", () => {
  it("formats minutes only when under an hour", () => {
    expect(formatDuration(45 * 60)).toBe("45min");
  });

  it("formats hours and minutes when over an hour", () => {
    expect(formatDuration(90 * 60)).toBe("1h 30min");
  });
});

describe("slugify", () => {
  it("lowercases, strips accents and replaces spaces with dashes", () => {
    expect(slugify("Programación Web Avanzada")).toBe("programacion-web-avanzada");
  });

  it("collapses repeated separators and trims leading/trailing dashes", () => {
    expect(slugify("  Curso   de -- Diseño!! ")).toBe("curso-de-diseno");
  });
});

describe("courseLevelLabel", () => {
  it("translates known levels to Spanish", () => {
    expect(courseLevelLabel("beginner")).toBe("Principiante");
    expect(courseLevelLabel("intermediate")).toBe("Intermedio");
    expect(courseLevelLabel("advanced")).toBe("Avanzado");
  });

  it("falls back to the raw value for unknown levels", () => {
    expect(courseLevelLabel("expert")).toBe("expert");
  });
});

describe("getVideoEmbedUrl", () => {
  it("converts a youtube watch URL into an embed URL", () => {
    const result = getVideoEmbedUrl("https://www.youtube.com/watch?v=abc123");
    expect(result).toEqual({ type: "youtube", src: "https://www.youtube.com/embed/abc123" });
  });

  it("converts a youtu.be short URL into an embed URL", () => {
    const result = getVideoEmbedUrl("https://youtu.be/abc123");
    expect(result).toEqual({ type: "youtube", src: "https://www.youtube.com/embed/abc123" });
  });

  it("converts a vimeo URL into an embed URL", () => {
    const result = getVideoEmbedUrl("https://vimeo.com/76979871");
    expect(result).toEqual({ type: "vimeo", src: "https://player.vimeo.com/video/76979871" });
  });

  it("passes through direct video URLs untouched", () => {
    const url = "https://cdn.example.com/videos/lesson.mp4";
    expect(getVideoEmbedUrl(url)).toEqual({ type: "direct", src: url });
  });
});
