import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import Header from "./components/Header";
import InventoryView from "./components/InventoryView";
import DashboardView from "./components/DashboardView";
import ReceiptModal from "./components/ReceiptModal";
import Footer from "./components/Footer";
import AuthScreen from "./components/auth/AuthScreen";
import ProfileModal from "./components/profile/ProfileModal";
import Toast from "./components/common/Toast";
import ErrorBoundary from "./components/common/ErrorBoundary";
import QuickSaleModal from "./components/common/QuickSaleModal";
import { AppProvider, useApp } from "./context";
import {
  cacheShopId,
  ensureUserShop,
  getCachedShopId,
  getActiveSession,
  logoutUser,
  subscribeToAuthChanges,
} from "./services/authService";
import SalesHubView from "./components/SalesHubView";
import "./App.css";

// Lazy-loaded secondary views for code-splitting and instant initial load
const ExpensesView = lazy(() => import("./components/ExpensesView"));

function ViewLoader() {
  return (
    <div className="view-content-wrapper animate-fade" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "350px", color: "var(--primary)" }}>
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
    activateShop,
    deactivateShop,
    showToast,
  } = useApp();

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isGlobalQuickSaleOpen, setIsGlobalQuickSaleOpen] = useState(false);
  const activationTasks = useRef(new Map());
  const activeAuthUserId = useRef(null);

  const { handleCompleteSale } = useApp();

  useEffect(() => {
    let isMounted = true;

    const acceptUser = (user) => {
      if (!user) {
        activeAuthUserId.current = null;
        setCurrentUser(null);
        setAuthError("");
        deactivateShop();
        setAuthLoading(false);
        return Promise.resolve();
      }

      if (activeAuthUserId.current === user.id) return Promise.resolve();
      const existingTask = activationTasks.current.get(user.id);
      if (existingTask) return existingTask;

      setAuthLoading(true);
      if (activeAuthUserId.current !== user.id) {
        setCurrentUser(null);
        deactivateShop();
      }

      const task = ensureUserShop(user.shopName)
        .then((shopId) => {
          if (!isMounted) return;
          cacheShopId(user.id, shopId);
          activateShop(shopId);
          activeAuthUserId.current = user.id;
          setCurrentUser({ ...user, shopId });
          setAuthError("");
          setAuthLoading(false);
        })
        .catch((error) => {
          if (!isMounted) return;
          console.error("Could not open the authenticated shop:", error);
          const cachedShopId = getCachedShopId(user.id);
          if (cachedShopId && typeof navigator !== "undefined" && !navigator.onLine) {
            activateShop(cachedShopId);
            activeAuthUserId.current = user.id;
            setCurrentUser({ ...user, shopId: cachedShopId });
            setAuthError("Offline mode. Changes are saved on this device and will sync when reconnected.");
            showToast("Offline mode: changes are saved on this device and will sync when reconnected.", "warning");
            setAuthLoading(false);
            return;
          }
          activeAuthUserId.current = null;
          setCurrentUser(null);
          deactivateShop();
          setAuthError(`Could not load this shop: ${error.message}. Check the Supabase schema setup.`);
          setAuthLoading(false);
        })
        .finally(() => activationTasks.current.delete(user.id));

      activationTasks.current.set(user.id, task);
      return task;
    };

    const unsubscribe = subscribeToAuthChanges((user) => {
      if (isMounted) void acceptUser(user);
    });

    getActiveSession()
      .then((user) => {
        if (isMounted) return acceptUser(user);
        return undefined;
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Could not restore the Supabase session:", error);
        setAuthError(`Could not restore your sign-in: ${error.message}`);
        setAuthLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activateShop, deactivateShop, showToast]);

  if (!config) {
    return (
      <div className="app-loading-screen">
        <h2>Loading Sukie Shop...</h2>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="app-loading-screen">
        <h2>Checking secure sign-in...</h2>
      </div>
    );
  }

  // 1. If not authenticated, require Login or Registration to access POS
  if (!currentUser) {
    return (
      <AuthScreen
        initialShopName={config.shopName}
        authError={authError}
        onAuthSuccess={() => setAuthLoading(true)}
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
        onOpenQuickSale={() => setIsGlobalQuickSaleOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Full-Width Content Viewport */}
      <div className="app-body-layout">
        <main className="app-main-viewport">
          <Suspense fallback={<ViewLoader />}>
            {activeTab === "dashboard" && <DashboardView />}
            {(activeTab === "sales" || activeTab === "pos") && (
              <SalesHubView
                sales={sales}
                config={config}
                currency={config.currency}
                onSelectReceipt={(sale) => setActiveReceipt(sale)}
                onVoidSale={handleVoidSale}
              />
            )}
            {activeTab === "inventory" && <InventoryView />}
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
          onLogout={async () => {
            try {
              await logoutUser();
              setShowProfileModal(false);
            } catch (error) {
              console.error("Could not sign out:", error);
              showToast(`Could not sign out: ${error.message}`, "warning");
            }
          }}
          onClose={() => setShowProfileModal(false)}
          onSaveConfig={handleSaveConfig}
          onResetDefaults={handleResetDefaults}
          onClearTransactionsOnly={handleClearTransactionsOnly}
          onImportData={handleImportData}
        />
      )}

      {/* Global Quick Sales Modal */}
      <QuickSaleModal
        isOpen={isGlobalQuickSaleOpen}
        onClose={() => setIsGlobalQuickSaleOpen(false)}
        products={products}
        sales={sales}
        currency={config.currency}
        onCompleteSale={handleCompleteSale}
      />

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
