import React, { useState, useMemo } from "react";
import { soundFX } from "../utils/audio";
import {
  formatEthiopianDate,
  formatEthiopianTime,
  isSameEthiopianDay,
  isSameEthiopianMonth,
  getEthiopianToday,
} from "../utils/ethiopianDate";
import { localDateKey } from "../services/formatters";
import { useNow } from "../hooks/useNow";

export default function SalesView({
  sales,
  _config = {},
  currency = "ETB",
  onSelectReceipt,
  onVoidSale,
  onNavigateToRegister,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const referenceNow = useNow();
  const currentEth = useMemo(() => getEthiopianToday(), []);

  // Filter sales list based on selected date range, payment, and search keywords
  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        // 1. Text Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = sale.id?.toLowerCase().includes(q);
          const matchesCustomer = sale.customerName?.toLowerCase().includes(q);
          const matchesPhone = sale.customerPhone?.toLowerCase().includes(q);
          const matchesItem = sale.items?.some(
            (i) =>
              i.name?.toLowerCase().includes(q) ||
              (i.localName && i.localName.toLowerCase().includes(q))
          );
          if (!matchesId && !matchesCustomer && !matchesPhone && !matchesItem) {
            return false;
          }
        }

        // 2. Payment Method Filter
        if (paymentFilter !== "all" && sale.paymentMethod !== paymentFilter) {
          return false;
        }

        // 3. Ethiopian Calendar Date Filter
        if (dateFilter === "today") {
          return isSameEthiopianDay(sale.date, referenceNow);
        }
        if (dateFilter === "week") {
          const diffDays =
            (referenceNow.getTime() - new Date(sale.date).getTime()) / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }
        if (dateFilter === "month") {
          return isSameEthiopianMonth(sale.date, referenceNow);
        }

        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, searchQuery, dateFilter, paymentFilter, referenceNow]);

  // Cumulative Totals
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  }, [filteredSales]);

  const totalProfit = useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + (sale.profit || 0), 0);
  }, [filteredSales]);

  const totalLitersDispensed = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const itemsLiters = sale.items?.reduce((sum, item) => sum + (item.liters || 0), 0) || 0;
      return acc + itemsLiters;
    }, 0);
  }, [filteredSales]);

  // Export Sales to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;

    soundFX.playPop();
    const headers = [
      "Receipt ID",
      "Date (Gregorian)",
      "Date (Ethiopian)",
      "Customer",
      "Phone",
      "Payment Method",
      "Items Breakdown",
      "Total Liters",
      "Subtotal",
      "Discount",
      "Total Paid",
      "Gross Profit",
    ];

    const rows = filteredSales.map((s) => {
      const ethDate = formatEthiopianDate(s.date, "medium");
      const gregDate = new Date(s.date).toLocaleString();
      const itemsDesc = s.items?.map((i) => `${i.liters}L ${i.name}`).join(" + ") || "";
      const litersSum = s.items?.reduce((sum, i) => sum + (i.liters || 0), 0) || 0;

      return [
        `"${s.id}"`,
        `"${gregDate}"`,
        `"${ethDate}"`,
        `"${(s.customerName || "Walk-in").replace(/"/g, '""')}"`,
        `"${s.customerPhone || ""}"`,
        `"${s.paymentMethod}"`,
        `"${itemsDesc.replace(/"/g, '""')}"`,
        litersSum.toFixed(2),
        (s.subtotal || s.total).toFixed(2),
        (s.discount || 0).toFixed(2),
        s.total.toFixed(2),
        (s.profit || 0).toFixed(2),
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sukie_sales_${localDateKey()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-content-wrapper animate-fade">
      {/* Top 4 KPI Metric Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Sales Revenue</span>
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
          </div>
          <div className="metric-value">
            {totalLitersDispensed.toFixed(1)} <span className="metric-unit">Liters</span>
          </div>
          <span className="metric-sub">Across all soap varieties sold</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Average Order Value</span>
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
            <option value="Cash">Cash Only (ጥሬ ገንዘብ)</option>
            <option value="Telebirr">Telebirr Only (ቴሌብር)</option>
            <option value="CBE Birr">CBE Birr Only (ሲቢኢ ብር)</option>
          </select>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV} title="Export CSV Spreadsheet">
          <span>Export CSV</span>
        </button>

        {onNavigateToRegister && (
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToRegister}
            title="Open POS Register to record new sale"
          >
            <span>+ New Sale (አዲስ ሽያጭ)</span>
          </button>
        )}
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
                              <span>×</span>
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
