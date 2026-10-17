import React, { useState, useMemo, useEffect } from "react";
import { AppContext } from "./appContextInstance";
import {
  loadStoredData,
  saveToStorage,
  resetToDefaults,
} from "../utils/storage";
import {
  deductStockForSale,
  restoreStockForVoidedSale,
  createCreditDebtFromSale,
} from "../services/saleService";
import { applyDebtPayment } from "../services/debtService";
import { restockProductStock } from "../services/inventoryService";
import {
  fetchSupabaseProducts,
  fetchSupabaseSales,
  recordSaleInSupabase,
  updateProductStockInSupabase,
  subscribeToRealtimeChanges,
} from "../services/supabaseService";

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("pos");

  // Core Data States initialized synchronously on first render from local cache
  const [initialData] = useState(() => loadStoredData());
  const [config, setConfig] = useState(initialData.config);
  const [products, setProducts] = useState(initialData.products);
  const [sales, setSales] = useState(initialData.sales);
  const [debts, setDebts] = useState(initialData.debts);
  const [expenses, setExpenses] = useState(initialData.expenses);
  const [cloudStatus, setCloudStatus] = useState("connecting"); // 'connected' | 'connecting' | 'local'

  // Modal & Toast States
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  // Show temporary toast message
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync with Supabase on mount & listen to real-time changes
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        const [cloudProds, cloudSales] = await Promise.all([
          fetchSupabaseProducts(),
          fetchSupabaseSales(),
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

        if (cloudProds || cloudSales) {
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

    let updatedDebts = debts;
    if (newSale.paymentMethod === "Credit") {
      const debtRecord = createCreditDebtFromSale(newSale);
      updatedDebts = [debtRecord, ...debts];
      setDebts(updatedDebts);
      saveToStorage("DEBTS", updatedDebts);
    }

    setProducts(updatedProducts);
    setSales(updatedSales);
    saveToStorage("PRODUCTS", updatedProducts);
    saveToStorage("SALES", updatedSales);

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

    if (saleToVoid.paymentMethod === "Credit") {
      const updatedDebts = debts.filter((d) => d.saleId !== saleToVoid.id);
      setDebts(updatedDebts);
      saveToStorage("DEBTS", updatedDebts);
    }

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

  // 6. Record Debt Repayment
  const handleRecordDebtPayment = ({ debtId, amount, method, note }) => {
    const updatedDebts = applyDebtPayment(debts, { debtId, amount, method, note });
    setDebts(updatedDebts);
    saveToStorage("DEBTS", updatedDebts);
    showToast(`Recorded repayment of ${Number(amount).toFixed(2)} ${config.currency}!`);
  };

  // 7. Manual Debt
  const handleAddManualDebt = (debtRecord) => {
    const updated = [debtRecord, ...debts];
    setDebts(updated);
    saveToStorage("DEBTS", updated);
    showToast(`Credit record saved for ${debtRecord.customerName}`);
  };

  const handleDeleteDebt = (debtId) => {
    const updated = debts.filter((d) => d.id !== debtId);
    setDebts(updated);
    saveToStorage("DEBTS", updated);
    showToast("Debt record removed.");
  };

  // 8. Add Expense
  const handleAddExpense = (expenseRecord) => {
    const updated = [expenseRecord, ...expenses];
    setExpenses(updated);
    saveToStorage("EXPENSES", updated);
    showToast(`Expense of ${expenseRecord.amount.toFixed(2)} ${config.currency} recorded!`);
  };

  const handleDeleteExpense = (expenseId) => {
    const updated = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updated);
    saveToStorage("EXPENSES", updated);
    showToast("Expense record deleted.");
  };

  // 9. Save Shop Config
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    saveToStorage("SHOP_CONFIG", newConfig);
    showToast("Shop settings updated!");
  };

  // 10. Reset to defaults
  const handleResetDefaults = () => {
    const fresh = resetToDefaults();
    setConfig(fresh.config);
    setProducts(fresh.products);
    setSales(fresh.sales);
    setDebts(fresh.debts);
    setExpenses(fresh.expenses);
    showToast("Restored starter demo data.");
  };

  // 11. Clear transactions only
  const handleClearTransactionsOnly = () => {
    setSales([]);
    setDebts([]);
    saveToStorage("SALES", []);
    saveToStorage("DEBTS", []);
    showToast("Sales and debts cleared. Ready for fresh transactions!");
  };

  // 12. Import backup
  const handleImportData = (importedData) => {
    if (importedData.config) {
      setConfig(importedData.config);
      saveToStorage("SHOP_CONFIG", importedData.config);
    }
    if (importedData.products) {
      setProducts(importedData.products);
      saveToStorage("PRODUCTS", importedData.products);
    }
    if (importedData.sales) {
      setSales(importedData.sales);
      saveToStorage("SALES", importedData.sales);
    }
    if (importedData.debts) {
      setDebts(importedData.debts);
      saveToStorage("DEBTS", importedData.debts);
    }
    if (importedData.expenses) {
      setExpenses(importedData.expenses);
      saveToStorage("EXPENSES", importedData.expenses);
    }
    showToast("Backup data imported successfully!");
  };

  // Derived counts
  const activeDebtCount = useMemo(
    () => debts.filter((d) => d.status !== "Paid").length,
    [debts]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockLiters <= (p.minStockAlert || 40)).length,
    [products]
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
    debts,
    setDebts,
    expenses,
    setExpenses,
    activeReceipt,
    setActiveReceipt,
    toast,
    showToast,
    currency,
    activeDebtCount,
    lowStockCount,
    cloudStatus,

    // Handlers
    handleCompleteSale,
    handleVoidSale,
    handleRestockLiters,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleRecordDebtPayment,
    handleAddManualDebt,
    handleDeleteDebt,
    handleAddExpense,
    handleDeleteExpense,
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
