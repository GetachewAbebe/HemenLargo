import React, { lazy, Suspense } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import POSView from "./components/POSView";
import InventoryView from "./components/InventoryView";
import ReceiptModal from "./components/ReceiptModal";
import Toast from "./components/common/Toast";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AppProvider, useApp } from "./context";
import "./App.css";

// Lazy-loaded secondary views for code-splitting and instant initial load
const SalesView = lazy(() => import("./components/SalesView"));
const ExpensesView = lazy(() => import("./components/ExpensesView"));
const AnalyticsView = lazy(() => import("./components/AnalyticsView"));
const SettingsView = lazy(() => import("./components/SettingsView"));

function ViewLoader() {
  return (
    <div className="view-content-wrapper animate-fade" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "350px", color: "var(--primary)" }}>
      <div className="bubble-anim" style={{ fontSize: "36px", marginBottom: "8px" }}>🫧</div>
      <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#64748b" }}>Loading View...</span>
    </div>
  );
}

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
          <Suspense fallback={<ViewLoader />}>
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
          </Suspense>
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
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
