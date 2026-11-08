import { describe, expect, it } from "vitest";
import { getProductSalePrice } from "./productPricing";

describe("getProductSalePrice", () => {
  const largo = { pricePerLiter: 100, pricePerHalfLiter: 60 };

  it("uses configured prices for half-liter and one-liter sales", () => {
    expect(getProductSalePrice(largo, 0.5)).toBe(60);
    expect(getProductSalePrice(largo, 1)).toBe(100);
  });

  it("adds configured half-liter and full-liter prices for half-liter increments", () => {
    expect(getProductSalePrice(largo, 1.5)).toBe(160);
    expect(getProductSalePrice(largo, 2.5)).toBe(260);
  });

  it("uses the per-liter rate for other custom quantities", () => {
    expect(getProductSalePrice(largo, 0.75)).toBe(75);
    expect(getProductSalePrice(largo, 2.25)).toBe(225);
  });

  it("preserves half-price behavior for products without a configured half-liter price", () => {
    expect(getProductSalePrice({ pricePerLiter: 80 }, 0.5)).toBe(40);
  });
});
