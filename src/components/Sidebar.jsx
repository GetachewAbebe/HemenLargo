import React from "react";
import {
  ShoppingCart,
  Package,
  Receipt,
  Users,
  TrendingDown,
  BarChart3,
  Settings,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, debtCount = 0, lowStockCount = 0 }) {
  const navItems = [
    {
      id: "pos",
      label: "Point of Sale (POS)",
      sublabel: "Cashier & Refill Counter",
      icon: ShoppingCart,
    },
    {
      id: "inventory",
      label: "Largo & Barikina Tanks",
      sublabel: "Bulk Stock & Refills",
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: "amber",
    },
    {
      id: "sales",
      label: "Sales Records",
      sublabel: "Receipts & History",
      icon: Receipt,
    },
    {
      id: "debts",
      label: "Customer Debts (ዕዳ)",
      sublabel: "Debts & Repayments",
      icon: Users,
      badge: debtCount > 0 ? `${debtCount}` : null,
      badgeColor: "rose",
    },
    {
      id: "expenses",
      label: "Shop Expenses",
      sublabel: "Chemicals, Rent & Bills",
      icon: TrendingDown,
    },
    {
      id: "analytics",
      label: "Profits & Analytics",
      sublabel: "Net Income & Margins",
      icon: BarChart3,
    },
    {
      id: "settings",
      label: "Store Settings",
      sublabel: "Profile & Backups",
      icon: Settings,
    },
  ];

  return (
    <aside className="no-print app-sidebar-v2">
      <nav className="sidebar-nav-v2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-link ${isActive ? "nav-link-active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-icon-container">
                <Icon size={19} />
              </div>
              <div className="nav-label-container">
                <span className="nav-title-text">{item.label}</span>
                <span className="nav-sub-text">{item.sublabel}</span>
              </div>
              {item.badge && (
                <span className={`nav-pill-badge pill-${item.badgeColor || "teal"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom-block">
        <div className="sidebar-store-photo-card">
          <img src="./shop_hero.jpg" alt="Sukie Clean Store" className="sidebar-store-img" />
          <div className="sidebar-store-caption">
            <span>Sukie Refill Station</span>
          </div>
        </div>

        <div className="sidebar-seller-tip">
          <div className="seller-tip-header">
            <span className="tip-pulse-dot"></span>
            <strong>Seller Tip</strong>
          </div>
          <p className="seller-tip-text">
            Selling 20L jerrycans to cafes & car washes provides the fastest daily cash flow.
          </p>
        </div>
      </div>
    </aside>
  );
}
