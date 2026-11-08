import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueueCloudOperation,
  flushCloudOperations,
  getPendingCloudOperationCount,
} from "./syncQueue";

describe("offline cloud operation queue", () => {
  let originalLocalStorage;
  let values;

  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    values = new Map();
    globalThis.localStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    };
  });

  afterEach(() => {
    if (originalLocalStorage) Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    else delete globalThis.localStorage;
  });

  it("preserves order and pending operations when a sync fails", async () => {
    enqueueCloudOperation("shop-1", { type: "expense_upsert", payload: { id: "expense-1" } });
    enqueueCloudOperation("shop-1", { type: "expense_delete", payload: { expenseId: "expense-1" } });
    const execute = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(flushCloudOperations("shop-1", execute)).rejects.toThrow("offline");
    expect(getPendingCloudOperationCount("shop-1")).toBe(2);
  });

  it("removes a change only after it has synced successfully", async () => {
    enqueueCloudOperation("shop-1", { type: "expense_upsert", payload: { id: "expense-1" } });
    const execute = vi.fn().mockResolvedValue(undefined);

    await flushCloudOperations("shop-1", execute);
    expect(execute).toHaveBeenCalledOnce();
    expect(getPendingCloudOperationCount("shop-1")).toBe(0);
  });
});
