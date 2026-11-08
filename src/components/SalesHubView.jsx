import React, { useState } from "react";
import { soundFX } from "../utils/audio";
import { useApp } from "../context";
import POSView from "./POSView";
import SalesView from "./SalesView";

export default function SalesHubView({
  initialSubView = "register",
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

  const [subView, setSubView] = useState(() => {
    if (initialSubView === "records") return "records";
    return "register";
  });

  const handleSwitchTab = (tab) => {
    soundFX.playPop();
    setSubView(tab);
  };

  return (
    <div className="view-content-wrapper sales-hub-wrapper animate-fade">
      {/* One sales register and a separate history view */}
      <div className="sales-hub-topbar no-print">
        <div className="sales-hub-switcher-card">
          <div className="sales-hub-tabs">
            <button
              type="button"
              className={`sales-hub-tab-btn ${subView === "register" ? "active" : ""}`}
              onClick={() => handleSwitchTab("register")}
              title="Register a sale for any product"
            >
              <span>New Sale (አዲስ ሽያጭ)</span>
            </button>

            <button
              type="button"
              className={`sales-hub-tab-btn ${subView === "records" ? "active" : ""}`}
              onClick={() => handleSwitchTab("records")}
              title="Past sales history and printed receipts"
            >
              <span>Sales History (የሽያጭ መዝገብ)</span>
              {sales && sales.length > 0 && (
                <span className="sales-hub-pill-badge">{sales.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sub-View */}
      <div className="sales-hub-view-container">
        {subView === "register" && (
          <POSView
            products={products}
            sales={sales}
            currency={currency}
            onCompleteSale={onCompleteSale}
          />
        )}

        {subView === "records" && (
          <SalesView
            sales={sales}
            config={config}
            currency={currency}
            onSelectReceipt={onSelectReceipt}
            onVoidSale={onVoidSale}
            onNavigateToRegister={() => handleSwitchTab("register")}
          />
        )}
      </div>
    </div>
  );
}
