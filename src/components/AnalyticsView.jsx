import React from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Package,
  ShoppingBag,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";

export default function AnalyticsView({
  sales = [],
  expenses = [],
  products = [],
  currency = "ETB",
}) {
  // Financial Calculations
  const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalGrossProfit = sales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalCOGS = Math.max(0, totalRevenue - totalGrossProfit);
  const totalOperatingExpenses = expenses.reduce(
    (acc, e) => acc + (parseFloat(e.amount) || 0),
    0
  );
  const netProfit = totalGrossProfit - totalOperatingExpenses;
  const netMarginPct =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;
  const grossMarginPct =
    totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Liters sold total
  const totalLitersSold = sales.reduce((acc, s) => {
    return acc + (s.items?.reduce((iAcc, item) => iAcc + (item.liters || 0), 0) || 0);
  }, 0);

  // Capital & Retail Metrics
  const totalStockAssetValue = products.reduce(
    (acc, p) => acc + (p.stockLiters * p.costPerLiter || 0),
    0
  );
  const totalTransactionsCount = sales.length;
  const averageTicketSize =
    totalTransactionsCount > 0 ? totalRevenue / totalTransactionsCount : 0;

  // Sales by Payment Method
  const paymentBreakdown = {
    Cash: 0,
    Telebirr: 0,
    "CBE Birr": 0,
  };

  sales.forEach((s) => {
    const method = s.paymentMethod || "Cash";
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (s.total || 0);
  });

  // Top products sold by liters
  const productSalesMap = {};
  sales.forEach((s) => {
    s.items?.forEach((item) => {
      const id = item.productId || item.name;
      if (!productSalesMap[id]) {
        productSalesMap[id] = {
          name: item.name,
          color: item.color || "#0d9488",
          scent: item.scent || "",
          liters: 0,
          revenue: 0,
        };
      }
      productSalesMap[id].liters += item.liters || 0;
      productSalesMap[id].revenue += item.totalPrice || 0;
    });
  });

  const sortedTopProducts = Object.values(productSalesMap).sort(
    (a, b) => b.liters - a.liters
  );
  const maxLiters = sortedTopProducts[0]?.liters || 1;

  return (
    <div className="analytics-layout animate-fade">
      {/* High-Level P&L Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Sales Revenue</span>
            <div className="metric-icon-wrap stat-cyan">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">
            {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">From {sales.length} customer sales</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Gross Soap Margin</span>
            <div className="metric-icon-wrap stat-emerald">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="metric-value text-emerald">
            {totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">{grossMarginPct}% average soap product markup</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Operating Expenses</span>
            <div className="metric-icon-wrap stat-rose">
              <TrendingUp size={20} style={{ transform: "rotate(180deg)" }} />
            </div>
          </div>
          <div className="metric-value text-rose">
            {totalOperatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Rent, chemicals, utilities, transport</span>
        </div>

        <div className={`metric-card ${netProfit >= 0 ? "card-highlight-green" : "card-highlight-red"}`}>
          <div className="metric-header">
            <span className="metric-title">Net Profit (True Income)</span>
            <div className={`metric-icon-wrap ${netProfit >= 0 ? "stat-emerald" : "stat-rose"}`}>
              {netProfit >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
          </div>
          <div className={`metric-value ${netProfit >= 0 ? "text-emerald" : "text-rose"}`}>
            {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">
            {netMarginPct}% Net profit margin after all costs
          </span>
        </div>
      </div>

      {/* Balance Sheet Highlights: Inventory Capital & Retail Performance */}
      <div className="analytics-extra-stats-grid">
        <div className="analytics-stat-pill-card">
          <div className="stat-pill-icon bg-cyan-subtle">
            <Package size={18} className="text-cyan" />
          </div>
          <div className="stat-pill-info">
            <span className="stat-pill-title">Tank Inventory Asset Value</span>
            <strong className="stat-pill-val">
              {totalStockAssetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}
            </strong>
          </div>
          <span className="stat-pill-sub">Raw soap stock cost</span>
        </div>

        <div className="analytics-stat-pill-card">
          <div className="stat-pill-icon bg-emerald-subtle">
            <ShoppingBag size={18} className="text-emerald" />
          </div>
          <div className="stat-pill-info">
            <span className="stat-pill-title">Completed Orders</span>
            <strong className="stat-pill-val text-emerald">
              {totalTransactionsCount} Orders
            </strong>
          </div>
          <span className="stat-pill-sub">All-time sales recorded</span>
        </div>

        <div className="analytics-stat-pill-card">
          <div className="stat-pill-icon bg-purple-subtle">
            <Receipt size={18} className="text-purple" />
          </div>
          <div className="stat-pill-info">
            <span className="stat-pill-title">Average Order Value (AOV)</span>
            <strong className="stat-pill-val text-purple">
              {averageTicketSize.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {currency}
            </strong>
          </div>
          <span className="stat-pill-sub">Mean spending per customer</span>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="analytics-two-col">
        {/* Top Selling Soaps by Liters */}
        <div className="analytics-card">
          <div className="card-header-row">
            <div className="card-title-wrap">
              <Award size={20} className="text-amber" />
              <h3 className="section-title">Top Selling Soaps by Volume (Liters)</h3>
            </div>
            <span className="badge-pill badge-neutral">
              Total {totalLitersSold.toFixed(1)} Liters Sold
            </span>
          </div>

          <div className="top-products-list">
            {sortedTopProducts.length === 0 ? (
              <p className="empty-subtle">No sales data recorded yet.</p>
            ) : (
              sortedTopProducts.map((p, idx) => {
                const percent = Math.round((p.liters / maxLiters) * 100);
                return (
                  <div key={p.name} className="product-rank-row">
                    <div className="rank-badge">#{idx + 1}</div>
                    <div className="rank-info-col">
                      <div className="rank-name-row">
                        <strong className="rank-soap-name">{p.name}</strong>
                        <span className="rank-liters-bold">
                          {p.liters.toFixed(1)} Liters ({p.revenue.toLocaleString()} {currency})
                        </span>
                      </div>
                      <div className="rank-progress-track">
                        <div
                          className="rank-progress-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: p.color || "#0d9488",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick P&L Statement Breakdown */}
          <div className="pnl-breakdown-box">
            <div className="pnl-header">
              <FileSpreadsheet size={16} className="text-teal" />
              <strong>P&L Summary (የትርፍና ኪሳራ መግለጫ)</strong>
            </div>
            <div className="pnl-rows-list">
              <div className="pnl-row">
                <span>Total Gross Sales Revenue</span>
                <strong>+{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</strong>
              </div>
              <div className="pnl-row text-muted">
                <span>Less: Cost of Soap Goods (COGS)</span>
                <span>-{totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
              </div>
              <div className="pnl-row font-semibold">
                <span>= Gross Profit</span>
                <span className="text-emerald">+{totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
              </div>
              <div className="pnl-row text-rose">
                <span>Less: Operating Expenses (Rent, Bills)</span>
                <span>-{totalOperatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
              </div>
              <div className="pnl-row pnl-net-row">
                <span>= Net Shop Income (የተጣራ ትርፍ)</span>
                <strong className={netProfit >= 0 ? "text-emerald" : "text-rose"}>
                  {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="analytics-card">
          <div className="card-header-row">
            <div className="card-title-wrap">
              <PieChart size={20} className="text-cyan" />
              <h3 className="section-title">Payment Channels Breakdown</h3>
            </div>
            <span className="badge-pill badge-neutral">
              {sales.length} Receipts
            </span>
          </div>

          <div className="payment-distribution-list">
            {Object.entries(paymentBreakdown).map(([method, amount]) => {
              const pct = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0;
              let dotClass = "dot-cash";
              if (method === "Telebirr") dotClass = "dot-telebirr";
              if (method === "CBE Birr") dotClass = "dot-cbe";

              return (
                <div key={method} className="payment-channel-row">
                  <div className="channel-label-wrap">
                    <span className={`channel-indicator-dot ${dotClass}`}></span>
                    <strong className="channel-name">{method}</strong>
                  </div>
                  <div className="channel-progress-wrap">
                    <div className="channel-progress-track">
                      <div
                        className={`channel-progress-fill fill-${method.toLowerCase().replace(" ", "")}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="channel-stats">
                    <span className="channel-amount">
                      {amount.toLocaleString()} {currency}
                    </span>
                    <span className="channel-pct">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shopkeeper Advice Card */}
          <div className="advice-box">
            <div className="advice-header">
              <CheckCircle size={16} className="text-emerald" />
              <strong>Shop Profit Maximizer Tip</strong>
            </div>
            <p className="advice-text">
              Dishwashing soap and Hand soap have over <strong>45% gross margin</strong>. Encourage bulk refills into 5L gallons for local cafes and hotels to accelerate daily cash flow!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

