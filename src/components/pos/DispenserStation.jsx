import React from "react";
import { Droplets, RefreshCw, Plus } from "lucide-react";
import { CONTAINER_PRESETS } from "../../constants/containers";

export default function DispenserStation({
  product,
  currency = "ETB",
  customLiterVal = "",
  onCustomLiterChange,
  onAddToCart,
  onOpenRefillModal,
}) {
  const isLargo = product.id === "prod-1" || product.name.includes("Largo");
  const isLowStock = product.stockLiters <= (product.minStockAlert || 50);
  const tankCapacity = 600;
  const tankPercent = Math.min(100, Math.round((product.stockLiters / tankCapacity) * 100));

  return (
    <div className={`dispenser-station-card ${isLargo ? "station-largo" : "station-barikina"}`}>
      {/* Station Header */}
      <div className="station-header">
        <div className="station-title-wrap">
          <div className="station-icon-bubble">
            <span className="station-emoji">{product.iconEmoji || (isLargo ? "🧴" : "✨")}</span>
          </div>
          <div>
            <div className="station-tag-row">
              <span className="station-badge">
                {isLargo ? "Station 1 • Multi-purpose" : "Station 2 • Disinfectant Bleach"}
              </span>
            </div>
            <h2 className="station-name">{product.name}</h2>
            <span className="station-subname">{product.localName}</span>
          </div>
        </div>

        <div className="station-rate-pill">
          <span className="rate-amount">{product.pricePerLiter}</span>
          <span className="rate-unit">{currency} / L</span>
        </div>
      </div>

      {/* Tank Level Gauge */}
      <div className="station-tank-box">
        <div className="tank-gauge-info">
          <div className="tank-status-left">
            <Droplets size={16} className={isLargo ? "text-teal" : "text-cyan"} />
            <span>Tank:</span>
            <strong className="tank-liters-bold">{product.stockLiters.toFixed(1)} L</strong>
            <span className="capacity-sub">/ 600L</span>
          </div>
          <div className="tank-actions-right">
            <span className={`stock-status-pill ${isLowStock ? "pill-low" : "pill-ok"}`}>
              {isLowStock ? "Low Stock" : `${tankPercent}% Full`}
            </span>
            <button
              type="button"
              className="btn-quick-refill-station"
              title="Add liters directly to barrel"
              onClick={() => onOpenRefillModal(product)}
            >
              <RefreshCw size={12} />
              <span>Refill</span>
            </button>
          </div>
        </div>
        <div className="tank-liquid-track">
          <div
            className={`tank-liquid-fill ${isLargo ? "liquid-teal" : "liquid-cyan"}`}
            style={{ width: `${tankPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Container Options Grid */}
      <div className="station-containers-section">
        <span className="section-micro-label">TAP TO ADD CONTAINER:</span>
        <div className="container-presets-grid">
          {CONTAINER_PRESETS.map((preset) => {
            const calculatedPrice = (preset.liters * product.pricePerLiter).toFixed(0);
            return (
              <button
                key={preset.label}
                type="button"
                className={`btn-container-card ${preset.popular ? "popular-card" : ""}`}
                onClick={() => onAddToCart(product, preset.liters)}
                disabled={product.stockLiters < preset.liters}
              >
                {preset.popular && <span className="popular-badge">★ Best Seller</span>}
                <div className="container-icon-row">
                  <span className="container-icon">{preset.icon}</span>
                  <span className="container-size-tag">{preset.label}</span>
                </div>
                <span className="container-title">{preset.name}</span>
                <span className="container-price-tag">
                  {calculatedPrice} <span className="unit-small">{currency}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Liter Input & Quick Stepper */}
      <div className="station-custom-pump">
        <div className="custom-pump-header">
          <span className="section-micro-label">CUSTOM LITERS / REFILL:</span>
          <div className="quick-chip-buttons">
            {[0.5, 1, 2, 5].map((amt) => (
              <button
                key={amt}
                type="button"
                className="quick-chip-btn"
                onClick={() => onAddToCart(product, amt)}
              >
                +{amt}L
              </button>
            ))}
          </div>
        </div>

        <div className="custom-pump-row">
          <div className="pump-input-box">
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Liters (e.g. 2.5)"
              className="pump-input"
              value={customLiterVal}
              onChange={(e) => onCustomLiterChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customLiterVal) {
                  onAddToCart(product, customLiterVal);
                  onCustomLiterChange("");
                }
              }}
            />
            <span className="pump-unit">L</span>
          </div>

          <button
            type="button"
            disabled={!customLiterVal || parseFloat(customLiterVal) <= 0}
            className="btn-pump-add"
            onClick={() => {
              if (customLiterVal) {
                onAddToCart(product, customLiterVal);
                onCustomLiterChange("");
              }
            }}
          >
            <Plus size={15} />
            <span>
              {customLiterVal && parseFloat(customLiterVal) > 0
                ? `Add ${(parseFloat(customLiterVal) * product.pricePerLiter).toFixed(0)} ${currency}`
                : "Add"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
