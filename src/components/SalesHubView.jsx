import React, { useState } from "react";
import { Zap, ShoppingCart, Receipt } from "lucide-react";
import { soundFX } from "../utils/audio";
import { useApp } from "../context";
import POSView from "./POSView";
import SalesView from "./SalesView";
import SimpleSaleRegister from "./pos/SimpleSaleRegister";

export default function SalesHubView({
  initialSubView = "simple",
  sales: propSales,
  config: propConfig,
  currency: propCurrency,
  onSelectReceipt: propOnSelectReceipt,
  onVoidSale: propOnVoidSale,
}) {
  const context = useApp();
  const sales = propSales ?? context.sales ?? [];
  const products = context.products ?? [];
  const config = propConfig ?? context.config ?? {};
  const currency = propCurrency ?? config.currency ?? "ETB";
  const onSelectReceipt = propOnSelectReceipt ?? context.setActiveReceipt;
  const onVoidSale = propOnVoidSale ?? context.handleVoidSale;
  const onCompleteSale = context.handleCompleteSale;

  // Support 'simple' | 'counter' | 'records' (also accept 'register' mapping to 'simple')
  const [subView, setSubView] = useState(() => {
    if (initialSubView === "records") return "records";
    if (initialSubView === "counter") return "counter";
    return "simple";
  });

  const handleSwitchTab = (tab) => {
    soundFX.playPop();
    setSubView(tab);
  };

  return (
    <div className="view-content-wrapper sales-hub-wrapper animate-fade">
      {/* Top Segmented Sub-Navbar: 3 Intuitive Sub-Views */}
      <div className="sales-hub-topbar no-print">
        <div className="sales-hub-switcher-card">
          <div className="sales-hub-tabs">
            <button
              type="button"
              className={`sales-hub-tab-btn ${subView === "simple" ? "active" : ""}`}
              onClick={() => handleSwitchTab("simple")}
              title="Quick 3-step sale registration"
            >
              <Zap size={16} className="text-amber" />
              <span>Quick Register (ቀላል ሽያጭ)</span>
            </button>

            <button
              type="button"
              className={`sales-hub-tab-btn ${subView === "counter" ? "active" : ""}`}
              onClick={() => handleSwitchTab("counter")}
              title="Full dispenser station with jerrycans & containers"
            >
              <ShoppingCart size={16} />
              <span>Counter Dispenser (ሙሉ ካውንተር)</span>
            </button>

            <button
              type="button"
              className={`sales-hub-tab-btn ${subView === "records" ? "active" : ""}`}
              onClick={() => handleSwitchTab("records")}
              title="Past sales history and printed receipts"
            >
              <Receipt size={16} />
              <span>Sales Records (የሽያጭ መዝገብ)</span>
              {sales && sales.length > 0 && (
                <span className="sales-hub-pill-badge">{sales.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sub-View */}
      <div className="sales-hub-view-container">
        {subView === "simple" && (
          <div className="animate-fade">
            <SimpleSaleRegister
              products={products}
              currency={currency}
              sales={sales}
              onCompleteSale={onCompleteSale}
            />
          </div>
        )}

        {subView === "counter" && (
          <POSView
            products={products}
            sales={sales}
            currency={currency}
            onCompleteSale={onCompleteSale}
            onNavigateToRecords={() => handleSwitchTab("records")}
          />
        )}

        {subView === "records" && (
          <SalesView
            sales={sales}
            config={config}
            currency={currency}
            onSelectReceipt={onSelectReceipt}
            onVoidSale={onVoidSale}
            onNavigateToRegister={() => handleSwitchTab("simple")}
          />
        )}
      </div>
    </div>
  );
}
