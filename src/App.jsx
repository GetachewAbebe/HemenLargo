import React, { useState, lazy, Suspense } from "react";
import Header from "./components/Header";
import POSView from "./components/POSView";
import InventoryView from "./components/InventoryView";
import DashboardView from "./components/DashboardView";
import ReceiptModal from "./components/ReceiptModal";
import Footer from "./components/Footer";
import AuthScreen from "./components/auth/AuthScreen";
import ProfileModal from "./components/profile/ProfileModal";
import Toast from "./components/common/Toast";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AppProvider, useApp } from "./context";
import { getActiveSession, logoutUser } from "./services/authService";
import "./App.css";

// Lazy-loaded secondary views for code-splitting and instant initial load
const SalesView = lazy(() => import("./components/SalesView"));
const ExpensesView = lazy(() => import("./components/ExpensesView"));

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

  const [currentUser, setCurrentUser] = useState(() => getActiveSession());
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // 1. If not authenticated, require Login or Registration to access POS
  if (!currentUser) {
    return (
      <AuthScreen
        initialShopName={config.shopName}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.shopName && user.shopName !== config.shopName) {
            handleSaveConfig({
              ...config,
              shopName: user.shopName,
              ownerName: user.fullName,
            });
          }
        }}
      />
    );
  }

  return (
    <div className="app-root-container">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* Top Header with 5 Operational Tabs & Cashier Profile Trigger */}
      <Header
        config={config}
        sales={sales}
        products={products}
        currentUser={currentUser}
        onOpenProfile={() => setShowProfileModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Full-Width Content Viewport */}
      <div className="app-body-layout">
        <main className="app-main-viewport">
          <Suspense fallback={<ViewLoader />}>
            {activeTab === "dashboard" && <DashboardView />}
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
          </Suspense>
        </main>
      </div>

      {/* State-of-the-Art Executive Footer */}
      <Footer config={{ ...config, ownerName: currentUser?.fullName || config.ownerName }} />

      {/* Cashier Profile & Store Settings Modal */}
      {showProfileModal && (
        <ProfileModal
          currentUser={currentUser}
          config={config}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            handleSaveConfig({ ...config, ownerName: updated.fullName });
          }}
          onLogout={() => {
            logoutUser();
            setCurrentUser(null);
            setShowProfileModal(false);
          }}
          onClose={() => setShowProfileModal(false)}
          onSaveConfig={handleSaveConfig}
          onResetDefaults={handleResetDefaults}
          onClearTransactionsOnly={handleClearTransactionsOnly}
          onImportData={handleImportData}
        />
      )}

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
