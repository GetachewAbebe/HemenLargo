import React, { useState } from "react";
import { ShoppingCart, Receipt } from "lucide-react";
import { soundFX } from "../utils/audio";
import POSView from "./POSView";
import SalesView from "./SalesView";

export default function SalesHubView({
  initialSubView = "register",
  sales = [],
  config = {},
  currency = "ETB",
  onSelectReceipt,
  onVoidSale,
}) {
  const [subView, setSubView] = useState(initialSubView); // 'register' | 'records'

  const handleSwitchTab = (tab) => {
    soundFX.playPop();
    setSubView(tab);
  };

  return (
    <div className="view-content-wrapper sales-hub-wrapper animate-fade">
      {/* Top Segmented Sub-Navbar: POS Register vs Sales Records */}
      <div className="sales-hub-topbar no-print">
        <div className="sales-hub-switcher-card">
          <div className="sales-hub-tabs">
            <button
              type="button"
              className={`sales-hub-tab-btn ${subView === "register" ? "active" : ""}`}
              onClick={() => handleSwitchTab("register")}
            >
              <ShoppingCart size={16} />
              <span>POS Register (ሽያጭ መመዝገቢያ)</span>
            </button>
            <button
              type="button"
              className={`sales-hub-tab-btn ${subView === "records" ? "active" : ""}`}
              onClick={() => handleSwitchTab("records")}
            >
              <Receipt size={16} />
              <span>Sales Records & History (የሽያጭ መዝገብ)</span>
              {sales && sales.length > 0 && (
                <span className="sales-hub-pill-badge">{sales.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sub-View */}
      <div className="sales-hub-view-container">
        {subView === "register" ? (
          <POSView
            onNavigateToRecords={() => handleSwitchTab("records")}
          />
        ) : (
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
