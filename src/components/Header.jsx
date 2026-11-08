import React, { useEffect, useMemo } from "react";
import {
  HandCoins,
  LayoutDashboard,
  PackageOpen,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import { soundFX } from "../utils/audio";
import { useApp } from "../context";

const SHORTCUT_TAB_MAP = {
  "1": "dashboard",
  "2": "sales",
  "3": "inventory",
  "4": "expenses",
  "5": "debts",
};

export default function Header({
  config = {},
  products = [],
  currentUser = null,
  onOpenProfile = null,
  onOpenQuickSale = null,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}) {
  const context = useApp();
  const activeTab = propActiveTab || context.activeTab;
  const setActiveTab = propSetActiveTab || context.setActiveTab;

  // Global hotkey tab switching (1-5) & Quick Sale ('s' or 'q')
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

      if ((e.key === "s" || e.key === "S" || e.key === "q" || e.key === "Q") && onOpenQuickSale) {
        e.preventDefault();
        soundFX.playPop();
        onOpenQuickSale();
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
  }, [activeTab, setActiveTab, onOpenQuickSale]);

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
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    {
      id: "inventory",
      label: "Inventory",
      icon: PackageOpen,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: "amber",
    },
    { id: "expenses", label: "Expenses", icon: ReceiptText },
    { id: "debts", label: "Customer credit", icon: HandCoins },
  ];

  return (
    <header className="no-print top-header-v2">
      <div className="header-single-row-container">
        {/* Left: Brand Identity Emblem */}
        <div className="header-brand-box">
          <button
            type="button"
            className="header-brand-btn"
            onClick={() => {
              soundFX.playPop();
              setActiveTab("dashboard");
            }}
            title="Sukie - Operations Dashboard"
          >
            <div className="brand-logo-gem">
              <span className="brand-gem-text">S</span>
            </div>
            <div className="brand-text-col">
              <div className="brand-name-row">
                <span className="brand-name-en">SUKIE</span>
                <span className="brand-name-am">ሱቄ</span>
              </div>
              <span className="brand-tagline-text">{config.shopName || "Liquid Soap POS"}</span>
            </div>
          </button>
        </div>

        <nav className="header-segmented-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              item.id === "sales"
                ? activeTab === "sales" || activeTab === "pos"
                : activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-segment-btn ${isActive ? "segment-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab(item.id);
                }}
                title={item.label}
              >
                <Icon className="segment-icon" size={17} strokeWidth={1.9} aria-hidden="true" />
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

        {/* Right: Quick Sale Action & Cashier Identity */}
        <div className="header-nav-stats">
          {onOpenQuickSale && (
            <button
              type="button"
              className="header-quick-sale-btn"
              onClick={() => {
                soundFX.playPop();
                onOpenQuickSale();
              }}
              title="Quick Sale Registration (Shortcut: S or Q)"
            >
              <span>Quick Sale</span>
            </button>
          )}

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
          </button>
        </div>
      </div>
    </header>
  );
}
