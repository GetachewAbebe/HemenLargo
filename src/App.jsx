import React, { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import POSView from "./components/POSView";
import InventoryView from "./components/InventoryView";
import SalesView from "./components/SalesView";
import DebtView from "./components/DebtView";
import ExpensesView from "./components/ExpensesView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import ReceiptModal from "./components/ReceiptModal";
import {
  loadStoredData,
  saveToStorage,
  resetToDefaults,
} from "./utils/storage";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("pos");

  // Core Data States initialized synchronously on first render
  const [initialData] = useState(() => loadStoredData());
  const [config, setConfig] = useState(initialData.config);
  const [products, setProducts] = useState(initialData.products);
  const [sales, setSales] = useState(initialData.sales);
  const [debts, setDebts] = useState(initialData.debts);
  const [expenses, setExpenses] = useState(initialData.expenses);

  // Modal & Toast States
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  // Show temporary toast message
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Complete Sale Handler
  const handleCompleteSale = (newSale) => {
    // A. Deduct stock from products
    const updatedProducts = products.map((prod) => {
      const soldItem = newSale.items.find((item) => item.productId === prod.id);
      if (soldItem) {
        const newStock = Math.max(0, prod.stockLiters - soldItem.liters);
        const newSold = (prod.soldLiters || 0) + soldItem.liters;
        return {
          ...prod,
          stockLiters: Number(newStock.toFixed(2)),
          soldLiters: Number(newSold.toFixed(2)),
        };
      }
      return prod;
    });

    // B. Add to sales list
    const updatedSales = [newSale, ...sales];

    // C. If credit sale, record under customer debts (ዕዳ)
    let updatedDebts = debts;
    if (newSale.paymentMethod === "Credit") {
      const debtRecord = {
        id: `debt-${Date.now().toString().slice(-6)}`,
        customerName: newSale.customerName,
        customerPhone: newSale.customerPhone,
        saleId: newSale.id,
        date: newSale.date,
        totalAmount: newSale.total,
        paidAmount: 0,
        remainingBalance: newSale.total,
        dueDate: newSale.creditDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        status: "Unpaid",
        notes: `Credit sale for ${newSale.totalLiters.toFixed(1)}L of soap.`,
      };
      updatedDebts = [debtRecord, ...debts];
      setDebts(updatedDebts);
      saveToStorage("DEBTS", updatedDebts);
    }

    // Save states
    setProducts(updatedProducts);
    setSales(updatedSales);
    saveToStorage("PRODUCTS", updatedProducts);
    saveToStorage("SALES", updatedSales);

    // Open receipt modal
    setActiveReceipt(newSale);
    showToast(`Sale recorded successfully! Total: ${newSale.total.toFixed(2)} ${config.currency}`);
  };

  // 1b. Void Sale Handler (Restores product liters to tanks)
  const handleVoidSale = (saleToVoid) => {
    // A. Re-add stock back to tanks
    const updatedProducts = products.map((prod) => {
      const soldItem = saleToVoid.items?.find((item) => item.productId === prod.id);
      if (soldItem) {
        const restoredStock = Number((prod.stockLiters + (soldItem.liters || 0)).toFixed(2));
        const restoredSold = Number(Math.max(0, (prod.soldLiters || 0) - (soldItem.liters || 0)).toFixed(2));
        return {
          ...prod,
          stockLiters: restoredStock,
          soldLiters: restoredSold,
        };
      }
      return prod;
    });

    // B. Filter from sales
    const updatedSales = sales.filter((s) => s.id !== saleToVoid.id);

    // C. If credit sale, cancel debt record
    if (saleToVoid.paymentMethod === "Credit") {
      const updatedDebts = debts.filter((d) => d.saleId !== saleToVoid.id);
      setDebts(updatedDebts);
      saveToStorage("DEBTS", updatedDebts);
    }

    setProducts(updatedProducts);
    setSales(updatedSales);
    saveToStorage("PRODUCTS", updatedProducts);
    saveToStorage("SALES", updatedSales);

    showToast(`Receipt ${saleToVoid.id} voided. Stock returned to tanks!`, "info");
  };

  // 2. Restock Liters Handler
  const handleRestockLiters = (productId, litersToAdd, batchCost) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stockLiters: Number((p.stockLiters + litersToAdd).toFixed(2)),
          costPerLiter: batchCost || p.costPerLiter,
        };
      }
      return p;
    });
    setProducts(updated);
    saveToStorage("PRODUCTS", updated);
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
    const updatedDebts = debts.map((d) => {
      if (d.id === debtId) {
        const newPaid = Number((d.paidAmount + amount).toFixed(2));
        const newBalance = Math.max(0, Number((d.totalAmount - newPaid).toFixed(2)));
        const newStatus = newBalance <= 0 ? "Paid" : "Partially Paid";
        return {
          ...d,
          paidAmount: newPaid,
          remainingBalance: newBalance,
          status: newStatus,
          notes: note ? `${d.notes || ""} [Repaid ${amount} via ${method}: ${note}]` : d.notes,
        };
      }
      return d;
    });

    setDebts(updatedDebts);
    saveToStorage("DEBTS", updatedDebts);
    showToast(`Recorded repayment of ${amount.toFixed(2)} ${config.currency}!`);
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
  };

  if (!config) {
    return (
      <div className="app-loading-screen">
        <div className="bubble-anim" style={{ fontSize: "48px" }}>
          🫧
        </div>
        <h2>Loading Sukie Shop...</h2>
      </div>
    );
  }

  const activeDebtCount = debts.filter((d) => d.status !== "Paid").length;
  const lowStockCount = products.filter(
    (p) => p.stockLiters <= (p.minStockAlert || 40)
  ).length;

  return (
    <div className="app-root-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification animate-pop toast-${toast.type}`}>
          <span className="toast-icon">✨</span>
          <span className="toast-text">{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        config={config}
        sales={sales}
        debts={debts}
        products={products}
        onNewSaleClick={() => setActiveTab("pos")}
        activeTab={activeTab}
      />

      {/* Main Content Layout with Sidebar */}
      <div className="app-body-layout">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          debtCount={activeDebtCount}
          lowStockCount={lowStockCount}
        />

        <main className="app-main-viewport">
          {activeTab === "pos" && (
            <POSView
              products={products}
              sales={sales}
              debts={debts}
              currency={config.currency}
              onCompleteSale={handleCompleteSale}
              onRestockLiters={handleRestockLiters}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryView
              products={products}
              currency={config.currency}
              onRestockLiters={handleRestockLiters}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === "sales" && (
            <SalesView
              sales={sales}
              currency={config.currency}
              onSelectReceipt={(sale) => setActiveReceipt(sale)}
              onVoidSale={handleVoidSale}
            />
          )}

          {activeTab === "debts" && (
            <DebtView
              debts={debts}
              currency={config.currency}
              onRecordDebtPayment={handleRecordDebtPayment}
              onAddManualDebt={handleAddManualDebt}
              onDeleteDebt={handleDeleteDebt}
            />
          )}

          {activeTab === "expenses" && (
            <ExpensesView
              expenses={expenses}
              currency={config.currency}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView
              sales={sales}
              expenses={expenses}
              products={products}
              debts={debts}
              currency={config.currency}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              config={config}
              onSaveConfig={handleSaveConfig}
              onResetDefaults={handleResetDefaults}
              onClearTransactionsOnly={handleClearTransactionsOnly}
              onImportData={handleImportData}
            />
          )}
        </main>
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          config={config}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
}
