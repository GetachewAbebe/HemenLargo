import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AppContext } from "./appContextInstance";
import {
  loadStoredData,
  saveToStorage,
  resetToDefaults,
  sanitizeImportPayload,
  rememberActiveShop,
} from "../utils/storage";
import {
  INITIAL_SHOP_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_DEBTS,
} from "../data/initialData";
import {
  deductStockForSale,
  restoreStockForVoidedSale,
  applyDebtRepayment,
} from "../services/saleService";
import { restockProductStock } from "../services/inventoryService";
import {
  fetchSupabaseProducts,
  fetchSupabaseSales,
  fetchSupabaseExpenses,
  fetchSupabaseDebts,
  fetchSupabaseConfig,
  fetchShopRole,
  addInitialProductsInSupabase,
  runCloudOperation,
  subscribeToRealtimeChanges,
} from "../services/supabaseService";
import {
  enqueueCloudOperation,
  flushCloudOperations,
  getPendingCloudOperationCount,
  getFailedCloudOperations,
  discardFailedCloudOperation,
  requeueFailedCloudOperation,
} from "../services/syncQueue";
import { createRecordId } from "../utils/ids";

const STATE_KEYS = {
  config: "SHOP_CONFIG",
  products: "PRODUCTS",
  sales: "SALES",
  expenses: "EXPENSES",
  debts: "DEBTS",
};

const ROLE_CACHE_PREFIX = "sukie_shop_role_v1";

const readCachedRole = (shopId) => {
  try {
    return localStorage.getItem(`${ROLE_CACHE_PREFIX}:${shopId}`);
  } catch {
    return null;
  }
};

const cacheRole = (shopId, role) => {
  try {
    localStorage.setItem(`${ROLE_CACHE_PREFIX}:${shopId}`, role);
  } catch {
    // Role is re-fetched from the server on every load; caching is best-effort.
  }
};

