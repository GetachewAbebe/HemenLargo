// Offline outbox for cloud writes.
//
// - "pending" operations are replayed in order. A temporary failure (offline,
//   timeout, 5xx) stops the flush so order is preserved for the next attempt.
// - A permanent failure (validation, permission, insufficient stock) is moved to
//   the "failed" list so it cannot block every later change. Failed operations
//   keep their full payload so the owner can retry, discard, or export them.

const PENDING_PREFIX = "sukie_sync_outbox_v1";
const FAILED_PREFIX = "sukie_sync_failed_v1";

const pendingKey = (shopId) => `${PENDING_PREFIX}:${shopId}`;
const failedKey = (shopId) => `${FAILED_PREFIX}:${shopId}`;

const readList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Could not read the cloud sync queue:", error);
    throw new Error("The pending cloud sync queue is unreadable. Export a backup before clearing browser data.");
  }
};

const writeList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.error("Could not persist the cloud sync queue:", error);
    throw new Error("Unable to save pending cloud changes in this browser. Export a backup before continuing offline.");
  }
};

const createOperationId = () =>
  globalThis.crypto?.randomUUID?.() || `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const describeError = (error) => error?.message || String(error || "Unknown error");

export const isTransientSyncError = (error) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (error instanceof TypeError) return true;
  const status = Number(error?.status || error?.statusCode);
  // 401: the session expired; the change should go through once the user signs in again.
  return status === 401 || status === 408 || status === 425 || status === 429 || status >= 500;
};

export const enqueueCloudOperation = (shopId, operation) => {
  if (!shopId) throw new Error("Cannot queue a cloud change without an active shop.");
  const queue = readList(pendingKey(shopId));
  queue.push({
    id: createOperationId(),
    createdAt: new Date().toISOString(),
    ...operation,
  });
  writeList(pendingKey(shopId), queue);
  return queue.length;
};

export const recordFailedCloudOperation = (shopId, operation, error) => {
  if (!shopId) throw new Error("Cannot record a failed cloud change without an active shop.");
  const failed = readList(failedKey(shopId));
  failed.push({
    id: operation.id || createOperationId(),
    createdAt: operation.createdAt || new Date().toISOString(),
    type: operation.type,
    payload: operation.payload,
    failedAt: new Date().toISOString(),
    error: describeError(error),
  });
  writeList(failedKey(shopId), failed);
  return failed.length;
};

export const getPendingCloudOperationCount = (shopId) => (shopId ? readList(pendingKey(shopId)).length : 0);

export const getFailedCloudOperations = (shopId) => (shopId ? readList(failedKey(shopId)) : []);

export const discardFailedCloudOperation = (shopId, operationId) => {
  const remaining = readList(failedKey(shopId)).filter((op) => op.id !== operationId);
  writeList(failedKey(shopId), remaining);
  return remaining;
};

// Moves a failed operation back to the end of the pending queue.
export const requeueFailedCloudOperation = (shopId, operationId) => {
  const failed = readList(failedKey(shopId));
  const operation = failed.find((op) => op.id === operationId);
  if (!operation) return false;
  const queue = readList(pendingKey(shopId));
  queue.push({ id: operation.id, createdAt: operation.createdAt, type: operation.type, payload: operation.payload });
  writeList(pendingKey(shopId), queue);
  writeList(failedKey(shopId), failed.filter((op) => op.id !== operationId));
  return true;
};

/**
 * Replays pending operations in order.
 * Throws on the first temporary error (queue left intact from that point).
 * Permanent errors are moved to the failed list and the flush continues.
 * Resolves to { synced, failed } counts for this run.
 */
export const flushCloudOperations = async (shopId, executeOperation) => {
  const result = { synced: 0, failed: 0 };
  if (!shopId) return result;
  while (true) {
    const queue = readList(pendingKey(shopId));
    if (!queue.length) return result;
    const operation = queue[0];
    try {
      await executeOperation(operation);
      result.synced += 1;
    } catch (error) {
      if (isTransientSyncError(error)) throw error;
      recordFailedCloudOperation(shopId, operation, error);
      result.failed += 1;
    }
    const currentQueue = readList(pendingKey(shopId));
    writeList(pendingKey(shopId), currentQueue.filter((pending) => pending.id !== operation.id));
  }
};
