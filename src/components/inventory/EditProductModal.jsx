import React from "react";
import { Edit2, Check } from "lucide-react";
import Modal from "../common/Modal";

export default function EditProductModal({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  onSubmit,
  currency = "ETB",
}) {
  if (!editForm) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Soap Product"
      subtitle={`Update pricing and details for ${editForm.name}`}
      icon={Edit2}
      maxWidth="500px"
    >
      <form onSubmit={onSubmit} className="modal-form">
        <div className="form-group">
          <label className="form-label">Product Name</label>
          <input
            type="text"
            required
            className="form-input"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Local / Amharic Name</label>
            <input
              type="text"
              className="form-input"
              value={editForm.localName || ""}
              onChange={(e) => setEditForm({ ...editForm, localName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-input"
              value={editForm.category || ""}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Selling Price / Liter ({currency})</label>
            <input
              type="number"
              step="0.5"
              required
              className="form-input"
              value={editForm.pricePerLiter}
              onChange={(e) =>
                setEditForm({ ...editForm, pricePerLiter: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cost / Liter ({currency})</label>
            <input
              type="number"
              step="0.5"
              required
              className="form-input"
              value={editForm.costPerLiter}
              onChange={(e) =>
                setEditForm({ ...editForm, costPerLiter: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Tank Low Alert Limit (Liters)</label>
            <input
              type="number"
              step="5"
              className="form-input"
              value={editForm.minStockAlert || 40}
              onChange={(e) =>
                setEditForm({ ...editForm, minStockAlert: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fragrance / Scent</label>
            <input
              type="text"
              className="form-input"
              value={editForm.scent || ""}
              onChange={(e) => setEditForm({ ...editForm, scent: e.target.value })}
            />
          </div>
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
            <span>Save Product Changes</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
