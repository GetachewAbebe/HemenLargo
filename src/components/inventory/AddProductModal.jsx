import React, { useMemo } from "react";
import Modal from "../common/Modal";

const CATEGORY_PRESETS = [
  { id: "General Cleanser", label: "General (Largo)" },
  { id: "Kitchen & Dishes", label: "Dishes & Kitchen" },
  { id: "Laundry", label: "Laundry & Fabrics" },
  { id: "Personal Hygiene", label: "Hand Wash / Care" },
  { id: "Floors & Tiles", label: "Floors & Ceramic" },
  { id: "Sanitizer", label: "Bleach (Barikina)" },
  { id: "Automotive", label: "Car Wash Soap" },
  { id: "Glass & Surfaces", label: "Glass & Surface" },
];

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

export default function AddProductModal({
  isOpen,
  onClose,
  newProduct,
  setNewProduct,
  onSubmit,
  currency = "ETB",
}) {
  // Live margin & profit calculation
  const { profit, marginPct, isProfitable, isThin } = useMemo(() => {
    const price = parseFloat(newProduct.pricePerLiter) || 0;
    const cost = parseFloat(newProduct.costPerLiter) || 0;
    const p = price - cost;
    const m = price > 0 ? (p / price) * 100 : 0;
    return {
      profit: p,
      marginPct: m.toFixed(1),
      isProfitable: p > 0,
      isThin: p > 0 && m < 25,
    };
  }, [newProduct.pricePerLiter, newProduct.costPerLiter]);

  const handleCategorySelect = (cat) => {
    setNewProduct((prev) => ({
      ...prev,
      category: cat.id,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Soap Formula"
      subtitle="Define formula specifications, tank volume, and pricing tiers"
      maxWidth="860px"
      className="modal-xl"
    >
      <form onSubmit={onSubmit} className="modal-form">
        <div className="modal-split-container">
          {/* Left Column: Input Form Fields */}
          <div className="modal-split-form-col">
            {/* Name Fields */}
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Soap Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultra Foam Dish Cleaner"
                  className="form-input"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Amharic Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. የዕቃ ሳሙና (ሱፐር)"
                  className="form-input"
                  value={newProduct.localName}
                  onChange={(e) => setNewProduct({ ...newProduct, localName: e.target.value })}
                />
              </div>
            </div>

            {/* Category Quick Chips */}
            <div className="form-group">
              <label className="form-label">
                <span>Category</span>
                <span className="form-label-hint">Select matching cleanser type</span>
              </label>
              <div className="category-chips-grid">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`btn-category-chip ${
                      newProduct.category === cat.id ? "chip-active" : ""
                    }`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fragrance / Scent */}
            <div className="form-group">
              <label className="form-label">Fragrance / Scent</label>
              <input
                type="text"
                placeholder="e.g. Lemon Breeze, Strawberry, Pine, Lavender, Ocean"
                className="form-input"
                value={newProduct.scent}
                onChange={(e) => setNewProduct({ ...newProduct, scent: e.target.value })}
              />
            </div>

            {/* Retail prices by container size and production cost */}
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Selling Price / 1 L ({currency}) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="e.g. 70"
                  className="form-input"
                  value={newProduct.pricePerLiter}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, pricePerLiter: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price / 0.5 L ({currency}) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="e.g. 40"
                  className="form-input"
                  value={newProduct.pricePerHalfLiter}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, pricePerHalfLiter: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Production Cost / Liter ({currency}) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="e.g. 38"
                  className="form-input"
                  value={newProduct.costPerLiter}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, costPerLiter: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Dynamic Profit & Margin Summary */}
            <div className="live-margin-calc-box">
              <div className="margin-calc-metric">
                <span className="calc-metric-label">Estimated Profit / L</span>
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
                  <span>Cost exceeds price</span>
                ) : isThin ? (
                  <span>Thin margin</span>
                ) : (
                  <span>Healthy margin</span>
                )}
              </div>
            </div>

            {/* Tank Capacity & Alerts */}
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Initial Tank Stock (Liters) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="e.g. 150"
                  className="form-input"
                  value={newProduct.stockLiters}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stockLiters: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Alert Threshold (Liters)</label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  placeholder="e.g. 40"
                  className="form-input"
                  value={newProduct.minStockAlert}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, minStockAlert: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div className="form-group">
              <label className="form-label">Liquid Soap Tint</label>
              <div className="color-swatches-grid">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    title={swatch.name}
                    className={`swatch-btn ${
                      newProduct.color === swatch.hex ? "swatch-selected" : ""
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    onClick={() => setNewProduct({ ...newProduct, color: swatch.hex })}
                  />
                ))}
                <input
                  type="color"
                  className="form-color-picker"
                  title="Custom tint picker"
                  value={newProduct.color || "#0d9488"}
                  onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Product Preview Card */}
          <div className="modal-split-preview-col">
            <span className="preview-col-label">
              <span className="live-badge-dot"></span>
              Live Product Card Preview
            </span>

            <div className="live-product-card-preview">
              <div
                className="preview-card-accent-bar"
                style={{ backgroundColor: newProduct.color || "#0d9488" }}
              />

              {/* Tank Level Simulation Visual */}
              <div className="preview-bottle-container">
                <div
                  className="preview-liquid-fill"
                  style={{
                    backgroundColor: newProduct.color || "#0d9488",
                    height: `${Math.min(
                      90,
                      Math.max(25, ((newProduct.stockLiters || 100) / 600) * 100)
                    )}%`,
                  }}
                >
                  <div className="preview-liquid-wave"></div>
                </div>
              </div>

              {/* Title & Info */}
              <div className="preview-text-block">
                <h4 className="preview-product-name">
                  {newProduct.name || "Formula Name..."}
                </h4>
                <span className="preview-product-local">
                  {newProduct.localName || "የፈሳሽ ሳሙና ስም"}
                </span>
              </div>

              {/* Tags */}
              <div className="preview-tags-row">
                <span className="preview-chip-tag">
                  {newProduct.category || "General Cleanser"}
                </span>
                {newProduct.scent && (
                  <span className="preview-chip-tag">{newProduct.scent}</span>
                )}
              </div>

              {/* Price Banner */}
              <div className="preview-price-box">
                <span className="preview-price-label">Retail prices</span>
                <strong className="preview-price-val">
                  1 L: {newProduct.pricePerLiter || 0} {currency}
                </strong>
                <strong className="preview-price-val">
                  0.5 L: {newProduct.pricePerHalfLiter || 0} {currency}
                </strong>
              </div>

              {/* Financial Return Pill */}
              <div
                className={`preview-margin-indicator ${
                  !isProfitable
                    ? "margin-negative"
                    : isThin
                    ? "margin-thin"
                    : "margin-positive"
                }`}
              >
                <span>Unit Margin</span>
                <span>
                  {profit >= 0 ? `+${profit.toFixed(1)}` : profit.toFixed(1)} {currency} (
                  {marginPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-modal-submit">
            <span>Save & Add to Tank Farm</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
