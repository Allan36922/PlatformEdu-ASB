import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("accepts a valid sign-up payload", () => {
    const result = signUpSchema.safeParse({
      fullName: "Ana García",
      email: "ana@example.com",
      password: "supersecret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      fullName: "Ana García",
      email: "not-an-email",
      password: "supersecret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      fullName: "Ana García",
      email: "ana@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({ email: "ana@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid credentials", () => {
    const result = signInSchema.safeParse({ email: "ana@example.com", password: "whatever" });
    expect(result.success).toBe(true);
  });
});
