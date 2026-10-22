import React, { useState, useMemo } from "react";
import {
  CreditCard,
  Search,
  Plus,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Send,
} from "lucide-react";
import { soundFX } from "../utils/audio";
import { formatEthiopianDate, formatEthiopianTime } from "../utils/ethiopianDate";
import { useApp } from "../context";

export default function DebtsView() {
  const {
    debts = [],
    currency = "ETB",
    config = {},
    handleRecordDebtRepayment,
    handleCreateDebt,
    handleDeleteDebt,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'unpaid' | 'partial' | 'settled'
  const [expandedDebtId, setExpandedDebtId] = useState(null);

  // Repayment Modal State
  const [repayModalDebt, setRepayModalDebt] = useState(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState("Cash");
  const [repayNote, setRepayNote] = useState("");

  // New Debt Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDebtNotes, setNewDebtNotes] = useState("");

  // Copy notification state
  const [copiedId, setCopiedId] = useState(null);

  // Metrics
  const totalOutstanding = useMemo(() => {
    return debts
      .filter((d) => d.status !== "Settled")
      .reduce((acc, d) => acc + (d.remainingBalance > 0 ? d.remainingBalance : d.totalAmount - (d.paidAmount || 0)), 0);
  }, [debts]);

  const totalCollected = useMemo(() => {
    return debts.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
  }, [debts]);

  const activeDebtorsCount = useMemo(() => {
    return debts.filter((d) => d.status !== "Settled" && d.remainingBalance > 0).length;
  }, [debts]);

  const settledCount = useMemo(() => {
    return debts.filter((d) => d.status === "Settled" || d.remainingBalance <= 0).length;
  }, [debts]);

  // Filtered list
  const filteredDebts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return debts.filter((d) => {
      // Status filter
      if (statusFilter === "unpaid" && (d.status !== "Unpaid" || d.paidAmount > 0)) return false;
      if (statusFilter === "partial" && d.status !== "Partially Paid") return false;
      if (statusFilter === "settled" && d.status !== "Settled" && d.remainingBalance > 0) return false;

      // Search query
      if (q) {
        const matchName = d.customerName?.toLowerCase().includes(q);
        const matchPhone = d.customerPhone?.includes(q);
        const matchNotes = d.notes?.toLowerCase().includes(q);
        const matchSaleId = d.saleId?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes && !matchSaleId) return false;
      }
      return true;
    });
  }, [debts, statusFilter, searchQuery]);

  // Handle open repayment modal
  const handleOpenRepayModal = (debt) => {
    soundFX.playPop();
    setRepayModalDebt(debt);
    setRepayAmount(debt.remainingBalance.toString());
    setRepayMethod("Cash");
    setRepayNote("");
  };

  // Submit repayment
  const handleSubmitRepay = (e) => {
    e.preventDefault();
    if (!repayModalDebt || !repayAmount) return;
    const amountNum = parseFloat(repayAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    soundFX.playCheckoutChime();
    handleRecordDebtRepayment(repayModalDebt.id, amountNum, repayMethod, repayNote);
    setRepayModalDebt(null);
  };

  // Submit new manual debt
  const handleSubmitNewDebt = (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newDebtAmount) return;
    const amount = parseFloat(newDebtAmount);
    if (isNaN(amount) || amount <= 0) return;

    soundFX.playSuccess();
    const newRecord = {
      id: `debt-${Date.now().toString().slice(-6)}`,
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim() || "N/A",
      saleId: `MANUAL-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      totalAmount: amount,
      paidAmount: 0,
      remainingBalance: amount,
      dueDate: newDueDate || "",
      status: "Unpaid",
      notes: newDebtNotes.trim() || "Manual customer credit entry",
      payments: [],
    };

    handleCreateDebt(newRecord);
    setIsAddModalOpen(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewDebtAmount("");
    setNewDueDate("");
    setNewDebtNotes("");
  };

  // Copy SMS reminder to clipboard
  const handleCopyReminder = (debt) => {
    soundFX.playPop();
    const shop = config.shopName || "Sukie Liquid Soap";
    const phone = config.phone || "";
    const msg = `ሰላም ${debt.customerName}፣ ከ${shop} የወሰዱት ያልተከፈለ ቀሪ ሂሳብ ${debt.remainingBalance.toLocaleString()} ${currency} አለብዎት። እባክዎ በቴሌብር ወይም በባንክ በ${phone} ይክፈሉ። እናመሰግናለን!`;

    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(debt.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  return (
    <div className="debts-view-wrapper animate-fade">
      {/* 1. Header Overview Banner */}
      <div className="debts-hero-banner">
        <div className="debts-hero-left">
          <div className="debts-title-row">
            <div className="debts-avatar-badge">
              <CreditCard size={24} className="text-rose" />
            </div>
            <div>
              <h2 className="debts-main-title">Customer Credit & Debts (የደንበኞች ዕዳ መዝገብ)</h2>
              <p className="debts-subtitle">
                Track customer store credit, record partial repayments, and manage credit collections.
              </p>
            </div>
          </div>
        </div>

        <div className="debts-hero-actions">
          <button
            type="button"
            className="btn-create-debt"
            onClick={() => {
              soundFX.playPop();
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>+ Add New Credit Record (አዲስ ዕዳ)</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="debts-kpi-grid">
        {/* Total Outstanding */}
        <div className="debts-kpi-card card-kpi-rose">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Outstanding Credit (ያልተሰበሰበ ዕዳ)</span>
            <div className="kpi-icon-pill bg-rose-subtle">
              <AlertTriangle size={18} className="text-rose" />
            </div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-num text-rose">
              {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="kpi-currency">{currency}</span>
          </div>
          <span className="kpi-hint-text">
            {activeDebtorsCount} Active Customer{activeDebtorsCount === 1 ? "" : "s"} currently owe money
          </span>
        </div>

        {/* Total Collected */}
        <div className="debts-kpi-card card-kpi-emerald">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Repayments Collected (የተመለሰ ገንዘብ)</span>
            <div className="kpi-icon-pill bg-emerald-subtle">
              <CheckCircle2 size={18} className="text-emerald" />
            </div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-num text-emerald">
              {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="kpi-currency">{currency}</span>
          </div>
          <span className="kpi-hint-text">Successfully recovered credit payments</span>
        </div>

        {/* Active Debtors Count */}
        <div className="debts-kpi-card card-kpi-amber">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Active Customers (ባለዕዳ ደንበኞች)</span>
            <div className="kpi-icon-pill bg-amber-subtle">
              <Users size={18} className="text-amber" />
            </div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-num text-amber">{activeDebtorsCount}</span>
            <span className="kpi-currency">Accounts</span>
          </div>
          <span className="kpi-hint-text">Pending total settlement</span>
        </div>

        {/* Fully Settled */}
        <div className="debts-kpi-card card-kpi-cyan">
          <div className="kpi-card-header">
            <span className="kpi-title-text">Settled Accounts (ሙሉ የተከፈሉ)</span>
            <div className="kpi-icon-pill bg-cyan-subtle">
              <DollarSign size={18} className="text-cyan" />
            </div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-num text-cyan">{settledCount}</span>
            <span className="kpi-currency">Paid Off</span>
          </div>
          <span className="kpi-hint-text">Clear balance without outstanding dues</span>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="debts-toolbar-row">
        <div className="debts-search-wrap">
          <Search size={18} className="search-icon-muted" />
          <input
            type="text"
            className="debts-search-input"
            placeholder="Search customer name, phone number, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="debts-filter-tabs">
          <button
            type="button"
            className={`filter-tab-pill ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("all");
            }}
          >
            All Records ({debts.length})
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${statusFilter === "unpaid" ? "active" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("unpaid");
            }}
          >
            Unpaid (ያልተከፈለ)
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${statusFilter === "partial" ? "active" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("partial");
            }}
          >
            Partially Paid (በከፊል)
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${statusFilter === "settled" ? "active" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("settled");
            }}
          >
            Settled (የተከፈለ)
          </button>
        </div>
      </div>

      {/* 4. Debts Cards Table */}
      <div className="debts-list-container">
        {filteredDebts.length === 0 ? (
          <div className="debts-empty-state">
            <CreditCard size={42} className="empty-icon-muted" />
            <h4 className="empty-title">No customer debt records found</h4>
            <p className="empty-desc">
              {searchQuery
                ? `No records match "${searchQuery}". Try a different keyword.`
                : "No customer credits registered under this filter."}
            </p>
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const isSettled = debt.status === "Settled" || debt.remainingBalance <= 0;
            const percentPaid = Math.min(
              100,
              Math.round(((debt.paidAmount || 0) / (debt.totalAmount || 1)) * 100)
            );
            const isExpanded = expandedDebtId === debt.id;

            return (
              <div
                key={debt.id}
                className={`debt-card-item ${isSettled ? "debt-settled" : "debt-active"}`}
              >
                <div className="debt-card-main-row">
                  {/* Customer Info */}
                  <div className="debt-customer-col">
                    <div className="debt-customer-name-wrap">
                      <span className="debt-customer-name">{debt.customerName}</span>
                      <span
                        className={`debt-status-badge ${
                          isSettled
                            ? "status-settled"
                            : debt.paidAmount > 0
                            ? "status-partial"
                            : "status-unpaid"
                        }`}
                      >
                        {isSettled
                          ? "✓ Settled (የተከፈለ)"
                          : debt.paidAmount > 0
                          ? "Partially Paid"
                          : "Unpaid (ያልተከፈለ)"}
                      </span>
                    </div>

                    <div className="debt-meta-details">
                      {debt.customerPhone && debt.customerPhone !== "N/A" && (
                        <span className="debt-meta-pill">
                          <Phone size={12} />
                          <a href={`tel:${debt.customerPhone}`}>{debt.customerPhone}</a>
                        </span>
                      )}
                      <span className="debt-meta-pill">
                        <Calendar size={12} />
                        <span>Taken: {formatEthiopianDate(debt.date, "medium")}</span>
                      </span>
                      {debt.dueDate && (
                        <span className="debt-meta-pill text-amber">
                          <Clock size={12} />
                          <span>Due: {debt.dueDate}</span>
                        </span>
                      )}
                      {debt.saleId && (
                        <span className="debt-meta-pill text-muted">
                          <span>Ref: {debt.saleId}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Balance Summary */}
                  <div className="debt-financial-col">
                    <div className="debt-balance-wrap">
                      <div className="balance-sub-label">Remaining Balance (ቀሪ ዕዳ)</div>
                      <div className="balance-amount-text">
                        <strong>
                          {debt.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                        <span className="balance-unit">{currency}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="debt-progress-wrap">
                      <div className="debt-progress-track">
                        <div
                          className={`debt-progress-fill ${isSettled ? "fill-emerald" : "fill-rose"}`}
                          style={{ width: `${percentPaid}%` }}
                        ></div>
                      </div>
                      <div className="debt-progress-labels">
                        <span>Paid: {(debt.paidAmount || 0).toLocaleString()} {currency}</span>
                        <span>Total: {debt.totalAmount.toLocaleString()} {currency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="debt-actions-col">
                    {!isSettled && (
                      <button
                        type="button"
                        className="btn-action-repay"
                        onClick={() => handleOpenRepayModal(debt)}
                        title="Record Payment from customer"
                      >
                        <DollarSign size={15} />
                        <span>Record Payment (ክፍያ ተቀበል)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-action-reminder"
                      onClick={() => handleCopyReminder(debt)}
                      title="Copy Amharic SMS reminder to clipboard"
                    >
                      {copiedId === debt.id ? (
                        <>
                          <Check size={14} className="text-emerald" />
                          <span>Copied SMS!</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Copy SMS Reminder</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-action-expand"
                      onClick={() => {
                        soundFX.playPop();
                        setExpandedDebtId(isExpanded ? null : debt.id);
                      }}
                      title="View payment history"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{debt.payments?.length || 0} Payments</span>
                    </button>

                    <button
                      type="button"
                      className="btn-action-delete"
                      onClick={() => {
                        if (window.confirm(`Delete debt record for "${debt.customerName}"?`)) {
                          handleDeleteDebt(debt.id);
                        }
                      }}
                      title="Delete record"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded Payment History Accordion */}
                {isExpanded && (
                  <div className="debt-history-panel animate-fade">
                    <h5 className="history-section-title">
                      Payment History for {debt.customerName}
                    </h5>

                    {(!debt.payments || debt.payments.length === 0) ? (
                      <p className="no-payments-text">
                        No payments recorded yet. Customer has not made any repayments.
                      </p>
                    ) : (
                      <div className="payment-history-timeline">
                        {debt.payments.map((p, idx) => (
                          <div key={p.id || idx} className="payment-timeline-item">
                            <span className="payment-dot"></span>
                            <div className="payment-item-details">
                              <div className="payment-item-top">
                                <strong className="payment-amount text-emerald">
                                  +{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                                </strong>
                                <span className="payment-method-badge">{p.paymentMethod || "Cash"}</span>
                                <span className="payment-date">
                                  {formatEthiopianDate(p.date, "medium")} • {formatEthiopianTime(p.date, false)}
                                </span>
                              </div>
                              {p.note && <span className="payment-note-text">"{p.note}"</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {debt.notes && (
                      <div className="debt-internal-notes">
                        <strong>Initial Notes:</strong> {debt.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Record Repayment */}
      {repayModalDebt && (
        <div className="modal-backdrop animate-fade" onClick={() => setRepayModalDebt(null)}>
          <div className="modal-dialog animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Record Credit Payment (ክፍያ መቀበያ)</h3>
                <span className="modal-subtitle">
                  Customer: <strong>{repayModalDebt.customerName}</strong>
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRepayModalDebt(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRepay} className="modal-form-content">
              {/* Remaining Balance Callout */}
              <div className="repay-balance-callout">
                <span>Total Remaining Balance:</span>
                <strong className="text-rose">
                  {repayModalDebt.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </strong>
              </div>

              {/* Amount Input */}
              <div className="form-group">
                <label className="form-label">Payment Amount Received ({currency})</label>
                <div className="input-with-currency">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max={repayModalDebt.remainingBalance}
                    required
                    className="form-input"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                  />
                  <span className="input-suffix">{currency}</span>
                </div>

                {/* Quick Presets */}
                <div className="quick-repay-presets">
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => setRepayAmount(repayModalDebt.remainingBalance.toString())}
                  >
                    Pay Full ({repayModalDebt.remainingBalance} {currency})
                  </button>
                  {repayModalDebt.remainingBalance > 100 && (
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => setRepayAmount(Math.round(repayModalDebt.remainingBalance / 2).toString())}
                    >
                      Pay 50% ({Math.round(repayModalDebt.remainingBalance / 2)} {currency})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label">Payment Method (የክፍያ መንገድ)</label>
                <div className="payment-options-grid">
                  {["Cash", "Telebirr", "CBE Birr"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`payment-method-chip ${repayMethod === m ? "active" : ""}`}
                      onClick={() => setRepayMethod(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="form-group">
                <label className="form-label">Repayment Note (ማስታወሻ)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Paid in counter cash, Telebirr txn..."
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRepayModalDebt(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={18} />
                  <span>Confirm Payment ({repayAmount} {currency})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Manual Customer Debt */}
      {isAddModalOpen && (
        <div className="modal-backdrop animate-fade" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Record New Customer Credit (አዲስ ዕዳ መዝግብ)</h3>
                <span className="modal-subtitle">Manually add an outstanding store debt for a customer</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewDebt} className="modal-form-content">
              <div className="form-group">
                <label className="form-label">Customer Name (የደንበኛ ስም) *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Abebe Tadesse"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (ስልክ ቁጥር)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0911223344"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Debt Amount (የዕዳው መጠን) *</label>
                <div className="input-with-currency">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    className="form-input"
                    placeholder="0.00"
                    value={newDebtAmount}
                    onChange={(e) => setNewDebtAmount(e.target.value)}
                  />
                  <span className="input-suffix">{currency}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Promised Due Date (የሚከፈልበት ቀን)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2019-02-15 or Next Friday"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (ማስታወሻ - ዕቃ ወይም ምክንያት)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Took 10L Largo Jerrycan, promised to pay next week..."
                  value={newDebtNotes}
                  onChange={(e) => setNewDebtNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={18} />
                  <span>Save Debt Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
