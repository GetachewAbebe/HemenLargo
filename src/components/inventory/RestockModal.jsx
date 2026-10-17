import React from "react";
import { RefreshCw, Check } from "lucide-react";
import Modal from "../common/Modal";

export default function RestockModal({
  isOpen,
  onClose,
  product,
  restockLiters,
  setRestockLiters,
  restockCost,
  setRestockCost,
  onSubmit,
  currency = "ETB",
}) {
  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restock Bulk Liters"
      subtitle={`Add freshly mixed bulk batch to ${product.name}`}
      icon={RefreshCw}
      maxWidth="480px"
    >
      <form onSubmit={onSubmit} className="modal-form">
        <div className="current-tank-banner">
          <div>
            <span className="banner-sub">Current Tank Volume</span>
            <strong className="banner-val">{product.stockLiters.toFixed(1)} Liters</strong>
          </div>
          <div>
            <span className="banner-sub">Current Cost/L</span>
            <strong className="banner-val">
              {product.costPerLiter} {currency}
            </strong>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Liters to Add (L) *</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            required
            placeholder="Enter liters brewed or purchased..."
            className="form-input"
            value={restockLiters}
            onChange={(e) => setRestockLiters(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Batch Cost per Liter ({currency})</label>
          <input
            type="number"
            step="0.5"
            required
            className="form-input"
            value={restockCost}
            onChange={(e) => setRestockCost(e.target.value)}
          />
          <span className="input-hint">
            Total batch investment:{" "}
            {((parseFloat(restockLiters) || 0) * (parseFloat(restockCost) || 0)).toFixed(2)}{" "}
            {currency}
          </span>
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
            <span>Confirm Tank Refill</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
