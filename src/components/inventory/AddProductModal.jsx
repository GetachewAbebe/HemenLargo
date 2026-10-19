import React, { useMemo } from "react";
import { Package, Check, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import Modal from "../common/Modal";

const CATEGORY_PRESETS = [
  { id: "General Cleanser", label: "General (Largo)", emoji: "🧼" },
  { id: "Kitchen & Dishes", label: "Dishes & Kitchen", emoji: "🍽️" },
  { id: "Laundry", label: "Laundry & Fabrics", emoji: "👕" },
  { id: "Personal Hygiene", label: "Hand Wash / Care", emoji: "🧴" },
  { id: "Floors & Tiles", label: "Floors & Ceramic", emoji: "🧹" },
  { id: "Sanitizer", label: "Bleach (Barikina)", emoji: "✨" },
  { id: "Automotive", label: "Car Wash Soap", emoji: "🚗" },
  { id: "Glass & Surfaces", label: "Glass & Surface", emoji: "🪟" },
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

const QUICK_EMOJIS = ["🧴", "🧼", "🫧", "🍋", "🌸", "🌿", "✨", "🧽", "🚗", "🧪"];

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
      iconEmoji: prev.iconEmoji || cat.emoji,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Soap Formula"
      subtitle="Define formula specifications, tank volume, and pricing tiers"
      icon={Package}
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
                    className={`btn-category-chip ${newProduct.category === cat.id ? "chip-active" : ""
                      }`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <span className="chip-emoji">{cat.emoji}</span>
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

            {/* Pricing & Production Cost */}
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Retail Price / Liter ({currency}) *</label>
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
                className={`margin-health-badge ${!isProfitable
                    ? "margin-negative"
                    : isThin
                      ? "margin-thin"
                      : "margin-positive"
                  }`}
              >
                {!isProfitable ? (
                  <>
                    <AlertTriangle size={13} />
                    <span>Cost exceeds price</span>
                  </>
                ) : isThin ? (
                  <>
                    <TrendingUp size={13} />
                    <span>Thin margin</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Healthy margin</span>
                  </>
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

            {/* Color Swatches & Emoji Quick Selector */}
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Liquid Soap Tint</label>
                <div className="color-swatches-grid">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      title={swatch.name}
                      className={`swatch-btn ${newProduct.color === swatch.hex ? "swatch-selected" : ""
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

              <div className="form-group">
                <label className="form-label">Formula Icon</label>
                <div className="emoji-quick-row">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`btn-emoji-quick ${newProduct.iconEmoji === emoji ? "emoji-selected" : ""
                        }`}
                      onClick={() => setNewProduct({ ...newProduct, iconEmoji: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
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

              {/* Bottle Simulation Visual */}
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
                <span className="preview-bottle-emoji">
                  {newProduct.iconEmoji || "🧴"}
                </span>
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
                  <span className="preview-chip-tag">🌿 {newProduct.scent}</span>
                )}
              </div>

              {/* Price Banner */}
              <div className="preview-price-box">
                <span className="preview-price-label">Retail / Liter</span>
                <strong className="preview-price-val">
                  {newProduct.pricePerLiter || 0} {currency}
                </strong>
              </div>

              {/* Financial Return Pill */}
              <div
                className={`preview-margin-indicator ${!isProfitable
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
            <Check size={18} />
            <span>Save & Add to Tank Farm</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
