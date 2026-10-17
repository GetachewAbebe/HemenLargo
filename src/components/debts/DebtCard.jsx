import React from "react";
import { Phone, DollarSign, Clock, Calendar, PhoneCall, MessageSquare, Trash2 } from "lucide-react";

export default function DebtCard({
  debt,
  currency = "ETB",
  todayStr,
  onOpenPayment,
  onDeleteDebt,
}) {
  const isSettled = debt.status === "Paid" || debt.remainingBalance <= 0;
  const isOverdue = !isSettled && debt.dueDate && debt.dueDate < todayStr;
  const percentPaid = Math.min(
    100,
    debt.totalAmount > 0 ? Math.round((debt.paidAmount / debt.totalAmount) * 100) : 100
  );

  return (
    <div
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
              type="button"
              className="btn-record-payment"
              onClick={() => onOpenPayment(debt)}
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
                  title={`SMS Reminder to ${debt.customerName}`}
                >
                  <MessageSquare size={14} />
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="settled-tag">
            <span>✓ Debt Fully Settled</span>
          </div>
        )}

        <button
          type="button"
          className="btn-delete-debt"
          onClick={() => {
            if (window.confirm(`Delete debt record for ${debt.customerName}?`)) {
              onDeleteDebt(debt.id);
            }
          }}
          title="Delete Record"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
