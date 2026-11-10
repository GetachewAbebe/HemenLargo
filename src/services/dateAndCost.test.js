import { describe, expect, it } from "vitest";
import { localDateKey } from "./formatters";
import { blendCostPerLiter, restockProductStock } from "./inventoryService";

describe("localDateKey", () => {
  it("uses the device's local calendar day, not UTC", () => {
    // 01:30 local time on 11 Sep 2026; in UTC+3 this is still 10 Sep in UTC.
    const lateNight = new Date(2026, 8, 11, 1, 30);
    expect(localDateKey(lateNight)).toBe("2026-09-11");
  });

  it("accepts ISO strings and rejects invalid dates", () => {
    expect(localDateKey(new Date(2026, 0, 5, 12).toISOString())).toBe("2026-01-05");
    expect(localDateKey("not a date")).toBe("");
  });
});

describe("weighted-average restock cost", () => {
  it("blends the cost of liters already in the tank with the new batch", () => {
    // 50 L @ 60 + 10 L @ 90 = 60 L @ 65
    expect(blendCostPerLiter(50, 60, 10, 90)).toBe(65);
  });

  it("uses the batch cost for an empty tank and keeps the old cost when none is given", () => {
    expect(blendCostPerLiter(0, 60, 20, 80)).toBe(80);
    expect(blendCostPerLiter(-3, 60, 20, 80)).toBe(80);
    expect(blendCostPerLiter(50, 60, 10, null)).toBe(60);
  });

  it("applies the blended cost when restocking a product", () => {
    const [product] = restockProductStock([{ id: "p1", stockLiters: 50, costPerLiter: 60 }], "p1", "10", "90");
    expect(product).toMatchObject({ stockLiters: 60, costPerLiter: 65 });
    const [unchanged] = restockProductStock([{ id: "p1", stockLiters: 50, costPerLiter: 60 }], "p1", "10", "");
    expect(unchanged.costPerLiter).toBe(60);
  });
});
