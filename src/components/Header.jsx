import React, { useEffect, useMemo } from "react";
import { soundFX } from "../utils/audio";
import { useApp } from "../context";

const SHORTCUT_TAB_MAP = {
  "1": "dashboard",
  "2": "pos",
  "3": "inventory",
  "4": "sales",
  "5": "expenses",
  "6": "debts",
};

export default function Header({
  config = {},
  products = [],
  currentUser = null,
  onOpenProfile = null,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}) {
  const context = useApp();
  const activeTab = propActiveTab || context.activeTab;
  const setActiveTab = propSetActiveTab || context.setActiveTab;
  const unpaidDebtsCount = context.unpaidDebtsCount || 0;

  // Global hotkey tab switching (1-6)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT" ||
        e.isContentEditable
      ) {
        return;
      }

      const targetTab = SHORTCUT_TAB_MAP[e.key];
      if (targetTab && targetTab !== activeTab) {
        soundFX.playPop();
        setActiveTab(targetTab);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, setActiveTab]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockLiters <= (p.minStockAlert || 40)).length;
  }, [products]);

  const displayName = currentUser?.fullName || config.ownerName || "Cashier";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "pos", label: "POS Register" },
    {
      id: "inventory",
      label: "Tanks & Stock",
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: "amber",
    },
    { id: "sales", label: "Sales Records" },
    { id: "expenses", label: "Expenses" },
    {
      id: "debts",
      label: "Debts / ዕዳ",
      badge: unpaidDebtsCount > 0 ? `${unpaidDebtsCount} due` : null,
      badgeColor: "rose",
    },
  ];

  return (
    <header className="no-print top-header-v2">
      <div className="header-single-row-container">
        {/* Center: Text-Only Segmented Navigation Menu (5 Core Operational Tabs) */}
        <nav className="header-segmented-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-segment-btn ${isActive ? "segment-active" : ""}`}
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab(item.id);
                }}
                title={`Switch to ${item.label}`}
              >
                <span className="segment-label">{item.label}</span>
                {item.badge && (
                  <span className={`segment-badge badge-${item.badgeColor || "amber"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Cashier Identity & Profile Trigger */}
        <div className="header-nav-stats">
          <button
            type="button"
            className="header-cashier-pill header-cashier-btn"
            onClick={() => {
              soundFX.playPop();
              if (onOpenProfile) onOpenProfile();
            }}
            title="Open Cashier Profile & Store Settings"
          >
            <span className="cashier-avatar-badge">{initials}</span>
            <span className="cashier-dot-online"></span>
            <span className="cashier-name-text">{displayName}</span>
            <span className="cashier-settings-gear">⚙️</span>
          </button>
        </div>
      </div>
    </header>
  );
}
