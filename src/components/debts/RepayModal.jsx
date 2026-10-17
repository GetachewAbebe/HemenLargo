import React from "react";
import { DollarSign, CheckCircle, Smartphone, Banknote, CreditCard } from "lucide-react";
import Modal from "../common/Modal";

export default function RepayModal({
  isOpen,
  onClose,
  selectedDebt,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentNote,
  setPaymentNote,
  onSubmit,
  currency = "ETB",
}) {
  if (!selectedDebt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Debt Repayment (ዕዳ ክፍያ)"
      subtitle={`Collecting payment from ${selectedDebt.customerName}`}
      icon={DollarSign}
      maxWidth="480px"
    >
      <form onSubmit={onSubmit} className="modal-form">
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
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="btn-modal-submit">
            <CheckCircle size={18} />
            <span>Confirm Payment & Update Balance</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
