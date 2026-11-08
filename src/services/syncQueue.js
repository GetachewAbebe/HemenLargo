const STORAGE_PREFIX = "sukie_sync_outbox_v1";

const storageKey = (shopId) => `${STORAGE_PREFIX}:${shopId}`;

const readQueue = (shopId) => {
  try {
    const raw = localStorage.getItem(storageKey(shopId));
    if (!raw) return [];
    const queue = JSON.parse(raw);
    return Array.isArray(queue) ? queue : [];
  } catch (error) {
    console.error("Could not read the cloud sync queue:", error);
    throw new Error("The pending cloud sync queue is unreadable. Export a backup before clearing browser data.");
  }
};

const writeQueue = (shopId, queue) => {
  try {
    localStorage.setItem(storageKey(shopId), JSON.stringify(queue));
  } catch (error) {
    console.error("Could not persist the cloud sync queue:", error);
    throw new Error("Unable to save pending cloud changes in this browser. Export a backup before continuing offline.");
  }
};

export const enqueueCloudOperation = (shopId, operation) => {
  if (!shopId) throw new Error("Cannot queue a cloud change without an active shop.");
  const queue = readQueue(shopId);
  queue.push({
    id: globalThis.crypto?.randomUUID?.() || `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...operation,
  });
  writeQueue(shopId, queue);
  return queue.length;
};

export const getPendingCloudOperationCount = (shopId) => (shopId ? readQueue(shopId).length : 0);

export const flushCloudOperations = async (shopId, executeOperation) => {
  if (!shopId) return 0;
  while (true) {
    const queue = readQueue(shopId);
    if (!queue.length) return 0;
    const operation = queue[0];
    await executeOperation(operation);
    const currentQueue = readQueue(shopId);
    writeQueue(shopId, currentQueue.filter((pending) => pending.id !== operation.id));
  }
};

export const isTransientSyncError = (error) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  const status = Number(error?.status || error?.statusCode);
  return status === 408 || status === 425 || status === 429 || status >= 500;
};
