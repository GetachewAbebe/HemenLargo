import React, { useState, useMemo } from "react";
import {
  Receipt,
  Search,
  Download,
  Eye,
  Trash2,
  Droplets,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { soundFX } from "../utils/audio";
import {
  formatEthiopianDate,
  formatEthiopianTime,
  isSameEthiopianDay,
  isSameEthiopianMonth,
  getEthiopianToday,
} from "../utils/ethiopianDate";

export default function SalesView({
  sales,
  config = {},
  currency = "ETB",
  onSelectReceipt,
  onVoidSale,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [referenceNow] = useState(() => new Date());
  const currentEth = useMemo(() => getEthiopianToday(), []);
  const isEthCal = config.calendarSystem !== "gregorian";

  const filteredSales = useMemo(() => {
    const nowTime = referenceNow.getTime();

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);

      // Date filter
      if (dateFilter === "today") {
        if (isEthCal) {
          if (!isSameEthiopianDay(sale.date, referenceNow)) return false;
        } else {
          const todayStr = referenceNow.toISOString().split("T")[0];
          if (!sale.date.startsWith(todayStr)) return false;
        }
      } else if (dateFilter === "week") {
        const oneWeekAgo = new Date(nowTime - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < oneWeekAgo) return false;
      } else if (dateFilter === "month") {
        if (isEthCal) {
          // Current Ethiopian Month (e.g. Meskerem, Tikimt, etc.)
          if (!isSameEthiopianMonth(sale.date, referenceNow)) return false;
        } else {
          const oneMonthAgo = new Date(nowTime - 30 * 24 * 60 * 60 * 1000);
          if (saleDate < oneMonthAgo) return false;
        }
      }

      // Payment method filter
      if (paymentFilter !== "all" && sale.paymentMethod !== paymentFilter) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchId = String(sale.id || "").toLowerCase().includes(q);
        const matchCustomer =
          (sale.customerName && String(sale.customerName).toLowerCase().includes(q)) ||
          (sale.customerPhone && String(sale.customerPhone).includes(q));
        const matchItems = sale.items?.some((i) =>
          (i.name || "").toLowerCase().includes(q)
        );
        if (!matchId && !matchCustomer && !matchItems) return false;
      }

      return true;
    });
  }, [sales, dateFilter, paymentFilter, searchQuery, isEthCal, referenceNow]);

  // Calculate summaries for filtered view
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalLitersDispensed = filteredSales.reduce((acc, s) => {
    return acc + (s.items?.reduce((iAcc, item) => iAcc + (item.liters || 0), 0) || 0);
  }, 0);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;
    const headers = [
      "Receipt ID",
      "Ethiopian Date (ዓ.ም)",
      "Gregorian Date & Time",
      "Customer Name",
      "Phone",
      "Payment Method",
      "Total Liters",
      "Subtotal",
      "Discount",
      "Total (ETB)",
      "Profit (ETB)",
      "Status",
    ];

    const rows = filteredSales.map((s) => [
      s.id,
      `"${formatEthiopianDate(s.date, "medium")} ${formatEthiopianTime(s.date, false)}"`,
      `"${new Date(s.date).toLocaleString()}"`,
      `"${s.customerName || "Walk-in"}"`,
      s.customerPhone || "N/A",
      s.paymentMethod,
      s.items?.reduce((acc, i) => acc + (i.liters || 0), 0) || 0,
      s.subtotal || s.total,
      s.discount || 0,
      s.total,
      s.profit || 0,
      s.status || "Completed",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileEthDate = currentEth
      ? `${currentEth.year}_${currentEth.monthNameEn}_${currentEth.day}`
      : "sales";
    link.setAttribute("download", `sukie_sales_EC_${fileEthDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="sales-layout animate-fade">
      {/* Top Filtered Stats */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Filtered Revenue</span>
            <div className="metric-icon-wrap stat-emerald">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">
            {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">{filteredSales.length} Transactions</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Gross Profit</span>
            <div className="metric-icon-wrap stat-cyan">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="metric-value text-emerald">
            {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">
            {totalRevenue > 0
              ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% gross margin`
              : "0% margin"}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Liters Dispensed</span>
            <div className="metric-icon-wrap stat-purple">
              <Droplets size={20} />
            </div>
          </div>
          <div className="metric-value">
            {totalLitersDispensed.toFixed(1)} <span className="metric-unit">Liters</span>
          </div>
          <span className="metric-sub">Across all soap varieties sold</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Average Order Value</span>
            <div className="metric-icon-wrap stat-amber">
              <Receipt size={20} />
            </div>
          </div>
          <div className="metric-value">
            {filteredSales.length > 0
              ? (totalRevenue / filteredSales.length).toFixed(2)
              : "0.00"}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Per customer receipt</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="inventory-controls-bar">
        <div className="inventory-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="inventory-search-input"
            placeholder="Search by receipt #, customer, phone, soap..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Filter Buttons */}
        <div className="filter-pill-group">
          <button
            className={`filter-btn-pill ${dateFilter === "all" ? "active" : ""}`}
            onClick={() => setDateFilter("all")}
          >
            ሁሉንም (All)
          </button>
          <button
            className={`filter-btn-pill ${dateFilter === "today" ? "active" : ""}`}
            onClick={() => setDateFilter("today")}
          >
            ዛሬ (Today)
          </button>
          <button
            className={`filter-btn-pill ${dateFilter === "week" ? "active" : ""}`}
            onClick={() => setDateFilter("week")}
          >
            7 ቀናት (Week)
          </button>
          <button
            className={`filter-btn-pill ${dateFilter === "month" ? "active" : ""}`}
            onClick={() => setDateFilter("month")}
            title={`Sales during Ethiopian month of ${currentEth?.monthNameAm || "Month"}`}
          >
            የዚህ ወር ({currentEth?.monthNameAm || "Month"})
          </button>
        </div>

        {/* Payment Filter */}
        <div className="category-select-wrap">
          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Methods (ሁሉንም)</option>
            <option value="Cash">💵 Cash Only (ጥሬ ገንዘብ)</option>
            <option value="Telebirr">📱 Telebirr Only (ቴሌብር)</option>
            <option value="CBE Birr">💳 CBE Birr Only (ሲቢኢ ብር)</option>
            <option value="Credit">⚠️ Credit Only (ያልተከፈለ ዕዳ)</option>
          </select>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV} title="Export CSV Spreadsheet">
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Items & Liters</th>
                <th>Payment</th>
                <th>Total Amount</th>
                <th>Profit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty-cell">
                    <div className="empty-state-container">
                      <div className="empty-state-icon">🫧</div>
                      <strong>No sales records found matching your filters</strong>
                      <p>Try adjusting your search keyword or switching between time ranges.</p>
                      {(dateFilter !== "all" || paymentFilter !== "all" || searchQuery) && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => {
                            setDateFilter("all");
                            setPaymentFilter("all");
                            setSearchQuery("");
                          }}
                        >
                          Clear Active Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const saleLiters = sale.items?.reduce((acc, i) => acc + (i.liters || 0), 0) || 0;
                  const isCredit = sale.paymentMethod === "Credit";

                  return (
                    <tr key={sale.id}>
                      <td>
                        <strong className="receipt-code">{sale.id}</strong>
                      </td>
                      <td>
                        <div className="date-time-cell">
                          <span className="font-semibold text-teal-800">
                            {formatEthiopianDate(sale.date, "medium")}
                          </span>
                          <span className="time-sub">
                            {formatEthiopianTime(sale.date, false)}
                            <span className="greg-inline-hint">
                              {" "}• {new Date(sale.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <strong className="customer-name">{sale.customerName || "Walk-in Customer"}</strong>
                          {sale.customerPhone && sale.customerPhone !== "N/A" && (
                            <span className="customer-phone">{sale.customerPhone}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="items-summary-cell">
                          <span className="liters-highlight-tag">
                            {saleLiters.toFixed(1)} L Total
                          </span>
                          <span className="items-breakdown-sub">
                            {sale.items?.map((i) => `${i.liters}L ${i.name}`).join(", ")}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge-pill ${
                            isCredit
                              ? "badge-danger"
                              : sale.paymentMethod === "Telebirr"
                              ? "badge-telebirr"
                              : sale.paymentMethod === "CBE Birr"
                              ? "badge-cbe"
                              : "badge-cash"
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <strong className="price-tag-main">
                          {sale.total.toFixed(2)} {currency}
                        </strong>
                      </td>
                      <td>
                        <span className="text-emerald font-semibold">
                          +{sale.profit?.toFixed(2) || "0.00"} {currency}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            className="btn-view-receipt"
                            onClick={() => onSelectReceipt(sale)}
                            title="View / Print Receipt"
                          >
                            <Eye size={15} />
                            <span>Receipt</span>
                          </button>
                          {onVoidSale && (
                            <button
                              className="btn-action-icon delete-btn"
                              title="Void Sale (Return stock to tank)"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Void transaction ${sale.id}? Dispensed soap volume will be returned to inventory tanks.`
                                  )
                                ) {
                                  soundFX.playTrash();
                                  onVoidSale(sale);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
