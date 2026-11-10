import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadStoredData, saveToStorage, trimSalesForCache } from "./storage";

describe("shop-scoped local storage", () => {
  let values;
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    values = new Map();
    globalThis.localStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    };
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    } else {
      delete globalThis.localStorage;
    }
  });

  it("keeps cached records isolated between shops", () => {
    saveToStorage("SHOP_CONFIG", { shopName: "Shop One" }, "shop-one");
    saveToStorage("SALES", [], "shop-one");
    saveToStorage("SHOP_CONFIG", { shopName: "Shop Two" }, "shop-two");

    expect(loadStoredData("shop-one").config.shopName).toBe("Shop One");
    expect(loadStoredData("shop-two").config.shopName).toBe("Shop Two");
    expect(loadStoredData("shop-one").sales).toEqual([]);
  });
});

describe("sales cache window", () => {
  let values;
  let originalLocalStorage;
  const day = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    values = new Map();
  });

  afterEach(() => {
    if (originalLocalStorage) Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    else delete globalThis.localStorage;
  });

  it("keeps only recent sales on the device", () => {
    const now = Date.now();
    const sales = [
      { id: "new", date: new Date(now - day).toISOString() },
      { id: "old", date: new Date(now - 400 * day).toISOString() },
    ];
    expect(trimSalesForCache(sales, 180, now).map((s) => s.id)).toEqual(["new"]);
  });

  it("shrinks the window instead of failing when storage is full", () => {
    const limit = 200;
    globalThis.localStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        if (String(value).length > limit) throw Object.assign(new Error("full"), { name: "QuotaExceededError" });
        values.set(key, String(value));
      },
    };
    const now = Date.now();
    const sales = [5, 60, 120].map((daysAgo) => ({ id: `s${daysAgo}`, date: new Date(now - daysAgo * day).toISOString(), note: "x".repeat(40) }));

    expect(saveToStorage("SALES", sales, "shop-1")).toBe(true);
    const saved = JSON.parse(values.get("sukie_sales_v2:shop-1"));
    expect(saved.map((s) => s.id)).toContain("s5");
    expect(saved.length).toBeLessThan(3);
  });
});
