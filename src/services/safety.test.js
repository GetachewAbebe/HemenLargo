import { describe, it, expect } from "vitest";
import { normalizeProductFromSupabase } from "./supabaseService";
import { calculateInventoryMetrics } from "./inventoryService";

describe("Application Crash Protection & Data Normalization", () => {
  it("safely normalizes product with null name without throwing", () => {
    const raw = {
      id: "prod-test",
      name: null,
      local_name: null,
      price_per_liter: null,
      cost_per_liter: null,
      stock_liters: null,
    };

    const normalized = normalizeProductFromSupabase(raw);
    expect(normalized).not.toBeNull();
    expect(normalized.name).toBe("Liquid Soap");
    expect(typeof normalized.name).toBe("string");
    expect(normalized.pricePerLiter).toBeGreaterThan(0);
    expect(normalized.costPerLiter).toBeGreaterThan(0);
    expect(normalized.stockLiters).toBe(0);
  });

  it("safely calculates inventory metrics with null or partial objects", () => {
    const corruptProducts = [
      { id: "1", name: null, stockLiters: null, costPerLiter: null, pricePerLiter: null },
      { id: "2", name: "Safe Soap", stockLiters: 50, costPerLiter: 30, pricePerLiter: 50 },
    ];

    const metrics = calculateInventoryMetrics(corruptProducts);
    expect(metrics.totalLitersInStock).toBe(50);
    expect(metrics.totalStockCostValue).toBe(1500);
    expect(metrics.totalPotentialRetail).toBe(2500);
  });
});
