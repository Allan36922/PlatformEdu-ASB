import { describe, expect, it } from "vitest";
import { courseBasicInfoSchema, lessonSchema, quizQuestionSchema, sectionSchema } from "./course";

describe("courseBasicInfoSchema", () => {
  const validCourse = {
    title: "Introducción a React",
    short_description: "Aprende los fundamentos de React desde cero",
    description: "Un curso completo que cubre componentes, hooks y mucho más contenido útil.",
    category: "Desarrollo Web",
    level: "beginner" as const,
    price: 29.99,
  };

  it("accepts a well-formed course payload", () => {
    expect(courseBasicInfoSchema.safeParse(validCourse).success).toBe(true);
  });

  it("rejects a title that is too short", () => {
    const result = courseBasicInfoSchema.safeParse({ ...validCourse, title: "Hi" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = courseBasicInfoSchema.safeParse({ ...validCourse, price: -10 });
    expect(result.success).toBe(false);
  });

  it("coerces a numeric string price", () => {
    const result = courseBasicInfoSchema.safeParse({ ...validCourse, price: "19.99" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(19.99);
  });
});

describe("sectionSchema", () => {
  it("rejects an empty title", () => {
    expect(sectionSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("accepts a valid title", () => {
    expect(sectionSchema.safeParse({ title: "Introducción" }).success).toBe(true);
  });
});

describe("lessonSchema", () => {
  it("requires content_url for video lessons", () => {
    const result = lessonSchema.safeParse({
      title: "Mi lección",
      type: "video",
      content_url: "",
      duration_seconds: 0,
      is_free_preview: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a video lesson with a content_url", () => {
    const result = lessonSchema.safeParse({
      title: "Mi lección",
      type: "video",
      content_url: "https://youtube.com/watch?v=abc",
      duration_seconds: 300,
      is_free_preview: false,
    });
    expect(result.success).toBe(true);
  });

  it("requires content_text for text lessons", () => {
    const result = lessonSchema.safeParse({
      title: "Lección de texto",
      type: "text",
      content_text: "",
      duration_seconds: 0,
      is_free_preview: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a text lesson with content", () => {
    const result = lessonSchema.safeParse({
      title: "Lección de texto",
      type: "text",
      content_text: "Contenido de la lección",
      duration_seconds: 0,
      is_free_preview: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("quizQuestionSchema", () => {
  it("requires at least two options", () => {
    const result = quizQuestionSchema.safeParse({
      question: "¿Cuál es la capital de Perú?",
      options: ["Lima"],
      correct_option: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid multiple choice question", () => {
    const result = quizQuestionSchema.safeParse({
      question: "¿Cuál es la capital de Perú?",
      options: ["Lima", "Cusco", "Arequipa"],
      correct_option: 0,
    });
    expect(result.success).toBe(true);
  });
});
