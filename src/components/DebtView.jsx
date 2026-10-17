import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Phone,
  Calendar,
  Clock,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import { soundFX } from "../utils/audio";

const getSevenDaysAhead = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};

export default function DebtView({
  debts,
  currency = "ETB",
  onRecordDebtPayment,
  onAddManualDebt,
  onDeleteDebt,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Telebirr");
  const [paymentNote, setPaymentNote] = useState("");

  // New Manual Debt Modal State
  const [isNewDebtModalOpen, setIsNewDebtModalOpen] = useState(false);
  const [newDebtForm, setNewDebtForm] = useState({
    customerName: "",
    customerPhone: "",
    totalAmount: "",
    dueDate: getSevenDaysAhead(),
    notes: "",
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // Calculations
  const activeDebts = debts.filter((d) => d.status !== "Paid");
  const totalOutstanding = activeDebts.reduce((acc, d) => acc + (d.remainingBalance || 0), 0);
  const totalCollected = debts.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
  const overdueCount = activeDebts.filter((d) => d.dueDate && d.dueDate < todayStr).length;

  const filteredDebts = debts.filter((d) => {
    if (statusFilter === "active" && d.status === "Paid") return false;
    if (statusFilter === "paid" && d.status !== "Paid") return false;
    if (statusFilter === "overdue" && (d.status === "Paid" || !d.dueDate || d.dueDate >= todayStr)) return false;

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = d.customerName && d.customerName.toLowerCase().includes(q);
      const matchPhone = d.customerPhone && d.customerPhone.includes(q);
      const matchNotes = d.notes && d.notes.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchNotes) return false;
    }
    return true;
  });

  const handleOpenPaymentModal = (debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remainingBalance);
    setPaymentMethod("Telebirr");
    setPaymentNote("");
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    soundFX.playCoin();

    onRecordDebtPayment({
      debtId: selectedDebt.id,
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      note: paymentNote,
    });

    setIsPaymentModalOpen(false);
  };

  const handleCreateManualDebt = (e) => {
    e.preventDefault();
    if (!newDebtForm.customerName.trim() || !newDebtForm.totalAmount) return;

    soundFX.playPop();

    const debtRecord = {
      id: `debt-${Date.now().toString().slice(-6)}`,
      customerName: newDebtForm.customerName.trim(),
      customerPhone: newDebtForm.customerPhone.trim() || "N/A",
      date: new Date().toISOString(),
      totalAmount: parseFloat(newDebtForm.totalAmount) || 0,
      paidAmount: 0,
      remainingBalance: parseFloat(newDebtForm.totalAmount) || 0,
      dueDate: newDebtForm.dueDate || getSevenDaysAhead(),
      status: "Unpaid",
      notes: newDebtForm.notes.trim() || "Manual credit balance",
    };

    onAddManualDebt(debtRecord);
    setIsNewDebtModalOpen(false);
    setNewDebtForm({
      customerName: "",
      customerPhone: "",
      totalAmount: "",
      dueDate: getSevenDaysAhead(),
      notes: "",
    });
  };

  return (
    <div className="debts-layout animate-fade">
      {/* Top Debt Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Outstanding Debts (ዕዳ)</span>
            <div className="metric-icon-wrap stat-rose">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value text-rose">
            {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Across {activeDebts.length} active customers</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Recovered / Repaid</span>
            <div className="metric-icon-wrap stat-emerald">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="metric-value text-emerald">
            {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Payments collected back from credit</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Customers with Debt</span>
            <div className="metric-icon-wrap stat-purple">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{activeDebts.length} Customers</div>
          <span className="metric-sub">Regular clients & bulk buyers</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Overdue Repayments</span>
            <div className={`metric-icon-wrap ${overdueCount > 0 ? "stat-rose" : "stat-emerald"}`}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="metric-value">
            {overdueCount} <span className="metric-unit">Overdue</span>
          </div>
          <span className="metric-sub">
            {overdueCount > 0 ? "Past promised repayment date" : "All customer debts on schedule"}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="inventory-controls-bar">
        <div className="inventory-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="inventory-search-input"
            placeholder="Search by customer name, phone number, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pill-group">
          <button
            className={`filter-btn-pill ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Debts
          </button>
          <button
            className={`filter-btn-pill ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Pending / Active ({activeDebts.length})
          </button>
          <button
            className={`filter-btn-pill filter-btn-overdue ${statusFilter === "overdue" ? "active" : ""}`}
            onClick={() => setStatusFilter("overdue")}
          >
            Overdue ({overdueCount})
          </button>
          <button
            className={`filter-btn-pill ${statusFilter === "paid" ? "active" : ""}`}
            onClick={() => setStatusFilter("paid")}
          >
            Fully Settled (Paid)
          </button>
        </div>

        <button className="btn-secondary" onClick={() => setIsNewDebtModalOpen(true)}>
          <Plus size={18} />
          <span>Record Customer Credit</span>
        </button>
      </div>

      {/* Debt Cards Grid */}
      <div className="debt-cards-grid">
        {filteredDebts.length === 0 ? (
          <div className="empty-panel">
            <div className="empty-bubble-icon">🎉</div>
            <h3>No Debts Found</h3>
            <p>No customer credit records matching your selected filter.</p>
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const isSettled = debt.status === "Paid" || debt.remainingBalance <= 0;
            const isOverdue = !isSettled && debt.dueDate && debt.dueDate < todayStr;
            const percentPaid = Math.min(
              100,
              debt.totalAmount > 0 ? Math.round((debt.paidAmount / debt.totalAmount) * 100) : 100
            );

            return (
              <div
                key={debt.id}
                className={`debt-card animate-fade ${
                  isSettled ? "card-settled" : isOverdue ? "card-overdue" : ""
                }`}
              >
                <div className="debt-card-header">
                  <div>
                    <h3 className="debt-customer-name">{debt.customerName}</h3>
                    {debt.customerPhone && (
                      <div className="debt-phone-row">
                        <Phone size={13} />
                        <span>{debt.customerPhone}</span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`badge-pill ${
                      isSettled
                        ? "badge-success"
                        : debt.paidAmount > 0
                        ? "badge-warning"
                        : "badge-danger"
                    }`}
                  >
                    {isSettled ? "Fully Paid" : debt.paidAmount > 0 ? "Partially Paid" : "Unpaid"}
                  </span>
                </div>

                {/* Progress of repayment */}
                <div className="debt-progress-box">
                  <div className="debt-progress-numbers">
                    <span>
                      Paid: <strong>{debt.paidAmount.toLocaleString()} {currency}</strong>
                    </span>
                    <span className="percent-tag">{percentPaid}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${isSettled ? "fill-emerald" : "fill-teal"}`}
                      style={{ width: `${percentPaid}%` }}
                    ></div>
                  </div>
                </div>

                <div className="debt-balance-highlight">
                  <span className="balance-label">Remaining Balance:</span>
                  <span className={`balance-number ${isSettled ? "text-emerald" : "text-rose"}`}>
                    {debt.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    {currency}
                  </span>
                </div>

                <div className="debt-details-list">
                  <div className="debt-detail-item">
                    <Clock size={14} />
                    <span>Issued: {new Date(debt.date).toLocaleDateString()}</span>
                  </div>
                  {debt.dueDate && (
                    <div
                      className={`debt-detail-item ${isOverdue ? "text-rose font-semibold" : ""}`}
                    >
                      <Calendar size={14} />
                      <span>
                        Due: {debt.dueDate} {isOverdue && "(Overdue!)"}
                      </span>
                    </div>
                  )}
                  {debt.notes && <div className="debt-note-text">"{debt.notes}"</div>}
                </div>

                {/* Actions */}
                <div className="debt-card-actions">
                  {!isSettled ? (
                    <>
                      <button
                        className="btn-record-payment"
                        onClick={() => handleOpenPaymentModal(debt)}
                      >
                        <DollarSign size={16} />
                        <span>Record Repayment</span>
                      </button>

                      {debt.customerPhone && debt.customerPhone !== "N/A" && (
                        <div className="debt-outreach-group">
                          <a
                            href={`tel:${debt.customerPhone}`}
                            className="btn-outreach-icon"
                            title={`Call ${debt.customerName}`}
                          >
                            <PhoneCall size={14} />
                          </a>
                          <a
                            href={`sms:${debt.customerPhone}?body=${encodeURIComponent(
                              `ሰላም ${debt.customerName}፣ ከ${currency === "ETB" ? "ሱቄ ፈሳሽ ሳሙና" : "Sukie Soap"} የወሰዱት ${debt.remainingBalance} ${currency} ቀሪ ዕዳ ክፍያ ቀን ደርሷል። እናመሰግናለን!`
                            )}`}
                            className="btn-outreach-icon"
                            title="Send SMS Payment Reminder"
                          >
                            <MessageSquare size={14} />
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="settled-stamp">
                      <CheckCircle size={16} />
                      <span>Debt Settled</span>
                    </div>
                  )}
                  <button
                    className="btn-delete-debt"
                    title="Remove debt record"
                    onClick={() => {
                      if (window.confirm(`Delete debt record for ${debt.customerName}?`)) {
                        onDeleteDebt(debt.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Repayment Modal */}
      {isPaymentModalOpen && selectedDebt && (
        <div className="modal-backdrop animate-fade">
          <div className="modal-box animate-pop">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="stat-icon-wrapper stat-emerald">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Record Debt Payment</h3>
                  <p className="modal-subtitle">
                    Receiving money from: <strong>{selectedDebt.customerName}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="modal-form">
              <div className="repayment-summary-banner">
                <div>
                  <span className="summary-label">Total Debt:</span>
                  <strong>
                    {selectedDebt.totalAmount.toLocaleString()} {currency}
                  </strong>
                </div>
                <div>
                  <span className="summary-label">Current Balance:</span>
                  <strong className="text-rose">
                    {selectedDebt.remainingBalance.toLocaleString()} {currency}
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount ({currency}) *</label>
                <div className="quick-pay-buttons">
                  <button
                    type="button"
                    className="btn-quick-amount"
                    onClick={() => setPaymentAmount(selectedDebt.remainingBalance)}
                  >
                    Pay Full Balance ({selectedDebt.remainingBalance} {currency})
                  </button>
                  {selectedDebt.remainingBalance > 100 && (
                    <button
                      type="button"
                      className="btn-quick-amount"
                      onClick={() => setPaymentAmount((selectedDebt.remainingBalance / 2).toFixed(0))}
                    >
                      Pay Half ({(selectedDebt.remainingBalance / 2).toFixed(0)} {currency})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={selectedDebt.remainingBalance}
                  required
                  className="form-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Received Via</label>
                <div className="payment-options-grid">
                  <button
                    type="button"
                    className={`payment-pill ${paymentMethod === "Telebirr" ? "selected telebirr" : ""}`}
                    onClick={() => setPaymentMethod("Telebirr")}
                  >
                    <Smartphone size={16} />
                    <span>Telebirr</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-pill ${paymentMethod === "Cash" ? "selected cash" : ""}`}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    <Banknote size={16} />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-pill ${paymentMethod === "CBE Birr" ? "selected cbe" : ""}`}
                    onClick={() => setPaymentMethod("CBE Birr")}
                  >
                    <CreditCard size={16} />
                    <span>CBE / Bank</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Memo / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Received via Telebirr ref #..."
                  className="form-input"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <CheckCircle size={18} />
                  <span>Confirm Payment & Update Balance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Debt Creation Modal */}
      {isNewDebtModalOpen && (
        <div className="modal-backdrop animate-fade">
          <div className="modal-box animate-pop">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="stat-icon-wrapper stat-rose">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Record New Customer Credit</h3>
                  <p className="modal-subtitle">Track money owed to your soap shop</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsNewDebtModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualDebt} className="modal-form">
              <div className="form-group">
                <label className="form-label">Customer / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almaz Kebede or Sunshine Hotel"
                  className="form-input"
                  value={newDebtForm.customerName}
                  onChange={(e) =>
                    setNewDebtForm({ ...newDebtForm, customerName: e.target.value })
                  }
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="09..."
                    className="form-input"
                    value={newDebtForm.customerPhone}
                    onChange={(e) =>
                      setNewDebtForm({ ...newDebtForm, customerPhone: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Amount ({currency}) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 1500"
                    className="form-input"
                    value={newDebtForm.totalAmount}
                    onChange={(e) =>
                      setNewDebtForm({ ...newDebtForm, totalAmount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Promised Repayment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newDebtForm.dueDate || ""}
                  onChange={(e) =>
                    setNewDebtForm({ ...newDebtForm, dueDate: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (What was taken, container info)</label>
                <textarea
                  rows="2"
                  className="form-input"
                  placeholder="e.g. Took 20L dish soap jerrycan, promised to pay next week..."
                  value={newDebtForm.notes}
                  onChange={(e) =>
                    setNewDebtForm({ ...newDebtForm, notes: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsNewDebtModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <CheckCircle size={18} />
                  <span>Save Credit Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
