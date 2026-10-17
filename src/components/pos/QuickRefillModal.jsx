import React from "react";
import { RefreshCw, CheckCircle } from "lucide-react";
import Modal from "../common/Modal";

export default function QuickRefillModal({
  product,
  refillAmount,
  setRefillAmount,
  onConfirm,
  onClose,
}) {
  if (!product) return null;

  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title={`Refill ${product.name}`}
      subtitle="Quick tank refill from newly brewed batch"
      icon={RefreshCw}
      maxWidth="440px"
    >
      <form onSubmit={onConfirm} className="modal-form">
        <div className="tank-read-only">
          Current Tank: <strong>{product.stockLiters.toFixed(1)} Liters</strong>
        </div>

        <div className="form-group">
          <label className="form-label">Liters to Add to Tank</label>
          <div className="quick-pay-buttons">
            {[50, 100, 200].map((liters) => (
              <button
                key={liters}
                type="button"
                className="btn-quick-amount"
                onClick={() => setRefillAmount(liters)}
              >
                +{liters}L Barrel
              </button>
            ))}
          </div>
          <input
            type="number"
            step="5"
            min="1"
            required
            className="form-input"
            value={refillAmount}
            onChange={(e) => setRefillAmount(e.target.value)}
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
            <span>Confirm Refill (+{refillAmount}L)</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