const isOnline = () => typeof navigator === "undefined" || navigator.onLine !== false;

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Keep the unauthenticated shell free of another shop's local cache.
  const [config, setConfig] = useState(INITIAL_SHOP_CONFIG);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [sales, setSales] = useState(INITIAL_SALES);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [debts, setDebts] = useState(INITIAL_DEBTS);
  const [cloudStatus, setCloudStatus] = useState("connecting"); // connected | connecting | pending | error | local
  const [activeShopId, setActiveShopId] = useState(null);
  const [role, setRole] = useState(null); // 'owner' | 'cashier' | null (unknown)
  const [syncIssues, setSyncIssues] = useState([]);

  // Modal & Toast States
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  // Latest data, readable synchronously by handlers. Updated immediately on every
  // local change so two quick actions never compute from the same stale snapshot.
  const latest = useRef({ config, products, sales, expenses, debts, activeShopId });
  useEffect(() => {
    latest.current = { config, products, sales, expenses, debts, activeShopId };
  });

  const setters = useMemo(() => ({
    config: setConfig,
    products: setProducts,
    sales: setSales,
    expenses: setExpenses,
    debts: setDebts,
  }), []);

  // Updates state, the handler-visible snapshot, and the shop's local cache together.
  const commit = useCallback((updates, { persist = true } = {}) => {
    const shopId = latest.current.activeShopId;
    for (const [name, value] of Object.entries(updates)) {
      latest.current = { ...latest.current, [name]: value };
      setters[name](value);
      if (persist && shopId) saveToStorage(STATE_KEYS[name], value, shopId);
    }
  }, [setters]);

  const toastTimer = useRef(null);
  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Owner-only actions are also enforced by the database; this gives cashiers
  // immediate feedback instead of a local change that the cloud later rejects.
  // While the role is still unknown (first offline load) the server is the guard.
  const isOwner = role !== "cashier";
  const requireOwner = useCallback((action) => {
    if (role === "cashier") {
      showToast(`Only the shop owner can ${action}.`, "warning");
      return false;
    }
    return true;
  }, [role, showToast]);

  const refreshSyncState = useCallback((shopId = latest.current.activeShopId) => {
    if (!shopId) return;
    const failed = getFailedCloudOperations(shopId);
    setSyncIssues(failed);
    if (failed.length) setCloudStatus("error");
    else if (getPendingCloudOperationCount(shopId)) setCloudStatus("pending");
    else setCloudStatus(isOnline() ? "connected" : "local");
  }, []);

  const activateShop = useCallback((shopId) => {
    if (!shopId) throw new Error("Cannot activate a shop without an ID.");
    const stored = loadStoredData(shopId);
    rememberActiveShop(shopId);
    latest.current = { ...stored, debts: stored.debts || [], activeShopId: shopId };
    setConfig(stored.config);
    setProducts(stored.products);
    setSales(stored.sales);
    setExpenses(stored.expenses);
    setDebts(stored.debts || []);
    setActiveShopId(shopId);
    setRole(readCachedRole(shopId));
    setSyncIssues(getFailedCloudOperations(shopId));
    setCloudStatus("connecting");
  }, []);

  const deactivateShop = useCallback(() => {
    latest.current = {
      config: INITIAL_SHOP_CONFIG,
      products: INITIAL_PRODUCTS,
      sales: INITIAL_SALES,
      expenses: INITIAL_EXPENSES,
      debts: INITIAL_DEBTS,
      activeShopId: null,
    };
    setActiveShopId(null);
    setActiveReceipt(null);
    setConfig(INITIAL_SHOP_CONFIG);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setDebts(INITIAL_DEBTS || []);
    setRole(null);
    setSyncIssues([]);
    setCloudStatus("local");
  }, []);

  const reloadCloudData = useRef(null);
  const flushInFlight = useRef(null);
  const flushPending = useCallback(async (shopId) => {
    if (flushInFlight.current) return flushInFlight.current;
    const run = (async () => {
      try {
        const { failed } = await flushCloudOperations(shopId, runCloudOperation);
        if (failed) {
          showToast(`${failed} change(s) were rejected by the cloud. Review them in Settings → Sync issues.`, "warning");
        }
      } finally {
        flushInFlight.current = null;
        refreshSyncState(shopId);
      }
    })();
    flushInFlight.current = run;
    return run;
  }, [refreshSyncState, showToast]);

  // Every change is written to the device's outbox *before* any network call, then the
  // outbox is sent in order. A hung request, closed tab, or restart can never lose a
  // change, and changes always reach the cloud in the order they were made. All cloud
  // operations are idempotent, so a change that is re-sent after a crash is harmless.
  const submitCloudOperation = useCallback(async (type, payload) => {
    const shopId = latest.current.activeShopId;
    if (!shopId) return false;
    const operation = { type, payload };

    try {
      enqueueCloudOperation(shopId, operation);
    } catch (queueError) {
      // Browser storage is full: the change can't be kept for later, so try to send it now.
      console.error("Could not save the pending cloud operation:", queueError);
      try {
        await runCloudOperation(operation);
        return true;
      } catch (error) {
        showToast(`${queueError.message} The cloud could not be reached either: ${error.message}`, "warning");
        return false;
      }
    }

    refreshSyncState(shopId);
    if (!isOnline()) {
      showToast(`Saved on this device. ${getPendingCloudOperationCount(shopId)} change(s) will sync when reconnected.`, "warning");
      return true;
    }

    try {
      await flushPending(shopId);
    } catch (error) {
      console.warn(`Cloud operation "${type}" will be retried:`, error);
      showToast(`Saved on this device. ${getPendingCloudOperationCount(shopId)} change(s) will sync when reconnected.`, "warning");
    }
    return true;
  }, [flushPending, refreshSyncState, showToast]);

  // Listen to browser storage quota warnings
  useEffect(() => {
    const handleStorageWarning = (e) => {
      const isQuota = e.detail?.isQuotaExceeded;
      showToast(
        isQuota
          ? "Warning: Browser local storage is full. Please export an emergency backup JSON!"
          : "Notice: Unable to write to local storage cache.",
        "warning"
      );
    };

    window.addEventListener("sukie_storage_quota_warning", handleStorageWarning);
    return () => window.removeEventListener("sukie_storage_quota_warning", handleStorageWarning);
  }, [showToast]);

  // Load the active shop from the cloud and retry pending offline writes.
  useEffect(() => {
    if (!activeShopId) return undefined;
    let isMounted = true;

    async function loadCloudData() {
      try {
        try {
          await flushPending(activeShopId);
        } catch (error) {
          // Temporary failure: keep showing local data until the queue drains.
          console.warn("Pending cloud changes could not be synced:", error);
          if (isMounted) {
            refreshSyncState(activeShopId);
            if (isOnline()) showToast(`Pending cloud changes will retry: ${error.message}`, "warning");
          }
          return;
        }

        const [cloudProds, cloudSales, cloudExpenses, cloudDebts, cloudConfig, cloudRole] = await Promise.all([
          fetchSupabaseProducts(),
          fetchSupabaseSales(),
          fetchSupabaseExpenses(),
          fetchSupabaseDebts(),
          fetchSupabaseConfig(),
          fetchShopRole(),
        ]);

        if (!isMounted) return;

        if (cloudRole) {
          setRole(cloudRole);
          cacheRole(activeShopId, cloudRole);
        }

        const hasCachedProducts = localStorage.getItem(`sukie_products_v2:${activeShopId}`) !== null;
        if (cloudProds.length === 0 && !hasCachedProducts && cloudRole === "owner") {
          await addInitialProductsInSupabase(INITIAL_PRODUCTS);
          cloudProds.push(...INITIAL_PRODUCTS);
        }

        // Changes made while this load was in flight are still queued; don't overwrite them.
        if (getPendingCloudOperationCount(activeShopId) > 0) {
          refreshSyncState(activeShopId);
          return;
        }

        commit({
          products: cloudProds,
          sales: cloudSales,
          expenses: cloudExpenses,
          debts: cloudDebts,
        });
        if (cloudConfig) commit({ config: { ...INITIAL_SHOP_CONFIG, ...latest.current.config, ...cloudConfig } });
        refreshSyncState(activeShopId);
      } catch (err) {
        console.error("Failed loading the active shop from Supabase:", err);
        if (isMounted) {
          refreshSyncState(activeShopId);
          if (isOnline()) {
            setCloudStatus("error");
            showToast(`Cloud data could not be refreshed: ${err.message}`, "warning");
          }
        }
      }
    }

    reloadCloudData.current = loadCloudData;
    loadCloudData();

    const refresh = async (fetchData, name) => {
      // Local changes that haven't reached the cloud yet would be hidden by a refetch.
      if (getPendingCloudOperationCount(activeShopId) > 0) return;
      try {
        const data = await fetchData();
        if (!isMounted || getPendingCloudOperationCount(activeShopId) > 0) return;
        if (name === "config") {
          if (data) commit({ config: { ...latest.current.config, ...data } });
        } else {
          commit({ [name]: data });
        }
      } catch (error) {
        console.error(`Realtime refresh of ${name} failed:`, error);
        if (isMounted && isOnline()) {
          setCloudStatus("error");
          showToast(`Could not refresh ${name} from cloud: ${error.message}`, "warning");
        }
      }
    };

    const unsubscribe = subscribeToRealtimeChanges(
      () => refresh(fetchSupabaseProducts, "products"),
      () => refresh(fetchSupabaseSales, "sales"),
      () => refresh(fetchSupabaseExpenses, "expenses"),
      () => refresh(fetchSupabaseDebts, "debts"),
      () => refresh(fetchSupabaseConfig, "config")
    );

    const handleOnline = () => {
      void loadCloudData();
    };
    const handleOffline = () => refreshSyncState(activeShopId);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isMounted = false;
      reloadCloudData.current = null;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, [activeShopId, commit, flushPending, refreshSyncState, showToast]);

  // ---- Sync issue management ----

  const retrySyncIssue = useCallback(async (operationId) => {
    const shopId = latest.current.activeShopId;
    if (!shopId) return;
    requeueFailedCloudOperation(shopId, operationId);
    refreshSyncState(shopId);
    try {
      await flushPending(shopId);
      if (!getFailedCloudOperations(shopId).some((op) => op.id === operationId)) {
        showToast("Change synced to the cloud.");
      }
    } catch (error) {
      showToast(`Still offline. The change will retry automatically: ${error.message}`, "warning");
    }
  }, [flushPending, refreshSyncState, showToast]);

  const discardSyncIssue = useCallback((operationId) => {
    const shopId = latest.current.activeShopId;
    if (!shopId) return;
    discardFailedCloudOperation(shopId, operationId);
    refreshSyncState(shopId);
    showToast("Change discarded. Cloud data will be reloaded.", "info");
    void reloadCloudData.current?.();
  }, [refreshSyncState, showToast]);

  // ---- Domain handlers ----

  const handleCompleteSale = useCallback((newSale) => {
    const { products, sales, debts, config } = latest.current;
    const updates = {
      products: deductStockForSale(products, newSale.items),
      sales: [newSale, ...sales],
    };

    // If sale is on credit, automatically generate a debt record
    if (newSale.paymentMethod === "Credit" || newSale.status === "Credit") {
      const newDebt = {
        id: `debt-${newSale.id.replace("REC-", "")}`,
        customerName: newSale.customerName,
        customerPhone: newSale.customerPhone,
        saleId: newSale.id,
        date: newSale.date,
        totalAmount: newSale.total,
        paidAmount: 0,
        remainingBalance: newSale.total,
        dueDate: newSale.creditDueDate || "",
        status: "Unpaid",
        notes: newSale.note || "Sale on credit",
        payments: [],
      };
      updates.debts = [newDebt, ...debts];
    }

    commit(updates);
    void submitCloudOperation("sale", newSale);

    setActiveReceipt(newSale);
    showToast(`Sale recorded successfully! Total: ${newSale.total.toFixed(2)} ${config.currency}`);
  }, [commit, submitCloudOperation, showToast]);

  const handleVoidSale = useCallback((saleToVoid) => {
    if (!requireOwner("void sales")) return;
    const { products, sales, debts } = latest.current;
    const linkedDebt = debts.find((debt) => debt.saleId === saleToVoid.id);
    if (linkedDebt?.paidAmount > 0) {
      showToast("This credit sale has repayments and cannot be voided.", "warning");
      return;
    }

    commit({
      products: restoreStockForVoidedSale(products, saleToVoid.items),
      sales: sales.filter((s) => s.id !== saleToVoid.id),
      debts: debts.filter((debt) => debt.saleId !== saleToVoid.id),
    });
    void submitCloudOperation("void_sale", { saleId: saleToVoid.id });

    showToast(`Receipt ${saleToVoid.id} voided. Stock returned to tanks!`, "info");
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleRestockLiters = useCallback((productId, litersToAdd, batchCost) => {
    if (!requireOwner("restock products")) return;
    const liters = parseFloat(litersToAdd) || 0;
    if (liters <= 0) return;
    const costPerLiter = batchCost ? parseFloat(batchCost) : null;

    commit({ products: restockProductStock(latest.current.products, productId, liters, batchCost) });
    // Sent as a delta so restocks and sales from other devices are never overwritten.
    void submitCloudOperation("product_restock", {
      restockId: createRecordId("restock"),
      productId,
      liters,
      costPerLiter: Number.isFinite(costPerLiter) ? costPerLiter : null,
    });

    showToast(`Added ${liters}L to tank stock!`);
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleAddProduct = useCallback((newProd) => {
    if (!requireOwner("add products")) return;
    const productWithId = newProd.id ? newProd : { ...newProd, id: createRecordId("soap") };
    commit({ products: [productWithId, ...latest.current.products] });
    void submitCloudOperation("product_upsert", productWithId);
    showToast(`Added new soap variety: "${productWithId.name}"`);
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleUpdateProduct = useCallback((updatedProd) => {
    if (!requireOwner("edit products")) return;
    commit({ products: latest.current.products.map((p) => (p.id === updatedProd.id ? updatedProd : p)) });
    void submitCloudOperation("product_upsert", updatedProd);
    showToast(`Updated product details for "${updatedProd.name}"`);
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleDeleteProduct = useCallback((productId) => {
    if (!requireOwner("delete products")) return;
    commit({ products: latest.current.products.filter((p) => p.id !== productId) });
    void submitCloudOperation("product_delete", { productId });
    showToast("Product deleted from catalog.");
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleAddExpense = useCallback((expenseRecord) => {
    commit({ expenses: [expenseRecord, ...latest.current.expenses] });
    void submitCloudOperation("expense_upsert", expenseRecord);
    showToast(`Expense of ${expenseRecord.amount.toFixed(2)} ${latest.current.config.currency} recorded!`);
  }, [commit, submitCloudOperation, showToast]);

  const handleDeleteExpense = useCallback((expenseId) => {
    if (!requireOwner("delete expenses")) return;
    commit({ expenses: latest.current.expenses.filter((e) => e.id !== expenseId) });
    void submitCloudOperation("expense_delete", { expenseId });
    showToast("Expense record deleted.");
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleRecordDebtRepayment = useCallback((debtId, paymentAmount, paymentMethod = "Cash", paymentNote = "") => {
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;
    const { debts, config } = latest.current;

    const debt = debts.find((item) => item.id === debtId);
    if (!debt) return;
    if (amount > debt.remainingBalance) {
      showToast(`Payment cannot exceed the remaining balance of ${debt.remainingBalance.toFixed(2)} ${config.currency}.`, "warning");
      return;
    }

    const updatedDebt = applyDebtRepayment(debt, amount, paymentMethod, paymentNote);
    const payment = updatedDebt.payments[0];
    commit({ debts: debts.map((d) => (d.id === debtId ? updatedDebt : d)) });
    if (payment && updatedDebt !== debt) void submitCloudOperation("debt_payment", { debtId, payment });

    showToast(`Repayment of ${amount.toFixed(2)} ${config.currency} recorded!`);
  }, [commit, submitCloudOperation, showToast]);

  const handleCreateDebt = useCallback((newDebt) => {
    // New debts always start unpaid; repayments are recorded separately.
    const debt = {
      ...newDebt,
      paidAmount: 0,
      remainingBalance: Number(newDebt.totalAmount) || 0,
      status: "Unpaid",
      payments: [],
    };
    commit({ debts: [debt, ...latest.current.debts] });
    void submitCloudOperation("debt_upsert", debt);
    showToast(`Debt record created for "${debt.customerName}"`);
  }, [commit, submitCloudOperation, showToast]);

  const handleDeleteDebt = useCallback((debtId) => {
    if (!requireOwner("delete debt records")) return;
    commit({ debts: latest.current.debts.filter((d) => d.id !== debtId) });
    void submitCloudOperation("debt_delete", { debtId });
    showToast("Debt record removed.");
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleSaveConfig = useCallback((newConfig) => {
    if (!requireOwner("change shop settings")) return;
    commit({ config: newConfig });
    void submitCloudOperation("config_upsert", { config: newConfig, shopId: latest.current.activeShopId });
    showToast("Shop settings updated!");
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleResetDefaults = useCallback(() => {
    if (!requireOwner("reset shop data")) return;
    const fresh = resetToDefaults(latest.current.activeShopId);
    commit({
      config: fresh.config,
      products: fresh.products,
      sales: fresh.sales,
      expenses: fresh.expenses,
      debts: fresh.debts || [],
    }, { persist: false });
    showToast("Starter data restored on this device only. Cloud records were not changed.", "warning");
  }, [commit, requireOwner, showToast]);

  const handleClearTransactionsOnly = useCallback(() => {
    if (!requireOwner("clear sales records")) return;
    commit({ sales: [] });
    void submitCloudOperation("clear_sales", {});
    showToast("Sales transactions cleared on this device and queued for cloud sync.");
  }, [commit, requireOwner, submitCloudOperation, showToast]);

  const handleImportData = useCallback((rawImportedData) => {
    if (!requireOwner("import backups")) return;
    const sanitized = sanitizeImportPayload(rawImportedData);
    if (!sanitized) {
      showToast("Invalid backup file format.", "warning");
      return;
    }

    const updates = {};
    if (sanitized.config) updates.config = sanitized.config;
    if (sanitized.products && sanitized.products.length > 0) updates.products = sanitized.products;
    if (sanitized.sales) updates.sales = sanitized.sales;
    if (sanitized.expenses) updates.expenses = sanitized.expenses;
    if (sanitized.debts) updates.debts = sanitized.debts;
    commit(updates);
    showToast("Backup imported to this device. Cloud data was not changed; verify it before syncing.", "warning");
  }, [commit, requireOwner, showToast]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockLiters <= (p.minStockAlert || 40)).length,
    [products]
  );

  const unpaidDebtsCount = useMemo(
    () => debts.filter((d) => d.status !== "Settled" && (d.remainingBalance > 0 || d.totalAmount > (d.paidAmount || 0))).length,
    [debts]
  );

  const currency = config?.currency || "ETB";

  const contextValue = useMemo(() => ({
    // State
    activeTab,
    setActiveTab,
    config,
    products,
    sales,
    expenses,
    debts,
    activeReceipt,
    setActiveReceipt,
    toast,
    showToast,
    currency,
    lowStockCount,
    unpaidDebtsCount,
    cloudStatus,
    activeShopId,
    activateShop,
    deactivateShop,
    role,
    isOwner,
    syncIssues,
    retrySyncIssue,
    discardSyncIssue,

    // Handlers
    handleCompleteSale,
    handleVoidSale,
    handleRestockLiters,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddExpense,
    handleDeleteExpense,
    handleRecordDebtRepayment,
    handleCreateDebt,
    handleDeleteDebt,
    handleSaveConfig,
    handleResetDefaults,
    handleClearTransactionsOnly,
    handleImportData,
  }), [
    activeTab, config, products, sales, expenses, debts, activeReceipt, toast, showToast,
    currency, lowStockCount, unpaidDebtsCount, cloudStatus, activeShopId, activateShop,
    deactivateShop, role, isOwner, syncIssues, retrySyncIssue, discardSyncIssue,
    handleCompleteSale, handleVoidSale, handleRestockLiters, handleAddProduct,
    handleUpdateProduct, handleDeleteProduct, handleAddExpense, handleDeleteExpense,
    handleRecordDebtRepayment, handleCreateDebt, handleDeleteDebt, handleSaveConfig,
    handleResetDefaults, handleClearTransactionsOnly, handleImportData,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
