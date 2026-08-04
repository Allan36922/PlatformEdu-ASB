import { describe, expect, it } from "vitest";
import { reviewSchema } from "./review";

describe("reviewSchema", () => {
  it("accepts a rating between 1 and 5 with an optional comment", () => {
    expect(reviewSchema.safeParse({ rating: 5, comment: "Excelente curso" }).success).toBe(true);
    expect(reviewSchema.safeParse({ rating: 1, comment: "" }).success).toBe(true);
  });

  it("rejects a rating of 0", () => {
    expect(reviewSchema.safeParse({ rating: 0 }).success).toBe(false);
  });

  it("rejects a rating above 5", () => {
    expect(reviewSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it("coerces a numeric string rating from form data", () => {
    const result = reviewSchema.safeParse({ rating: "4" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rating).toBe(4);
  });
});
