import React, { useMemo, useState } from "react";
import {
  ShoppingCart,
  Package,
  TrendingDown,
  DollarSign,
  Droplets,
  CalendarClock,
  ArrowUpRight,
  Zap,
  Eye,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Layers,
  Calendar,
} from "lucide-react";
import { useApp } from "../context";
import {
  formatEthiopianDate,
  formatEthiopianTime,
  isSameEthiopianDay,
  isSameEthiopianMonth,
} from "../utils/ethiopianDate";
import { soundFX } from "../utils/audio";
import AnalyticsView from "./AnalyticsView";
import CashDrawerWidget from "./dashboard/CashDrawerWidget";
import BatchProductionWidget from "./dashboard/BatchProductionWidget";
import SalesTimelineChart from "./dashboard/SalesTimelineChart";
import ProductShareWidget from "./dashboard/ProductShareWidget";
import SmartInsightsWidget from "./dashboard/SmartInsightsWidget";
import QuickSaleModal from "./common/QuickSaleModal";

const EMPTY_ARR = [];

export default function DashboardView(props) {
  const context = useApp();
  const products = props.products ?? context.products ?? EMPTY_ARR;
  const sales = props.sales ?? context.sales ?? EMPTY_ARR;
  const expenses = props.expenses ?? context.expenses ?? EMPTY_ARR;
  const config = props.config ?? context.config ?? {};
  const setActiveTab = props.setActiveTab ?? context.setActiveTab;
  const onSelectReceipt = props.onSelectReceipt ?? context.setActiveReceipt;
  const onRestockLiters = props.onRestockLiters ?? context.handleRestockLiters;
  const onAddExpense = props.onAddExpense ?? context.handleAddExpense;
  const onCompleteSale = context.handleCompleteSale;
  const currency = config?.currency || "ETB";

  const [todayDate] = React.useState(() => new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("today"); // 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [dashboardSubView, setDashboardSubView] = useState("overview"); // 'overview' | 'analytics'

  // Quick Sale Modal State
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [quickSaleProductId, setQuickSaleProductId] = useState(null);

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

  // Dynamic Sales Filtering based on chosen period
  const periodSales = useMemo(() => {
    const nowTime = todayDate.getTime();
    const yesterdayDate = new Date(nowTime - 24 * 60 * 60 * 1000);

    return sales.filter((s) => {
      const sDate = new Date(s.date);
      if (selectedPeriod === "today") {
        return isSameEthiopianDay(s.date, todayDate);
      }
      if (selectedPeriod === "yesterday") {
        return isSameEthiopianDay(s.date, yesterdayDate);
      }
      if (selectedPeriod === "week") {
        return sDate >= new Date(nowTime - 7 * 24 * 60 * 60 * 1000);
      }
      if (selectedPeriod === "month") {
        return isSameEthiopianMonth(s.date, todayDate);
      }
      return true; // 'all'
    });
  }, [sales, selectedPeriod, todayDate]);

  // Dynamic Expenses Filtering based on chosen period
  const periodExpenses = useMemo(() => {
    const nowTime = todayDate.getTime();
    const yesterdayDate = new Date(nowTime - 24 * 60 * 60 * 1000);

    return expenses.filter((e) => {
      const eDate = new Date(e.date);
      if (selectedPeriod === "today") {
        return isSameEthiopianDay(e.date, todayDate);
      }
      if (selectedPeriod === "yesterday") {
        return isSameEthiopianDay(e.date, yesterdayDate);
      }
      if (selectedPeriod === "week") {
        return eDate >= new Date(nowTime - 7 * 24 * 60 * 60 * 1000);
      }
      if (selectedPeriod === "month") {
        return isSameEthiopianMonth(e.date, todayDate);
      }
      return true; // 'all'
    });
  }, [expenses, selectedPeriod, todayDate]);

  // Aggregate Metrics for Selected Period
  const periodRevenue = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + (s.total || 0), 0);
  }, [periodSales]);

  const periodProfit = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  }, [periodSales]);

  const periodLiters = useMemo(() => {
    return periodSales.reduce((acc, s) => {
      return acc + (s.items?.reduce((iAcc, item) => iAcc + (item.liters || 0), 0) || 0);
    }, 0);
  }, [periodSales]);

  const periodCash = useMemo(() => {
    return periodSales
      .filter((s) => s.paymentMethod === "Cash")
      .reduce((acc, s) => acc + (s.total || 0), 0);
  }, [periodSales]);

  const periodDigital = useMemo(() => {
    return periodSales
      .filter((s) => s.paymentMethod === "Telebirr" || s.paymentMethod === "CBE Birr")
      .reduce((acc, s) => acc + (s.total || 0), 0);
  }, [periodSales]);

  const periodExpenseTotal = useMemo(() => {
    return periodExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [periodExpenses]);

  const periodNetIncome = periodProfit - periodExpenseTotal;

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

  const openQuickSale = (productId = null) => {
    soundFX.playPop();
    setQuickSaleProductId(productId);
    setIsQuickSaleOpen(true);
  };

  const dailyTarget = 5000;
  const targetMultiplier = selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 1;
  const effectiveTarget = dailyTarget * targetMultiplier;
  const targetPercent = Math.min(100, Math.round((periodRevenue / effectiveTarget) * 100));

  const periodLabels = {
    today: "ዛሬ (Today)",
    yesterday: "ትናንት (Yesterday)",
    week: "በዚህ ሳምንት (This Week)",
    month: "በዚህ ወር (This Month)",
    all: "ሁሉንም (All Time)",
  };

  return (
    <div className="dashboard-layout animate-fade">
      {/* 1. Executive Command Header Card */}
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

        {/* Action Buttons in Hero */}
        <div className="hero-right-actions">
          <button
            type="button"
            className="btn-hero-primary"
            onClick={() => openQuickSale()}
            title="Instant 3-second sales registration"
          >
            <Zap size={18} />
            <span>⚡ Quick Sale (ቀላል ሽያጭ)</span>
          </button>

          <button
            type="button"
            className="btn-hero-secondary"
            onClick={() => handleNav("sales")}
            title="Open Counter POS or Sales Records"
          >
            <ShoppingCart size={17} />
            <span>Sales & POS (ካውንተር)</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Time Period Selector & View Mode Switcher */}
      <div className="dashboard-controls-row">
        {/* Period Selector Tabs */}
        <div className="period-selector-pill-bar">
          <span className="period-selector-label">
            <Calendar size={14} />
            <span>Period (ጊዜ):</span>
          </span>
          {["today", "yesterday", "week", "month", "all"].map((p) => {
            const isActive = selectedPeriod === p;
            return (
              <button
                key={p}
                type="button"
                className={`period-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedPeriod(p);
                }}
              >
                <span>{periodLabels[p]}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-View Switcher: Overview vs In-Depth Analytics */}
        <div className="dashboard-subview-nav">
          <button
            type="button"
            className={`subview-nav-pill ${dashboardSubView === "overview" ? "active" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setDashboardSubView("overview");
            }}
          >
            <Layers size={14} />
            <span>Overview & Flow (አጠቃላይ)</span>
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
            <span>Full P&L Reports (የፋይናንስ ሪፖርት)</span>
          </button>
        </div>
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
          {/* 3. Key Financial & Operational Pulse Cards */}
          <div className="dashboard-kpi-grid">
            {/* Revenue */}
            <div className="dashboard-kpi-card card-kpi-revenue">
              <div className="kpi-card-header">
                <span className="kpi-title-text">
                  Revenue ({selectedPeriod === "today" ? "የዛሬ ሽያጭ" : "ሽያጭ"})
                </span>
                <div className="stat-icon-wrapper stat-emerald">
                  <DollarSign size={18} />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-main-number text-emerald">
                  {periodRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  {targetPercent}% of {effectiveTarget.toLocaleString()} {currency} Goal
                </span>
              </div>

              <div className="kpi-footer-sub">
                <span>{periodSales.length} {periodSales.length === 1 ? "Sale" : "Sales"} registered</span>
                {periodProfit > 0 && (
                  <span className="kpi-profit-pill">
                    +{periodProfit.toFixed(0)} {currency} profit
                  </span>
                )}
              </div>
            </div>

            {/* Liters Dispensed */}
            <div className="dashboard-kpi-card card-kpi-liters">
              <div className="kpi-card-header">
                <span className="kpi-title-text">Liters Dispensed (የተቀዳ ፈሳሽ)</span>
                <div className="stat-icon-wrapper stat-cyan">
                  <Droplets size={18} />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-main-number text-cyan">
                  {periodLiters.toFixed(1)}
                </span>
                <span className="kpi-unit-label">Liters</span>
              </div>

              <div className="kpi-progress-bar-wrap">
                <div className="kpi-progress-track">
                  <div
                    className="kpi-progress-fill fill-cyan"
                    style={{ width: `${Math.min(100, Math.round((periodLiters / 150) * 100))}%` }}
                  ></div>
                </div>
                <span className="kpi-progress-hint">
                  Active bulk liquid output across shop tanks
                </span>
              </div>

              <div className="kpi-footer-sub">
                <span>Jerrycans, Gallons & Bottles filled</span>
              </div>
            </div>

            {/* Cash vs Digital Breakdown */}
            <div className="dashboard-kpi-card card-kpi-payments">
              <div className="kpi-card-header">
                <span className="kpi-title-text">Payment Breakdown (ክፍያዎች)</span>
                <div className="stat-icon-wrapper stat-amber">
                  <Zap size={18} />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-main-number">
                  {(periodCash + periodDigital).toLocaleString()}
                </span>
                <span className="kpi-unit-label">{currency}</span>
              </div>

              {/* Multi-Segment Track */}
              <div className="kpi-progress-bar-wrap">
                <div className="kpi-progress-track payment-split-track">
                  <div
                    className="payment-split-fill fill-cash"
                    style={{
                      width: `${
                        periodRevenue > 0
                          ? Math.round((periodCash / periodRevenue) * 100)
                          : 100
                      }%`,
                    }}
                  ></div>
                  <div
                    className="payment-split-fill fill-digital"
                    style={{
                      width: `${
                        periodRevenue > 0
                          ? Math.round((periodDigital / periodRevenue) * 100)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="payment-legend-row">
                  <span className="legend-item">
                    <span className="legend-dot dot-cash"></span>
                    <span>Cash: {periodCash.toLocaleString()} {currency}</span>
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot dot-digital"></span>
                    <span>Digital: {periodDigital.toLocaleString()} {currency}</span>
                  </span>
                </div>
              </div>

              <div className="kpi-footer-sub">
                <span>Telebirr, CBE Birr & Cash Register</span>
              </div>
            </div>

            {/* Expenses & Net Profit */}
            <div className="dashboard-kpi-card card-kpi-revenue">
              <div className="kpi-card-header">
                <span className="kpi-title-text">
                  Expenses & Profit (ወጪ እና ትርፍ)
                </span>
                <div className="stat-icon-wrapper stat-rose">
                  <TrendingDown size={18} />
                </div>
              </div>

              <div className="kpi-value-row">
                <span className="kpi-main-number text-rose">
                  {periodExpenseTotal.toLocaleString()}
                </span>
                <span className="kpi-unit-label">{currency} Exp</span>
              </div>

              <div className="kpi-credit-status-box">
                <span className={`credit-ok-pill ${periodNetIncome >= 0 ? "net-positive" : "net-negative"}`}>
                  <CheckCircle2 size={13} />
                  <span>
                    Net: {periodNetIncome >= 0 ? `+${periodNetIncome.toLocaleString()}` : periodNetIncome.toLocaleString()} {currency}
                  </span>
                </span>
              </div>

              <div className="kpi-footer-sub">
                <span>{periodExpenses.length} expense items recorded</span>
              </div>
            </div>
          </div>

          {/* 4. Sales Flow Activity Timeline (Lightweight Interactive Chart) */}
          <SalesTimelineChart
            sales={periodSales}
            currency={currency}
            period={selectedPeriod}
          />

          {/* 5. Product Mix & Smart Insights Row */}
          <div className="dashboard-widgets-section">
            <ProductShareWidget
              products={products}
              sales={periodSales}
              currency={currency}
              onQuickDispense={(productId) => openQuickSale(productId)}
            />

            <SmartInsightsWidget
              products={products}
              sales={periodSales}
              expenses={periodExpenses}
              currency={currency}
              periodRevenue={periodRevenue}
              dailyTarget={effectiveTarget}
            />
          </div>

          {/* 6. Live Soap Reservoir Tanks Simulation */}
          <div className="dashboard-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <div className="section-title-icon-box">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="section-main-heading">
                    Liquid Soap Reservoirs & Tanks (የሳሙና ታንከሮች)
                  </h3>
                  <span className="section-sub-heading">
                    Real-time tank volume gauges, low-stock beacons, and 1-click dispensing
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="section-link-btn"
                onClick={() => handleNav("inventory")}
              >
                <span>Manage Tank Farm</span>
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
                            backgroundColor: `${prod.color || "#0d9488"}15`,
                            color: prod.color || "#0d9488",
                            borderColor: `${prod.color || "#0d9488"}35`,
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

                    {/* Cylindrical Liquid Tank Simulation */}
                    <div className="realistic-tank-simulation-box">
                      <div className="tank-cylinder-frame">
                        <div className="cylinder-top-rim"></div>

                        <div
                          className="cylinder-fluid-body"
                          style={{
                            height: `${gaugePercent}%`,
                            background: `linear-gradient(180deg, ${prod.color || "#0d9488"} 0%, ${prod.color || "#0d9488"}dd 100%)`,
                          }}
                        >
                          <div className="cylinder-fluid-wave"></div>
                          <span className="fluid-bubble b1">🫧</span>
                          <span className="fluid-bubble b2">🫧</span>
                        </div>

                        <div className="cylinder-notches">
                          <span className="notch-mark n-400">400L</span>
                          <span className="notch-mark n-300">300L</span>
                          <span className="notch-mark n-200">200L</span>
                          <span className="notch-mark n-100">100L</span>
                        </div>
                      </div>

                      <div className="tank-metrics-col">
                        <div className="tank-volume-big-row">
                          <strong className="tank-liters-num">{prod.stockLiters.toFixed(1)}</strong>
                          <span className="tank-liters-unit">/ {tankCapacity} L</span>
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
                          <strong>{prod.pricePerLiter.toFixed(2)} {currency}/L</strong>
                        </div>
                      </div>
                    </div>

                    {/* Tank Actions Footer */}
                    <div className="tank-actions-footer">
                      <button
                        type="button"
                        className="btn-tank-dispense"
                        onClick={() => openQuickSale(prod.id)}
                        title="Instant quick sale for this product"
                      >
                        <Zap size={14} className="text-amber" />
                        <span>⚡ Quick Sell</span>
                      </button>

                      <button
                        type="button"
                        className="btn-tank-refill"
                        onClick={() => handleNav("inventory")}
                        title="Refill liters in tank"
                      >
                        <span>+ Refill</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7. Cash Drawer Shift Control & Soap Batch Production Mixer */}
          <div className="dashboard-widgets-section">
            <CashDrawerWidget
              todaySales={periodSales}
              todayExpenses={periodExpenses}
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

          {/* 8. Operations Launchpad & Activity Feed Bento Grid */}
          <div className="dashboard-two-col">
            {/* Launchpad */}
            <div className="dashboard-card-panel">
              <div className="panel-header-row">
                <div className="panel-title-text">
                  <Sparkles size={16} className="text-teal" />
                  <span>Operations Launchpad (ፈጣን ማስጀመሪያ)</span>
                </div>
                <span className="panel-hint-text">Instant tools</span>
              </div>

              <div className="launchpad-grid">
                <button
                  type="button"
                  className="launchpad-tile"
                  onClick={() => openQuickSale()}
                >
                  <div className="tile-icon-box stat-emerald">
                    <Zap size={18} />
                  </div>
                  <div className="tile-text-col">
                    <strong className="tile-main-label">Quick Register</strong>
                    <span className="tile-sub-label">Instant 3-sec customer sale</span>
                  </div>
                  <span className="tile-shortcut-key">Sale ⚡</span>
                </button>

                <button
                  type="button"
                  className="launchpad-tile"
                  onClick={() => handleNav("sales")}
                >
                  <div className="tile-icon-box stat-cyan">
                    <ShoppingCart size={18} />
                  </div>
                  <div className="tile-text-col">
                    <strong className="tile-main-label">Counter POS</strong>
                    <span className="tile-sub-label">Full jerrycan dispenser station</span>
                  </div>
                  <span className="tile-shortcut-key">POS →</span>
                </button>

                <button
                  type="button"
                  className="launchpad-tile"
                  onClick={() => handleNav("inventory")}
                >
                  <div className="tile-icon-box stat-purple">
                    <Package size={18} />
                  </div>
                  <div className="tile-text-col">
                    <strong className="tile-main-label">Tanks & Stock</strong>
                    <span className="tile-sub-label">Manage soap formulas & refill</span>
                  </div>
                  <span className="tile-shortcut-key">Tanks →</span>
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
                    <span className="tile-sub-label">Chemicals, rent & shop costs</span>
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
                    <span>No transactions registered yet.</span>
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

      {/* Global Quick Sale Modal */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => {
          setIsQuickSaleOpen(false);
          setQuickSaleProductId(null);
        }}
        products={products}
        sales={sales}
        currency={currency}
        onCompleteSale={onCompleteSale}
        preselectedProductId={quickSaleProductId}
      />
    </div>
  );
}
