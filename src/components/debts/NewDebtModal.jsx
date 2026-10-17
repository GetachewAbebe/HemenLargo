import React from "react";
import { Users, Check } from "lucide-react";
import Modal from "../common/Modal";

export default function NewDebtModal({
  isOpen,
  onClose,
  newDebtForm,
  setNewDebtForm,
  onSubmit,
  currency = "ETB",
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Customer Credit"
      subtitle="Track money owed to your soap shop"
      icon={Users}
      maxWidth="480px"
    >
      <form onSubmit={onSubmit} className="modal-form">
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
            <label className="form-label">Total Credit Amount ({currency}) *</label>
            <input
              type="number"
              step="1"
              required
              placeholder="Amount owed..."
              className="form-input"
              value={newDebtForm.totalAmount}
              onChange={(e) =>
                setNewDebtForm({ ...newDebtForm, totalAmount: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Promised Repayment Due Date</label>
          <input
            type="date"
            className="form-input"
            value={newDebtForm.dueDate}
            onChange={(e) =>
              setNewDebtForm({ ...newDebtForm, dueDate: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes / Items Taken</label>
          <textarea
            rows="2"
            placeholder="e.g. Took 20L Largo jerrycan on credit, promised to settle on Friday."
            className="form-textarea"
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
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="btn-modal-submit">
            <Check size={18} />
            <span>Save Credit Entry</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
