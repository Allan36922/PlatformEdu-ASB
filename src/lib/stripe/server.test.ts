import { describe, expect, it } from "vitest";
import { calculateCommission } from "./server";

describe("calculateCommission", () => {
  it("splits a payment using the configured platform fee percentage", () => {
    const { platformFee, instructorEarnings } = calculateCommission(100);
    expect(platformFee).toBe(20);
    expect(instructorEarnings).toBe(80);
  });

  it("rounds to two decimal places", () => {
    const { platformFee, instructorEarnings } = calculateCommission(19.99);
    expect(platformFee + instructorEarnings).toBeCloseTo(19.99, 2);
  });

  it("returns zero fees for a free (zero amount) transaction", () => {
    const { platformFee, instructorEarnings } = calculateCommission(0);
    expect(platformFee).toBe(0);
    expect(instructorEarnings).toBe(0);
  });
});
