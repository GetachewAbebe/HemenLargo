import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppContext } from "./appContextInstance";
import {
  loadStoredData,
  saveToStorage,
  resetToDefaults,
  sanitizeImportPayload,
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
  addInitialProductsInSupabase,
  runCloudOperation,
  subscribeToRealtimeChanges,
} from "../services/supabaseService";
import {
  enqueueCloudOperation,
  flushCloudOperations,
  getPendingCloudOperationCount,
  isTransientSyncError,
} from "../services/syncQueue";
import { createRecordId } from "../utils/ids";

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Keep the unauthenticated shell free of another shop's local cache.
  const initialData = useMemo(() => ({
    config: INITIAL_SHOP_CONFIG,
    products: INITIAL_PRODUCTS,
    sales: INITIAL_SALES,
    expenses: INITIAL_EXPENSES,
    debts: INITIAL_DEBTS,
  }), []);
  const [config, setConfig] = useState(initialData.config);
  const [products, setProducts] = useState(initialData.products);
  const [sales, setSales] = useState(initialData.sales);
  const [expenses, setExpenses] = useState(initialData.expenses);
  const [debts, setDebts] = useState(initialData.debts);
  const [cloudStatus, setCloudStatus] = useState("connecting"); // 'connected' | 'connecting' | 'local'
  const [activeShopId, setActiveShopId] = useState(null);

  // Modal & Toast States
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  // Show temporary toast message
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const persist = (key, data) => saveToStorage(key, data, activeShopId);
  const activateShop = useCallback((shopId) => {
    if (!shopId) throw new Error("Cannot activate a shop without an ID.");
    const stored = loadStoredData(shopId);
    setConfig(stored.config);
    setProducts(stored.products);
    setSales(stored.sales);
    setExpenses(stored.expenses);
    setDebts(stored.debts || []);
    setActiveShopId(shopId);
    setCloudStatus("connecting");
  }, []);

  const deactivateShop = useCallback(() => {
    setActiveShopId(null);
    setActiveReceipt(null);
    setConfig(initialData.config);
    setProducts(initialData.products);
    setSales(initialData.sales);
    setExpenses(initialData.expenses);
    setDebts(initialData.debts || []);
    setCloudStatus("local");
  }, [initialData]);

  const submitCloudOperation = useCallback(async (type, payload) => {
    if (!activeShopId) return false;
    try {
      await runCloudOperation({ type, payload });
      setCloudStatus(getPendingCloudOperationCount(activeShopId) ? "pending" : "connected");
      return true;
    } catch (error) {
      console.error(`Cloud operation "${type}" failed:`, error);
      try {
        const pendingCount = enqueueCloudOperation(activeShopId, { type, payload });
        setCloudStatus(isTransientSyncError(error) ? "pending" : "error");
        showToast(
          isTransientSyncError(error)
            ? `Saved locally. ${pendingCount} cloud change(s) will sync when reconnected.`
            : `Saved locally, but cloud rejected this change. ${pendingCount} change(s) need attention: ${error.message}`,
          "warning"
        );
        return true;
      } catch (queueError) {
        console.error("Could not save the pending cloud operation:", queueError);
        showToast(queueError.message, "warning");
        return false;
      }
    }
  }, [activeShopId, showToast]);

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
          await flushCloudOperations(activeShopId, runCloudOperation);
        } catch (error) {
          console.warn("Pending cloud changes could not be synced:", error);
          if (isMounted) {
            setCloudStatus(isTransientSyncError(error) ? "pending" : "error");
            showToast(`Pending cloud changes need attention: ${error.message}`, "warning");
          }
          return;
        }

        const [cloudProds, cloudSales, cloudExpenses, cloudDebts, cloudConfig] = await Promise.all([
          fetchSupabaseProducts(),
          fetchSupabaseSales(),
          fetchSupabaseExpenses(),
          fetchSupabaseDebts(),
          fetchSupabaseConfig(),
        ]);

        if (!isMounted) return;

        const hasCachedProducts = localStorage.getItem(`sukie_products_v2:${activeShopId}`) !== null;
        if (cloudProds.length === 0 && !hasCachedProducts) {
          await addInitialProductsInSupabase(INITIAL_PRODUCTS);
          cloudProds.push(...INITIAL_PRODUCTS);
        }

        setProducts(cloudProds);
        setSales(cloudSales);
        setExpenses(cloudExpenses);
        setDebts(cloudDebts);
        if (cloudConfig) setConfig((current) => ({ ...current, ...cloudConfig }));
        saveToStorage("PRODUCTS", cloudProds, activeShopId);
        saveToStorage("SALES", cloudSales, activeShopId);
        saveToStorage("EXPENSES", cloudExpenses, activeShopId);
        saveToStorage("DEBTS", cloudDebts, activeShopId);
        if (cloudConfig) saveToStorage("SHOP_CONFIG", { ...INITIAL_SHOP_CONFIG, ...cloudConfig }, activeShopId);
        setCloudStatus(getPendingCloudOperationCount(activeShopId) ? "pending" : "connected");
      } catch (err) {
        console.error("Failed loading the active shop from Supabase:", err);
        if (isMounted) {
          setCloudStatus(
            getPendingCloudOperationCount(activeShopId)
              ? "pending"
              : typeof navigator !== "undefined" && !navigator.onLine
                ? "local"
                : "error"
          );
          showToast(`Cloud data could not be refreshed: ${err.message}`, "warning");
        }
      }
    }

    loadCloudData();

    const refresh = async (fetchData, setData, key) => {
      try {
        const data = await fetchData();
        if (!isMounted) return;
        setData(data);
        saveToStorage(key, data, activeShopId);
      } catch (error) {
        console.error(`Realtime refresh of ${key} failed:`, error);
        if (isMounted) {
          setCloudStatus(typeof navigator !== "undefined" && !navigator.onLine ? "local" : "error");
          showToast(`Could not refresh ${key.toLowerCase()} from cloud: ${error.message}`, "warning");
        }
      }
    };

    const unsubscribe = subscribeToRealtimeChanges(
      () => refresh(fetchSupabaseProducts, setProducts, "PRODUCTS"),
      () => refresh(fetchSupabaseSales, setSales, "SALES"),
      () => refresh(fetchSupabaseExpenses, setExpenses, "EXPENSES"),
      () => refresh(fetchSupabaseDebts, setDebts, "DEBTS"),
      () => refresh(fetchSupabaseConfig, (data) => data && setConfig((current) => ({ ...current, ...data })), "SHOP_CONFIG")
    );

    const handleOnline = async () => {
      try {
        await flushCloudOperations(activeShopId, runCloudOperation);
        await loadCloudData();
      } catch (error) {
        console.error("Retrying pending cloud changes failed:", error);
        setCloudStatus(isTransientSyncError(error) ? "pending" : "error");
        showToast(`Could not sync pending cloud changes: ${error.message}`, "warning");
      }
    };
    window.addEventListener("online", handleOnline);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      unsubscribe();
    };
  }, [activeShopId, showToast]);

  // 1. Complete Sale Handler
  const handleCompleteSale = (newSale) => {
    const updatedProducts = deductStockForSale(products, newSale.items);
    const updatedSales = [newSale, ...sales];

    setProducts(updatedProducts);
    setSales(updatedSales);
    persist("PRODUCTS", updatedProducts);
    persist("SALES", updatedSales);

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
      const updatedDebts = [newDebt, ...debts];
      setDebts(updatedDebts);
      persist("DEBTS", updatedDebts);
    }

    void submitCloudOperation("sale", newSale);

    setActiveReceipt(newSale);
    showToast(`Sale recorded successfully! Total: ${newSale.total.toFixed(2)} ${config.currency}`);
  };

  // 1b. Void Sale Handler (Restores product liters to tanks)
  const handleVoidSale = (saleToVoid) => {
    const linkedDebt = debts.find((debt) => debt.saleId === saleToVoid.id);
    if (linkedDebt?.paidAmount > 0) {
      showToast("This credit sale has repayments and cannot be voided.", "warning");
      return;
    }

    const updatedProducts = restoreStockForVoidedSale(products, saleToVoid.items);
    const updatedSales = sales.filter((s) => s.id !== saleToVoid.id);
    const updatedDebts = debts.filter((debt) => debt.saleId !== saleToVoid.id);

    setProducts(updatedProducts);
    setSales(updatedSales);
    setDebts(updatedDebts);
    persist("PRODUCTS", updatedProducts);
    persist("SALES", updatedSales);
    persist("DEBTS", updatedDebts);
    void submitCloudOperation("void_sale", { saleId: saleToVoid.id });

    showToast(`Receipt ${saleToVoid.id} voided. Stock returned to tanks!`, "info");
  };

  // 2. Restock Liters Handler
  const handleRestockLiters = (productId, litersToAdd, batchCost) => {
    const updated = restockProductStock(products, productId, litersToAdd, batchCost);
    setProducts(updated);
    persist("PRODUCTS", updated);

    const prod = updated.find((p) => p.id === productId);
    if (prod) {
      void submitCloudOperation("product_upsert", prod);
    }

    showToast(`Added ${litersToAdd}L to tank stock!`);
  };

  // 3. Add New Product
  const handleAddProduct = (newProd) => {
    const productWithId = newProd.id ? newProd : { ...newProd, id: createRecordId("soap") };
    const updated = [productWithId, ...products];
    setProducts(updated);
    persist("PRODUCTS", updated);
    void submitCloudOperation("product_upsert", productWithId);
    showToast(`Added new soap variety: "${productWithId.name}"`);
  };

  // 4. Update Product
  const handleUpdateProduct = (updatedProd) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    persist("PRODUCTS", updated);
    void submitCloudOperation("product_upsert", updatedProd);
    showToast(`Updated product details for "${updatedProd.name}"`);
  };

  // 5. Delete Product
  const handleDeleteProduct = (productId) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    persist("PRODUCTS", updated);
    void submitCloudOperation("product_delete", { productId });
    showToast("Product deleted from catalog.");
  };

  // 6. Add Expense
  const handleAddExpense = (expenseRecord) => {
    const updated = [expenseRecord, ...expenses];
    setExpenses(updated);
    persist("EXPENSES", updated);
    void submitCloudOperation("expense_upsert", expenseRecord);

    showToast(`Expense of ${expenseRecord.amount.toFixed(2)} ${config.currency} recorded!`);
  };

  const handleDeleteExpense = (expenseId) => {
    const updated = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updated);
    persist("EXPENSES", updated);
    void submitCloudOperation("expense_delete", { expenseId });

    showToast("Expense record deleted.");
  };

  // 7. Debts Management Handlers
  const handleRecordDebtRepayment = (debtId, paymentAmount, paymentMethod = "Cash", paymentNote = "") => {
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    let targetDebt = null;
    let payment = null;
    const debt = debts.find((item) => item.id === debtId);
    if (!debt) return;
    if (amount > debt.remainingBalance) {
      showToast(`Payment cannot exceed the remaining balance of ${debt.remainingBalance.toFixed(2)} ${config.currency}.`, "warning");
      return;
    }

    const updatedDebts = debts.map((d) => {
      if (d.id === debtId) {
        const updated = applyDebtRepayment(d, amount, paymentMethod, paymentNote);
        targetDebt = updated;
        payment = updated.payments[0];
        return updated;
      }
      return d;
    });

    if (targetDebt) {
      if (payment) void submitCloudOperation("debt_payment", { debtId, payment });
    }

    setDebts(updatedDebts);
    persist("DEBTS", updatedDebts);
    showToast(`Repayment of ${amount.toFixed(2)} ${config.currency} recorded!`);
  };

  const handleCreateDebt = (newDebt) => {
    const updated = [newDebt, ...debts];
    setDebts(updated);
    persist("DEBTS", updated);
    void submitCloudOperation("debt_upsert", newDebt);
    showToast(`Debt record created for "${newDebt.customerName}"`);
  };

  const handleDeleteDebt = (debtId) => {
    const updated = debts.filter((d) => d.id !== debtId);
    setDebts(updated);
    persist("DEBTS", updated);
    void submitCloudOperation("debt_delete", { debtId });
    showToast("Debt record removed.");
  };

  // 8. Save Shop Config
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    persist("SHOP_CONFIG", newConfig);
    void submitCloudOperation("config_upsert", { config: newConfig, shopId: activeShopId });
    showToast("Shop settings updated!");
  };

  // 9. Reset to defaults
  const handleResetDefaults = () => {
    const fresh = resetToDefaults(activeShopId);
    setConfig(fresh.config);
    setProducts(fresh.products);
    setSales(fresh.sales);
    setExpenses(fresh.expenses);
    setDebts(fresh.debts || []);
    showToast("Starter data restored on this device only. Cloud records were not changed.", "warning");
  };

  // 10. Clear transactions only
  const handleClearTransactionsOnly = () => {
    setSales([]);
    persist("SALES", []);
    void submitCloudOperation("clear_sales", {});
    showToast("Sales transactions cleared on this device and queued for cloud sync.");
  };

  // 11. Import backup safely with schema validation
  const handleImportData = (rawImportedData) => {
    const sanitized = sanitizeImportPayload(rawImportedData);
    if (!sanitized) {
      showToast("Invalid backup file format.", "warning");
      return;
    }

    if (sanitized.config) {
      setConfig(sanitized.config);
      persist("SHOP_CONFIG", sanitized.config);
    }
    if (sanitized.products && sanitized.products.length > 0) {
      setProducts(sanitized.products);
      persist("PRODUCTS", sanitized.products);
    }
    if (sanitized.sales) {
      setSales(sanitized.sales);
      persist("SALES", sanitized.sales);
    }
    if (sanitized.expenses) {
      setExpenses(sanitized.expenses);
      persist("EXPENSES", sanitized.expenses);
    }
    if (sanitized.debts) {
      setDebts(sanitized.debts);
      persist("DEBTS", sanitized.debts);
    }
    showToast("Backup imported to this device. Cloud data was not changed; verify it before syncing.", "warning");
  };

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockLiters <= (p.minStockAlert || 40)).length,
    [products]
  );

  const unpaidDebtsCount = useMemo(
    () => debts.filter((d) => d.status !== "Settled" && (d.remainingBalance > 0 || d.totalAmount > (d.paidAmount || 0))).length,
    [debts]
  );

  const currency = config?.currency || "ETB";

  const contextValue = {
    // State
    activeTab,
    setActiveTab,
    config,
    setConfig,
    products,
    setProducts,
    sales,
    setSales,
    expenses,
    setExpenses,
    debts,
    setDebts,
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
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
