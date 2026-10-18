import React from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import POSView from "./components/POSView";
import InventoryView from "./components/InventoryView";
import SalesView from "./components/SalesView";
import ExpensesView from "./components/ExpensesView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import ReceiptModal from "./components/ReceiptModal";
import Toast from "./components/common/Toast";
import { AppProvider, useApp } from "./context";
import "./App.css";

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    config,
    sales,
    products,
    expenses,
    lowStockCount,
    toast,
    activeReceipt,
    setActiveReceipt,
    handleVoidSale,
    handleAddExpense,
    handleDeleteExpense,
    handleSaveConfig,
    handleResetDefaults,
    handleClearTransactionsOnly,
    handleImportData,
  } = useApp();

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

  return (
    <div className="app-root-container">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* Top Header */}
      <Header
        config={config}
        sales={sales}
        products={products}
        onNewSaleClick={() => setActiveTab("pos")}
        activeTab={activeTab}
      />

      {/* Main Content Layout with Sidebar */}
      <div className="app-body-layout">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lowStockCount={lowStockCount}
        />

        <main className="app-main-viewport">
          {activeTab === "pos" && <POSView />}
          {activeTab === "inventory" && <InventoryView />}
          {activeTab === "sales" && (
            <SalesView
              sales={sales}
              config={config}
              currency={config.currency}
              onSelectReceipt={(sale) => setActiveReceipt(sale)}
              onVoidSale={handleVoidSale}
            />
          )}
          {activeTab === "expenses" && (
            <ExpensesView
              expenses={expenses}
              config={config}
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

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
