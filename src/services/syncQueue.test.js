import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  discardFailedCloudOperation,
  enqueueCloudOperation,
  flushCloudOperations,
  getFailedCloudOperations,
  getPendingCloudOperationCount,
  isTransientSyncError,
  requeueFailedCloudOperation,
} from "./syncQueue";

const transientError = (message = "offline") => Object.assign(new Error(message), { status: 503 });
const permanentError = (message = "Insufficient or missing stock for product p1") =>
  Object.assign(new Error(message), { status: 400 });

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
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalLocalStorage) Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    else delete globalThis.localStorage;
  });

  it("preserves order and pending operations when a temporary failure occurs", async () => {
    enqueueCloudOperation("shop-1", { type: "expense_upsert", payload: { id: "expense-1" } });
    enqueueCloudOperation("shop-1", { type: "expense_delete", payload: { expenseId: "expense-1" } });
    const execute = vi.fn().mockRejectedValue(transientError());

    await expect(flushCloudOperations("shop-1", execute)).rejects.toThrow("offline");
    expect(execute).toHaveBeenCalledOnce();
    expect(getPendingCloudOperationCount("shop-1")).toBe(2);
    expect(getFailedCloudOperations("shop-1")).toHaveLength(0);
  });

  it("removes a change only after it has synced successfully", async () => {
    enqueueCloudOperation("shop-1", { type: "expense_upsert", payload: { id: "expense-1" } });
    const execute = vi.fn().mockResolvedValue(undefined);

    await expect(flushCloudOperations("shop-1", execute)).resolves.toEqual({ synced: 1, failed: 0 });
    expect(execute).toHaveBeenCalledOnce();
    expect(getPendingCloudOperationCount("shop-1")).toBe(0);
  });

  it("moves a permanently rejected change aside so later changes still sync", async () => {
    enqueueCloudOperation("shop-1", { type: "sale", payload: { id: "REC-1" } });
    enqueueCloudOperation("shop-1", { type: "expense_upsert", payload: { id: "expense-1" } });
    const execute = vi.fn()
      .mockRejectedValueOnce(permanentError())
      .mockResolvedValueOnce(undefined);

    await expect(flushCloudOperations("shop-1", execute)).resolves.toEqual({ synced: 1, failed: 1 });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(getPendingCloudOperationCount("shop-1")).toBe(0);

    const failed = getFailedCloudOperations("shop-1");
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({
      type: "sale",
      payload: { id: "REC-1" },
      error: "Insufficient or missing stock for product p1",
    });
  });

  it("can retry or discard a failed change", async () => {
    enqueueCloudOperation("shop-1", { type: "sale", payload: { id: "REC-1" } });
    enqueueCloudOperation("shop-1", { type: "sale", payload: { id: "REC-2" } });
    await flushCloudOperations("shop-1", vi.fn().mockRejectedValue(permanentError()));
    const [first, second] = getFailedCloudOperations("shop-1");

    expect(requeueFailedCloudOperation("shop-1", first.id)).toBe(true);
    expect(getPendingCloudOperationCount("shop-1")).toBe(1);
    expect(getFailedCloudOperations("shop-1")).toHaveLength(1);

    const execute = vi.fn().mockResolvedValue(undefined);
    await flushCloudOperations("shop-1", execute);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ id: first.id, payload: { id: "REC-1" } }));

    discardFailedCloudOperation("shop-1", second.id);
    expect(getFailedCloudOperations("shop-1")).toHaveLength(0);
  });

  it("keeps shops isolated", async () => {
    enqueueCloudOperation("shop-1", { type: "sale", payload: { id: "REC-1" } });
    expect(getPendingCloudOperationCount("shop-2")).toBe(0);
  });
});

describe("isTransientSyncError", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("classifies network, timeout, rate-limit and server errors as temporary", () => {
    vi.stubGlobal("navigator", { onLine: true });
    expect(isTransientSyncError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isTransientSyncError({ status: 401 })).toBe(true);
    expect(isTransientSyncError({ status: 408 })).toBe(true);
    expect(isTransientSyncError({ status: 429 })).toBe(true);
    expect(isTransientSyncError({ status: 503 })).toBe(true);
  });

  it("classifies validation and permission errors as permanent", () => {
    vi.stubGlobal("navigator", { onLine: true });
    expect(isTransientSyncError({ status: 400, message: "Payment exceeds remaining balance" })).toBe(false);
    expect(isTransientSyncError({ status: 403 })).toBe(false);
    expect(isTransientSyncError(new Error("Only the shop owner can void sales"))).toBe(false);
  });

  it("treats every error as temporary while the browser is offline", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(isTransientSyncError({ status: 400 })).toBe(true);
  });
});

describe("Supabase error status mapping", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("marks network failures (status 0) as temporary and RPC rejections as permanent", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    const { withStatus } = await import("./supabaseService");
    expect(isTransientSyncError(withStatus({ message: "FetchError: Failed to fetch" }, 0))).toBe(true);
    expect(isTransientSyncError(withStatus({ message: "Only the shop owner can void sales" }, 400))).toBe(false);
  });
});
