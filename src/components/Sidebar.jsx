import React, { useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  TrendingDown,
  BarChart3,
  Settings,
} from "lucide-react";
import { soundFX } from "../utils/audio";

const SHORTCUT_TAB_MAP = {
  "1": "dashboard",
  "2": "pos",
  "3": "inventory",
  "4": "sales",
  "5": "expenses",
  "6": "analytics",
  "7": "settings",
};

export default function Sidebar({ activeTab, setActiveTab, lowStockCount = 0 }) {
  const navItems = [
    {
      id: "dashboard",
      shortcut: "1",
      label: "Store Dashboard",
      sublabel: "Overview & Live Tanks",
      icon: LayoutDashboard,
    },
    {
      id: "pos",
      shortcut: "2",
      label: "Point of Sale (POS)",
      sublabel: "Cashier & Refill Counter",
      icon: ShoppingCart,
    },
    {
      id: "inventory",
      shortcut: "3",
      label: "Largo & Barikina Tanks",
      sublabel: "Bulk Stock & Refills",
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: "amber",
    },
    {
      id: "sales",
      shortcut: "4",
      label: "Sales Records",
      sublabel: "Receipts & History",
      icon: Receipt,
    },
    {
      id: "expenses",
      shortcut: "5",
      label: "Shop Expenses",
      sublabel: "Chemicals, Rent & Bills",
      icon: TrendingDown,
    },
    {
      id: "analytics",
      shortcut: "6",
      label: "Profits & Analytics",
      sublabel: "Net Income & Margins",
      icon: BarChart3,
    },
    {
      id: "settings",
      shortcut: "7",
      label: "Store Settings",
      sublabel: "Profile & Backups",
      icon: Settings,
    },
  ];

  // Hotkey tab switching (1-6)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when user is typing in an input or textarea
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

  return (
    <aside className="no-print app-sidebar-v2">
      <nav className="sidebar-nav-v2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-link ${isActive ? "nav-link-active" : ""}`}
              onClick={() => {
                soundFX.playPop();
                setActiveTab(item.id);
              }}
              title={`Switch to ${item.label} (Press [${item.shortcut}])`}
            >
              <div className="nav-icon-container">
                <Icon size={19} />
              </div>
              <div className="nav-label-container">
                <span className="nav-title-text">{item.label}</span>
                <span className="nav-sub-text">{item.sublabel}</span>
              </div>
              <div className="nav-actions-badge-row">
                {item.badge && (
                  <span className={`nav-pill-badge pill-${item.badgeColor || "teal"}`}>
                    {item.badge}
                  </span>
                )}
                <span className="nav-shortcut-key">{item.shortcut}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
