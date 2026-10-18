import React, { useMemo } from "react";
import { Edit2, Check, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";
import Modal from "../common/Modal";

const COLOR_SWATCHES = [
  { hex: "#0d9488", name: "Emerald Largo" },
  { hex: "#0284c7", name: "Ocean Cyan" },
  { hex: "#eab308", name: "Citrus Lemon" },
  { hex: "#e11d48", name: "Berry Rose" },
  { hex: "#8b5cf6", name: "Lavender Mist" },
  { hex: "#d97706", name: "Amber Gold" },
  { hex: "#10b981", name: "Fresh Mint" },
  { hex: "#64748b", name: "Crisp Pure" },
];

export default function EditProductModal({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  onSubmit,
  currency = "ETB",
}) {
  const { profit, marginPct, isProfitable, isThin } = useMemo(() => {
    if (!editForm) return { profit: 0, marginPct: "0.0", isProfitable: true, isThin: false };
    const price = parseFloat(editForm.pricePerLiter) || 0;
    const cost = parseFloat(editForm.costPerLiter) || 0;
    const p = price - cost;
    const m = price > 0 ? (p / price) * 100 : 0;
    return {
      profit: p,
      marginPct: m.toFixed(1),
      isProfitable: p > 0,
      isThin: p > 0 && m < 25,
    };
  }, [editForm]);

  if (!editForm) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Soap Formula"
      subtitle={`Update pricing, formulation details, and thresholds for ${editForm.name}`}
      icon={Edit2}
      maxWidth="580px"
    >
      <form onSubmit={onSubmit} className="modal-form">
        <div className="form-group">
          <label className="form-label">Product Name (English)</label>
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
            <label className="form-label">Selling Price / Liter ({currency}) *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              className="form-input"
              value={editForm.pricePerLiter}
              onChange={(e) =>
                setEditForm({ ...editForm, pricePerLiter: Math.max(0, parseFloat(e.target.value) || 0) })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cost / Liter ({currency}) *</label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              className="form-input"
              value={editForm.costPerLiter}
              onChange={(e) =>
                setEditForm({ ...editForm, costPerLiter: Math.max(0, parseFloat(e.target.value) || 0) })
              }
            />
          </div>
        </div>

        {/* Dynamic Margin Indicator */}
        <div className="live-margin-calc-box">
          <div className="margin-calc-metric">
            <span className="calc-metric-label">Unit Profit</span>
            <strong className="calc-metric-val">
              {profit >= 0 ? `+${profit.toFixed(2)}` : profit.toFixed(2)} {currency}
            </strong>
          </div>
          <div className="margin-calc-metric">
            <span className="calc-metric-label">Gross Margin</span>
            <strong className="calc-metric-val">{marginPct}%</strong>
          </div>
          <div
            className={`margin-health-badge ${
              !isProfitable
                ? "margin-negative"
                : isThin
                ? "margin-thin"
                : "margin-positive"
            }`}
          >
            {!isProfitable ? (
              <>
                <AlertTriangle size={13} />
                <span>Loss</span>
              </>
            ) : isThin ? (
              <>
                <TrendingUp size={13} />
                <span>Thin</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Healthy Margin</span>
              </>
            )}
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Tank Low Alert Limit (Liters)</label>
            <input
              type="number"
              step="5"
              min="0"
              className="form-input"
              value={editForm.minStockAlert || 40}
              onChange={(e) =>
                setEditForm({ ...editForm, minStockAlert: Math.max(0, parseFloat(e.target.value) || 0) })
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

        {/* Theme Color Swatches */}
        <div className="form-group">
          <label className="form-label">Liquid Soap Tint</label>
          <div className="color-swatches-grid">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                title={swatch.name}
                className={`swatch-btn ${
                  editForm.color === swatch.hex ? "swatch-selected" : ""
                }`}
                style={{ backgroundColor: swatch.hex }}
                onClick={() => setEditForm({ ...editForm, color: swatch.hex })}
              />
            ))}
            <input
              type="color"
              className="form-color-picker"
              value={editForm.color || "#0d9488"}
              onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
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
