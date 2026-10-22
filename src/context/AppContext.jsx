import React, { useState, useMemo, useEffect } from "react";
import { AppContext } from "./appContextInstance";
import {
  loadStoredData,
  saveToStorage,
  resetToDefaults,
  sanitizeImportPayload,
} from "../utils/storage";
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
  recordSaleInSupabase,
  updateProductStockInSupabase,
  recordExpenseInSupabase,
  deleteExpenseFromSupabase,
  recordDebtInSupabase,
  updateDebtInSupabase,
  subscribeToRealtimeChanges,
} from "../services/supabaseService";

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Core Data States initialized synchronously on first render from local cache
  const [initialData] = useState(() => loadStoredData());
  const [config, setConfig] = useState(initialData.config);
  const [products, setProducts] = useState(initialData.products);
  const [sales, setSales] = useState(initialData.sales);
  const [expenses, setExpenses] = useState(initialData.expenses);
  const [debts, setDebts] = useState(initialData.debts || []);
  const [cloudStatus, setCloudStatus] = useState("connecting"); // 'connected' | 'connecting' | 'local'

  // Modal & Toast States
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  // Show temporary toast message
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
  }, []);

  // Sync with Supabase on mount & listen to real-time changes
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        const [cloudProds, cloudSales, cloudExpenses, cloudDebts] = await Promise.all([
          fetchSupabaseProducts(),
          fetchSupabaseSales(),
          fetchSupabaseExpenses(),
          fetchSupabaseDebts(),
        ]);

        if (!isMounted) return;

        if (cloudProds && cloudProds.length > 0) {
          setProducts(cloudProds);
          saveToStorage("PRODUCTS", cloudProds);
        }
        if (cloudSales && cloudSales.length > 0) {
          setSales(cloudSales);
          saveToStorage("SALES", cloudSales);
        }
        if (cloudExpenses && cloudExpenses.length > 0) {
          setExpenses(cloudExpenses);
          saveToStorage("EXPENSES", cloudExpenses);
        }
        if (cloudDebts && cloudDebts.length > 0) {
          setDebts(cloudDebts);
          saveToStorage("DEBTS", cloudDebts);
        }

        if (cloudProds || cloudSales || cloudExpenses || cloudDebts) {
          setCloudStatus("connected");
        } else {
          setCloudStatus("local");
        }
      } catch (err) {
        console.warn("Failed loading from Supabase:", err);
        if (isMounted) setCloudStatus("local");
      }
    }

    loadCloudData();

    // Subscribe to realtime updates across multiple devices
    const unsubscribe = subscribeToRealtimeChanges(
      async () => {
        const prods = await fetchSupabaseProducts();
        if (prods && isMounted) {
          setProducts(prods);
          saveToStorage("PRODUCTS", prods);
        }
      },
      async () => {
        const sls = await fetchSupabaseSales();
        if (sls && isMounted) {
          setSales(sls);
          saveToStorage("SALES", sls);
        }
      },
      async () => {
        const exps = await fetchSupabaseExpenses();
        if (exps && isMounted) {
          setExpenses(exps);
          saveToStorage("EXPENSES", exps);
        }
      },
      async () => {
        const dbs = await fetchSupabaseDebts();
        if (dbs && isMounted) {
          setDebts(dbs);
          saveToStorage("DEBTS", dbs);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 1. Complete Sale Handler
  const handleCompleteSale = (newSale) => {
    const updatedProducts = deductStockForSale(products, newSale.items);
    const updatedSales = [newSale, ...sales];

    setProducts(updatedProducts);
    setSales(updatedSales);
    saveToStorage("PRODUCTS", updatedProducts);
    saveToStorage("SALES", updatedSales);

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
      saveToStorage("DEBTS", updatedDebts);
      recordDebtInSupabase(newDebt);
    }

    // Asynchronously sync to Supabase cloud
    recordSaleInSupabase(newSale);
    newSale.items.forEach((item) => {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      if (prod) {
        updateProductStockInSupabase(prod.id, prod.stockLiters);
      }
    });

    setActiveReceipt(newSale);
    showToast(`Sale recorded successfully! Total: ${newSale.total.toFixed(2)} ${config.currency}`);
  };

  // 1b. Void Sale Handler (Restores product liters to tanks)
  const handleVoidSale = (saleToVoid) => {
    const updatedProducts = restoreStockForVoidedSale(products, saleToVoid.items);
    const updatedSales = sales.filter((s) => s.id !== saleToVoid.id);

    setProducts(updatedProducts);
    setSales(updatedSales);
    saveToStorage("PRODUCTS", updatedProducts);
    saveToStorage("SALES", updatedSales);

    // Sync restored stock to Supabase
    saleToVoid.items?.forEach((item) => {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      if (prod) {
        updateProductStockInSupabase(prod.id, prod.stockLiters);
      }
    });

    showToast(`Receipt ${saleToVoid.id} voided. Stock returned to tanks!`, "info");
  };

  // 2. Restock Liters Handler
  const handleRestockLiters = (productId, litersToAdd, batchCost) => {
    const updated = restockProductStock(products, productId, litersToAdd, batchCost);
    setProducts(updated);
    saveToStorage("PRODUCTS", updated);

    const prod = updated.find((p) => p.id === productId);
    if (prod) {
      updateProductStockInSupabase(productId, prod.stockLiters);
    }

    showToast(`Added ${litersToAdd}L to tank stock!`);
  };

  // 3. Add New Product
  const handleAddProduct = (newProd) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    saveToStorage("PRODUCTS", updated);
    showToast(`Added new soap variety: "${newProd.name}"`);
  };

  // 4. Update Product
  const handleUpdateProduct = (updatedProd) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    saveToStorage("PRODUCTS", updated);
    updateProductStockInSupabase(updatedProd.id, updatedProd.stockLiters);
    showToast(`Updated product details for "${updatedProd.name}"`);
  };

  // 5. Delete Product
  const handleDeleteProduct = (productId) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveToStorage("PRODUCTS", updated);
    showToast("Product deleted from catalog.");
  };

  // 6. Add Expense
  const handleAddExpense = (expenseRecord) => {
    const updated = [expenseRecord, ...expenses];
    setExpenses(updated);
    saveToStorage("EXPENSES", updated);

    // Sync to Supabase cloud
    recordExpenseInSupabase(expenseRecord);

    showToast(`Expense of ${expenseRecord.amount.toFixed(2)} ${config.currency} recorded!`);
  };

  const handleDeleteExpense = (expenseId) => {
    const updated = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updated);
    saveToStorage("EXPENSES", updated);

    // Delete in Supabase cloud
    deleteExpenseFromSupabase(expenseId);

    showToast("Expense record deleted.");
  };

  // 7. Debts Management Handlers
  const handleRecordDebtRepayment = (debtId, paymentAmount, paymentMethod = "Cash", paymentNote = "") => {
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    let targetDebt = null;
    const updatedDebts = debts.map((d) => {
      if (d.id === debtId) {
        const updated = applyDebtRepayment(d, amount, paymentMethod, paymentNote);
        targetDebt = updated;
        return updated;
      }
      return d;
    });

    if (targetDebt) {
      updateDebtInSupabase(debtId, targetDebt);
    }

    setDebts(updatedDebts);
    saveToStorage("DEBTS", updatedDebts);
    showToast(`Repayment of ${amount.toFixed(2)} ${config.currency} recorded!`);
  };

  const handleCreateDebt = (newDebt) => {
    const updated = [newDebt, ...debts];
    setDebts(updated);
    saveToStorage("DEBTS", updated);
    recordDebtInSupabase(newDebt);
    showToast(`Debt record created for "${newDebt.customerName}"`);
  };

  const handleDeleteDebt = (debtId) => {
    const updated = debts.filter((d) => d.id !== debtId);
    setDebts(updated);
    saveToStorage("DEBTS", updated);
    showToast("Debt record removed.");
  };

  // 8. Save Shop Config
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    saveToStorage("SHOP_CONFIG", newConfig);
    showToast("Shop settings updated!");
  };

  // 9. Reset to defaults
  const handleResetDefaults = () => {
    const fresh = resetToDefaults();
    setConfig(fresh.config);
    setProducts(fresh.products);
    setSales(fresh.sales);
    setExpenses(fresh.expenses);
    setDebts(fresh.debts || []);
    showToast("Restored starter demo data.");
  };

  // 10. Clear transactions only
  const handleClearTransactionsOnly = () => {
    setSales([]);
    saveToStorage("SALES", []);
    showToast("Sales transactions cleared. Ready for fresh transactions!");
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
      saveToStorage("SHOP_CONFIG", sanitized.config);
    }
    if (sanitized.products && sanitized.products.length > 0) {
      setProducts(sanitized.products);
      saveToStorage("PRODUCTS", sanitized.products);
    }
    if (sanitized.sales) {
      setSales(sanitized.sales);
      saveToStorage("SALES", sanitized.sales);
    }
    if (sanitized.expenses) {
      setExpenses(sanitized.expenses);
      saveToStorage("EXPENSES", sanitized.expenses);
    }
    if (sanitized.debts) {
      setDebts(sanitized.debts);
      saveToStorage("DEBTS", sanitized.debts);
    }
    if (sanitized.users && sanitized.users.length > 0) {
      saveToStorage("USERS", sanitized.users);
    }
    showToast("Backup data validated and imported successfully!");
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
