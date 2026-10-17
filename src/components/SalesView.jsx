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

export default function SalesView({
  sales,
  currency = "ETB",
  onSelectReceipt,
  onVoidSale,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Date filtering logic
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const filteredSales = useMemo(() => {
    const nowTime = Date.now();
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);

      // Date filter
      if (dateFilter === "today") {
        if (!sale.date.startsWith(todayStr)) return false;
      } else if (dateFilter === "week") {
        const oneWeekAgo = new Date(nowTime - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < oneWeekAgo) return false;
      } else if (dateFilter === "month") {
        const oneMonthAgo = new Date(nowTime - 30 * 24 * 60 * 60 * 1000);
        if (saleDate < oneMonthAgo) return false;
      }

      // Payment method filter
      if (paymentFilter !== "all" && sale.paymentMethod !== paymentFilter) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchId = sale.id.toLowerCase().includes(q);
        const matchCustomer =
          (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
          (sale.customerPhone && sale.customerPhone.includes(q));
        const matchItems = sale.items?.some((i) =>
          i.name.toLowerCase().includes(q)
        );
        if (!matchId && !matchCustomer && !matchItems) return false;
      }

      return true;
    });
  }, [sales, dateFilter, paymentFilter, searchQuery, todayStr]);

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
      "Date",
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
      new Date(s.date).toLocaleString(),
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
    link.setAttribute("download", `sukie_sales_${todayStr}.csv`);
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
            All Time
          </button>
          <button
            className={`filter-btn-pill ${dateFilter === "today" ? "active" : ""}`}
            onClick={() => setDateFilter("today")}
          >
            Today
          </button>
          <button
            className={`filter-btn-pill ${dateFilter === "week" ? "active" : ""}`}
            onClick={() => setDateFilter("week")}
          >
            Last 7 Days
          </button>
          <button
            className={`filter-btn-pill ${dateFilter === "month" ? "active" : ""}`}
            onClick={() => setDateFilter("month")}
          >
            This Month
          </button>
        </div>

        {/* Payment Filter */}
        <div className="category-select-wrap">
          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash Only</option>
            <option value="Telebirr">Telebirr Only</option>
            <option value="CBE Birr">CBE Birr Only</option>
            <option value="Credit">Credit (ዕዳ) Only</option>
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
                    No sales records found matching your filter criteria.
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
                          <span>{new Date(sale.date).toLocaleDateString()}</span>
                          <span className="time-sub">
                            {new Date(sale.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
