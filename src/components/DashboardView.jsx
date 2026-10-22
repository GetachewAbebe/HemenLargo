import React, { useMemo, useState } from "react";
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingDown,
  DollarSign,
  Droplets,
  CalendarClock,
  ArrowUpRight,
  Plus,
  Zap,
  Eye,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Layers,
} from "lucide-react";
import { useApp } from "../context";
import {
  formatEthiopianDate,
  formatEthiopianTime,
  isSameEthiopianDay,
} from "../utils/ethiopianDate";
import { soundFX } from "../utils/audio";
import AnalyticsView from "./AnalyticsView";
import CashDrawerWidget from "./dashboard/CashDrawerWidget";
import BatchProductionWidget from "./dashboard/BatchProductionWidget";

export default function DashboardView(props) {
  const context = useApp();
  const products = props.products ?? context.products;
  const sales = props.sales ?? context.sales;
  const expenses = props.expenses ?? context.expenses;
  const config = props.config ?? context.config;
  const setActiveTab = props.setActiveTab ?? context.setActiveTab;
  const onSelectReceipt = props.onSelectReceipt ?? context.setActiveReceipt;
  const onRestockLiters = props.onRestockLiters ?? context.handleRestockLiters;
  const onAddExpense = props.onAddExpense ?? context.handleAddExpense;
  const currency = config?.currency || "ETB";

  const [todayDate] = React.useState(() => new Date());
  const [dashboardSubView, setDashboardSubView] = useState("operations"); // 'operations' | 'analytics'

  // Greeting based on current hour
  const hour = todayDate.getHours();
  let greetingAm = "እንደምን አደሩ";
  let greetingEmoji = "☀️";
  if (hour >= 12 && hour < 17) {
    greetingAm = "እንደምን ዋሉ";
    greetingEmoji = "🌤️";
  } else if (hour >= 17 && hour < 23) {
    greetingAm = "እንደምን አመሹ";
    greetingEmoji = "🌙";
  } else if (hour >= 23 || hour < 6) {
    greetingAm = "ሰላም ቆዩ";
    greetingEmoji = "✨";
  }

  const cashierName = config.ownerName || "Cashier";
  const ethDateFull = formatEthiopianDate(todayDate, "full");

  // Filter sales that happened today
  const todaySales = useMemo(() => {
    return sales.filter((s) => isSameEthiopianDay(s.date, todayDate));
  }, [sales, todayDate]);

  // Filter expenses that happened today
  const todayExpenses = useMemo(() => {
    return expenses.filter((e) => isSameEthiopianDay(e.date, todayDate));
  }, [expenses, todayDate]);

  const todayRevenue = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + (s.total || 0), 0);
  }, [todaySales]);

  const todayProfit = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + (s.profit || 0), 0);
  }, [todaySales]);

  const todayLiters = useMemo(() => {
    return todaySales.reduce((acc, s) => {
      return acc + (s.items?.reduce((iAcc, item) => iAcc + (item.liters || 0), 0) || 0);
    }, 0);
  }, [todaySales]);

  // Payment Breakdown for today
  const todayCash = todaySales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((acc, s) => acc + (s.total || 0), 0);

  const todayDigital = todaySales
    .filter((s) => s.paymentMethod === "Telebirr" || s.paymentMethod === "CBE Birr")
    .reduce((acc, s) => acc + (s.total || 0), 0);

  // Today's Expense Metrics
  const todayExpenseTotal = useMemo(() => {
    return todayExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [todayExpenses]);

  const todayNetIncome = todayRevenue - todayExpenseTotal;

  // Combined Recent Activity Stream (last 6 transactions)
  const recentActivities = useMemo(() => {
    const list = [
      ...sales.map((s) => ({ ...s, activityType: "sale" })),
      ...expenses.map((e) => ({ ...e, activityType: "expense" })),
    ];
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list.slice(0, 6);
  }, [sales, expenses]);

  const handleNav = (tabId) => {
    soundFX.playPop();
    setActiveTab(tabId);
  };

  const dailyTarget = 5000;
  const targetPercent = Math.min(100, Math.round((todayRevenue / dailyTarget) * 100));

  return (
    <div className="dashboard-layout animate-fade">
      {/* 1. Executive Command Header */}
      <div className="dashboard-hero-banner">
        <div className="hero-left-col">
          <div className="hero-greeting-line">
            <span className="hero-greeting-emoji">{greetingEmoji}</span>
            <div className="hero-titles-wrap">
              <h2 className="hero-greeting-title">
                {greetingAm}፣ {cashierName}!
              </h2>
              <span className="hero-subtitle">
                {config.shopName || "Sukie"} Operations Center • የሱቅ አጠቃላይ ማጠቃለያ ዳሽቦርድ
              </span>
            </div>
          </div>

          <div className="hero-meta-row">
            <span className="hero-date-pill">
              <span className="pill-dot-green"></span>
              <span>ዛሬ:</span>
              <strong>{ethDateFull}</strong>
            </span>
            <span className="hero-status-pill">
              <CheckCircle2 size={13} className="text-emerald" />
              <span>Shift Active • Counter Open</span>
            </span>
          </div>
        </div>

        <div className="hero-right-actions">
          <button
            type="button"
            className="btn-hero-primary"
            onClick={() => handleNav("pos")}
          >
            <Plus size={18} />
            <span>Open POS Counter (ሽያጭ ጀምር)</span>
          </button>

          <button
            type="button"
            className="btn-hero-secondary"
            onClick={() => handleNav("inventory")}
          >
            <Package size={17} />
            <span>Tanks & Stock (ታንከሮች)</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Dashboard Sub-View Switcher (Operations vs Reports) */}
      <div className="dashboard-subview-nav">
        <button
          type="button"
          className={`subview-nav-pill ${dashboardSubView === "operations" ? "active" : ""}`}
          onClick={() => {
            soundFX.playPop();
            setDashboardSubView("operations");
          }}
        >
          <Layers size={14} />
          <span>Live Operations & Tanks (ቀጥታ ቁጥጥር)</span>
        </button>

        <button
          type="button"
          className={`subview-nav-pill ${dashboardSubView === "analytics" ? "active" : ""}`}
          onClick={() => {
            soundFX.playPop();
            setDashboardSubView("analytics");
          }}
        >
          <BarChart3 size={14} />
          <span>Financial Analytics & Profit Reports (የፋይናንስ ሪፖርት)</span>
        </button>
      </div>

      {dashboardSubView === "analytics" ? (
        <div className="dashboard-analytics-embedded animate-fade">
          <AnalyticsView
            sales={sales}
            expenses={expenses}
            products={products}
            currency={currency}
          />
        </div>
      ) : (
        <>
          {/* 3. Today's Key Financial & Operations Pulse */}
          <div className="dashboard-kpi-grid">
        {/* Today's Sales */}
        <div className="dashboard-kpi-card card-kpi-revenue">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Today's Revenue (የዛሬ ሽያጭ)</span>
            <div className="stat-icon-wrapper stat-emerald">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="kpi-value-row">
            <span className="kpi-main-number text-emerald">
              {todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="kpi-unit-label">{currency}</span>
          </div>

          <div className="kpi-progress-bar-wrap">
            <div className="kpi-progress-track">
              <div
                className="kpi-progress-fill fill-emerald"
                style={{ width: `${targetPercent}%` }}
              ></div>
            </div>
            <span className="kpi-progress-hint">
              {targetPercent}% of {dailyTarget.toLocaleString()} {currency} Daily Goal
            </span>
          </div>

          <div className="kpi-footer-sub">
            <span>{todaySales.length} Orders completed</span>
            {todayProfit > 0 && (
              <span className="kpi-profit-pill">
                +{todayProfit.toFixed(0)} {currency} net profit
              </span>
            )}
          </div>
        </div>

        {/* Liters Dispensed Today */}
        <div className="dashboard-kpi-card card-kpi-liters">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Liters Dispensed (የተቀዳ ፈሳሽ)</span>
            <div className="stat-icon-wrapper stat-cyan">
              <Droplets size={18} />
            </div>
          </div>

          <div className="kpi-value-row">
            <span className="kpi-main-number text-cyan">
              {todayLiters.toFixed(1)}
            </span>
            <span className="kpi-unit-label">Liters</span>
          </div>

          <div className="kpi-progress-bar-wrap">
            <div className="kpi-progress-track">
              <div
                className="kpi-progress-fill fill-cyan"
                style={{ width: `${Math.min(100, Math.round((todayLiters / 150) * 100))}%` }}
              ></div>
            </div>
            <span className="kpi-progress-hint">
              Active dispensing across all counter stations
            </span>
          </div>

          <div className="kpi-footer-sub">
            <span>Counter Jerrycans & Refill Containers</span>
          </div>
        </div>

        {/* Cash vs Digital Drawer */}
        <div className="dashboard-kpi-card card-kpi-payments">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Payment Breakdown (ክፍያዎች)</span>
            <div className="stat-icon-wrapper stat-amber">
              <Zap size={18} />
            </div>
          </div>

          <div className="kpi-value-row">
            <span className="kpi-main-number">
              {(todayCash + todayDigital).toLocaleString()}
            </span>
            <span className="kpi-unit-label">{currency}</span>
          </div>

          {/* Dual Segment Progress */}
          <div className="kpi-progress-bar-wrap">
            <div className="kpi-progress-track payment-split-track">
              <div
                className="payment-split-fill fill-cash"
                style={{
                  width: `${
                    todayRevenue > 0
                      ? Math.round((todayCash / todayRevenue) * 100)
                      : 100
                  }%`,
                }}
              ></div>
              <div
                className="payment-split-fill fill-digital"
                style={{
                  width: `${
                    todayRevenue > 0
                      ? Math.round((todayDigital / todayRevenue) * 100)
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <div className="payment-legend-row">
              <span className="legend-item">
                <span className="legend-dot dot-cash"></span>
                <span>Cash: {todayCash.toLocaleString()} {currency}</span>
              </span>
              <span className="legend-item">
                <span className="legend-dot dot-digital"></span>
                <span>Digital: {todayDigital.toLocaleString()} {currency}</span>
              </span>
            </div>
          </div>

          <div className="kpi-footer-sub">
            <span>Telebirr, CBE Birr & Cash Register</span>
          </div>
        </div>

        {/* Today's Expenses & Net Earnings */}
        <div className="dashboard-kpi-card card-kpi-revenue">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Today's Expenses (የዛሬ ወጪ)</span>
            <div className="stat-icon-wrapper stat-rose">
              <TrendingDown size={18} />
            </div>
          </div>

          <div className="kpi-value-row">
            <span className="kpi-main-number text-rose">
              {todayExpenseTotal.toLocaleString()}
            </span>
            <span className="kpi-unit-label">{currency}</span>
          </div>

          <div className="kpi-credit-status-box">
            <span className="credit-ok-pill">
              <CheckCircle2 size={13} />
              <span>
                Net Profit: {todayNetIncome >= 0 ? `+${todayNetIncome.toLocaleString()}` : todayNetIncome.toLocaleString()} {currency}
              </span>
            </span>
          </div>

          <div className="kpi-footer-sub">
            <span>{todayExpenses.length} {todayExpenses.length === 1 ? "expense record" : "expense records"} today</span>
          </div>
        </div>
      </div>

      {/* 3. Live Bulk Soap Reservoir (Cylindrical Tanks Simulation) */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <div className="section-title-icon-box">
              <Package size={18} />
            </div>
            <div>
              <h3 className="section-main-heading">
                Store Soap Reservoirs & Liquid Tanks (የሳሙና ታንከሮች)
              </h3>
              <span className="section-sub-heading">
                Real-time volume levels, low-stock beacons, and rapid refills
              </span>
            </div>
          </div>

          <button
            type="button"
            className="section-link-btn"
            onClick={() => handleNav("inventory")}
          >
            <span>Open Tank Farm</span>
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="dashboard-tanks-grid">
          {products.map((prod) => {
            const isLow = prod.stockLiters <= (prod.minStockAlert || 40);
            const isZero = prod.stockLiters <= 0;
            const tankCapacity = 400;
            const gaugePercent = Math.min(100, Math.max(8, Math.round((prod.stockLiters / tankCapacity) * 100)));

            return (
              <div key={prod.id} className="dashboard-tank-card">
                {/* Top Card Info */}
                <div className="tank-card-top">
                  <div className="tank-info-left">
                    <div
                      className="tank-avatar-circle"
                      style={{
                        backgroundColor: `${prod.color}15`,
                        color: prod.color,
                        borderColor: `${prod.color}35`,
                      }}
                    >
                      {prod.iconEmoji || "🧴"}
                    </div>
                    <div className="tank-title-texts">
                      <strong className="tank-name-bold">{prod.name}</strong>
                      <span className="tank-local-amharic">
                        {prod.localName || prod.scent || "Standard Cleanser"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`badge-pill ${
                      isZero ? "badge-danger" : isLow ? "badge-warning" : "badge-success"
                    }`}
                  >
                    <span className="badge-pulse-dot"></span>
                    <span>{isZero ? "Empty" : isLow ? "Low Stock" : "Optimal"}</span>
                  </span>
                </div>

                {/* Cylindrical Liquid Tank Reservoir Visual */}
                <div className="realistic-tank-simulation-box">
                  <div className="tank-cylinder-frame">
                    {/* Tank Rim Top */}
                    <div className="cylinder-top-rim"></div>

                    {/* Fluid Level */}
                    <div
                      className="cylinder-fluid-body"
                      style={{
                        height: `${gaugePercent}%`,
                        background: `linear-gradient(180deg, ${prod.color || "#0d9488"} 0%, ${prod.color || "#0d9488"}dd 100%)`,
                      }}
                    >
                      {/* Fluid Wave Animation on Top */}
                      <div className="cylinder-fluid-wave"></div>
                      <span className="fluid-bubble b1">🫧</span>
                      <span className="fluid-bubble b2">🫧</span>
                    </div>

                    {/* Volumetric Graduation Lines */}
                    <div className="cylinder-notches">
                      <span className="notch-mark n-400">400L</span>
                      <span className="notch-mark n-300">300L</span>
                      <span className="notch-mark n-200">200L</span>
                      <span className="notch-mark n-100">100L</span>
                    </div>
                  </div>

                  {/* Volume Metrics */}
                  <div className="tank-metrics-col">
                    <div className="tank-volume-big-row">
                      <strong className="tank-liters-num">{prod.stockLiters.toFixed(1)}</strong>
                      <span className="tank-liters-unit">/ {tankCapacity} Liters</span>
                    </div>
                    <span className="tank-capacity-percent-pill">
                      {gaugePercent}% Capacity
                    </span>

                    <div className="tank-financial-info">
                      <span className="fin-label">Retail Value</span>
                      <strong className="fin-val">
                        {(prod.stockLiters * prod.pricePerLiter).toLocaleString()} {currency}
                      </strong>
                    </div>

                    <div className="tank-rate-badge">
                      <span>Rate:</span>
                      <strong>{prod.pricePerLiter.toFixed(2)} {currency} / L</strong>
                    </div>
                  </div>
                </div>

                {/* Tank Actions Footer */}
                <div className="tank-actions-footer">
                  <button
                    type="button"
                    className="btn-tank-refill"
                    onClick={() => handleNav("inventory")}
                    title="Add bulk liters to this tank"
                  >
                    <span>+ Quick Refill</span>
                  </button>

                  <button
                    type="button"
                    className="btn-tank-dispense"
                    onClick={() => handleNav("pos")}
                    title="Open counter dispenser in POS"
                  >
                    <ShoppingCart size={14} />
                    <span>Dispense (POS)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Cash Drawer Shift Control & Soap Batch Production Mixer */}
      <div className="dashboard-widgets-section">
        <CashDrawerWidget
          todaySales={todaySales}
          todayExpenses={todayExpenses}
          currency={currency}
          cashierName={cashierName}
        />

        <BatchProductionWidget
          products={products}
          currency={currency}
          onRestockLiters={onRestockLiters}
          onAddExpense={onAddExpense}
        />
      </div>

      {/* 5. Operations Launchpad & Activity Feed Bento Grid */}
      <div className="dashboard-two-col">
        {/* Operations Launchpad */}
        <div className="dashboard-card-panel">
          <div className="panel-header-row">
            <div className="panel-title-text">
              <Sparkles size={16} className="text-teal" />
              <span>Operations Launchpad (ፈጣን ማስጀመሪያ)</span>
            </div>
            <span className="panel-hint-text">Instant POS & Formula tools</span>
          </div>

          <div className="launchpad-grid">
            <button
              type="button"
              className="launchpad-tile"
              onClick={() => handleNav("pos")}
            >
              <div className="tile-icon-box stat-emerald">
                <ShoppingCart size={18} />
              </div>
              <div className="tile-text-col">
                <strong className="tile-main-label">Counter POS</strong>
                <span className="tile-sub-label">Dispense soap & print receipt</span>
              </div>
              <span className="tile-shortcut-key">Open →</span>
            </button>

            <button
              type="button"
              className="launchpad-tile"
              onClick={() => handleNav("inventory")}
            >
              <div className="tile-icon-box stat-cyan">
                <Package size={18} />
              </div>
              <div className="tile-text-col">
                <strong className="tile-main-label">Soap Formulas</strong>
                <span className="tile-sub-label">Manage tanks & scents</span>
              </div>
              <span className="tile-shortcut-key">Tanks →</span>
            </button>

            <button
              type="button"
              className="launchpad-tile"
              onClick={() => handleNav("sales")}
            >
              <div className="tile-icon-box stat-purple">
                <Receipt size={18} />
              </div>
              <div className="tile-text-col">
                <strong className="tile-main-label">Sales Ledger</strong>
                <span className="tile-sub-label">Inspect past customer bills</span>
              </div>
              <span className="tile-shortcut-key">Bills →</span>
            </button>

            <button
              type="button"
              className="launchpad-tile"
              onClick={() => handleNav("expenses")}
            >
              <div className="tile-icon-box stat-rose">
                <TrendingDown size={18} />
              </div>
              <div className="tile-text-col">
                <strong className="tile-main-label">Record Expense</strong>
                <span className="tile-sub-label">Chemicals, rent & supplies</span>
              </div>
              <span className="tile-shortcut-key">Cost →</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="dashboard-card-panel">
          <div className="panel-header-row">
            <div className="panel-title-text">
              <CalendarClock size={16} className="text-teal" />
              <span>Recent Activity Stream (የቅርብ ጊዜ እንቅስቃሴዎች)</span>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={() => handleNav("sales")}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="recent-activity-list">
            {recentActivities.length === 0 ? (
              <div className="empty-activity-box">
                <span>No transactions registered yet today.</span>
              </div>
            ) : (
              recentActivities.map((act) => {
                const isSale = act.activityType === "sale";
                return (
                  <div key={act.id} className="activity-item-row">
                    <div className="activity-item-left">
                      <div className={`activity-type-dot ${isSale ? "dot-sale" : "dot-expense"}`}></div>
                      <div className="activity-text-info">
                        <strong className="activity-customer-name">
                          {isSale ? act.customerName || "Walk-In Customer" : act.description || "Expense"}
                        </strong>
                        <span className="activity-timestamp">
                          {formatEthiopianDate(act.date, "short")} • {formatEthiopianTime(act.date)}
                        </span>
                      </div>
                    </div>

                    <div className="activity-item-right">
                      <strong className={`activity-amount ${isSale ? "text-emerald" : "text-rose"}`}>
                        {isSale ? `+${(act.total || 0).toLocaleString()}` : `-${(act.amount || 0).toLocaleString()}`}{" "}
                        {currency}
                      </strong>

                      {isSale && (
                        <button
                          type="button"
                          className="btn-receipt-peek"
                          onClick={() => onSelectReceipt(act)}
                          title="View receipt"
                        >
                          <Eye size={12} />
                          <span>Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
}
