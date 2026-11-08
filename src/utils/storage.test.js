import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadStoredData, saveToStorage } from "./storage";

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
