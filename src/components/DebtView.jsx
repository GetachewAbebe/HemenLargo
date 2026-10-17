import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { soundFX } from "../utils/audio";
import { useApp } from "../context";
import DebtStats from "./debts/DebtStats";
import DebtCard from "./debts/DebtCard";
import RepayModal from "./debts/RepayModal";
import NewDebtModal from "./debts/NewDebtModal";
import SearchBar from "./common/SearchBar";
import { calculateDebtMetrics, createManualDebt } from "../services/debtService";
import { getDateDaysAhead, getTodayDateStr } from "../services/formatters";

export default function DebtView(props) {
  const context = useApp();
  const debts = props.debts ?? context.debts;
  const currency = props.currency ?? context.currency;
  const onRecordDebtPayment = props.onRecordDebtPayment ?? context.handleRecordDebtPayment;
  const onAddManualDebt = props.onAddManualDebt ?? context.handleAddManualDebt;
  const onDeleteDebt = props.onDeleteDebt ?? context.handleDeleteDebt;

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
    dueDate: getDateDaysAhead(7),
    notes: "",
  });

  const todayStr = useMemo(() => getTodayDateStr(), []);

  // Metrics using debtService
  const {
    totalOutstanding,
    totalCollected,
    overdueCount,
    activeDebtCount,
  } = useMemo(() => calculateDebtMetrics(debts, todayStr), [debts, todayStr]);

  // Filtered Debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const matchSearch =
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.customerPhone && d.customerPhone.includes(searchQuery)) ||
        (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === "active") matchStatus = d.status !== "Paid" && d.remainingBalance > 0;
      if (statusFilter === "overdue") matchStatus = d.status !== "Paid" && d.dueDate && d.dueDate < todayStr;
      if (statusFilter === "paid") matchStatus = d.status === "Paid" || d.remainingBalance <= 0;

      return matchSearch && matchStatus;
    });
  }, [debts, searchQuery, statusFilter, todayStr]);

  // Handle Payment Modal open
  const handleOpenPaymentModal = (debt) => {
    soundFX.playPop();
    setSelectedDebt(debt);
    setPaymentAmount(debt.remainingBalance.toString());
    setPaymentNote("");
    setPaymentMethod("Telebirr");
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount) return;

    soundFX.playCheckoutChime();

    onRecordDebtPayment({
      debtId: selectedDebt.id,
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      note: paymentNote,
    });

    setIsPaymentModalOpen(false);
  };

  // Submit Manual Debt
  const handleCreateManualDebt = (e) => {
    e.preventDefault();
    if (!newDebtForm.customerName.trim() || !newDebtForm.totalAmount) return;

    soundFX.playPop();

    const debtRecord = createManualDebt({
      customerName: newDebtForm.customerName,
      customerPhone: newDebtForm.customerPhone,
      totalAmount: newDebtForm.totalAmount,
      dueDate: newDebtForm.dueDate,
      notes: newDebtForm.notes,
    });

    onAddManualDebt(debtRecord);
    setIsNewDebtModalOpen(false);
    setNewDebtForm({
      customerName: "",
      customerPhone: "",
      totalAmount: "",
      dueDate: getDateDaysAhead(7),
      notes: "",
    });
  };

  return (
    <div className="debts-layout animate-fade">
      {/* Top Debt Metrics */}
      <DebtStats
        totalOutstanding={totalOutstanding}
        totalCollected={totalCollected}
        activeDebtCount={activeDebtCount}
        overdueCount={overdueCount}
        currency={currency}
      />

      {/* Controls Bar */}
      <div className="inventory-controls-bar">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by customer name, phone number, note..."
          className="inventory-search-wrap"
        />

        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-btn-pill ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Debts
          </button>
          <button
            type="button"
            className={`filter-btn-pill ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Pending / Active ({activeDebtCount})
          </button>
          <button
            type="button"
            className={`filter-btn-pill filter-btn-overdue ${statusFilter === "overdue" ? "active" : ""}`}
            onClick={() => setStatusFilter("overdue")}
          >
            Overdue ({overdueCount})
          </button>
          <button
            type="button"
            className={`filter-btn-pill ${statusFilter === "paid" ? "active" : ""}`}
            onClick={() => setStatusFilter("paid")}
          >
            Fully Settled (Paid)
          </button>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setIsNewDebtModalOpen(true)}
        >
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
          filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              currency={currency}
              todayStr={todayStr}
              onOpenPayment={handleOpenPaymentModal}
              onDeleteDebt={onDeleteDebt}
            />
          ))
        )}
      </div>

      {/* Repayment Modal */}
      <RepayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedDebt={selectedDebt}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentNote={paymentNote}
        setPaymentNote={setPaymentNote}
        onSubmit={handleConfirmPayment}
        currency={currency}
      />

      {/* Manual Debt Creation Modal */}
      <NewDebtModal
        isOpen={isNewDebtModalOpen}
        onClose={() => setIsNewDebtModalOpen(false)}
        newDebtForm={newDebtForm}
        setNewDebtForm={setNewDebtForm}
        onSubmit={handleCreateManualDebt}
        currency={currency}
      />
    </div>
  );
}
