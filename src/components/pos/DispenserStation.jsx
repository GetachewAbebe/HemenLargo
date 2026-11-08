import React from "react";
import { soundFX } from "../../utils/audio";
import { CONTAINER_PRESETS } from "../../constants/containers";

export default function DispenserStation({
  product,
  currency = "ETB",
  customLiterVal = "",
  onCustomLiterChange,
  onAddToCart,
}) {
  const isLargo =
    product.id === "prod-1" ||
    product.id === "prod-largo" ||
    product.name?.includes("Largo") ||
    product.name?.includes("ላርጎ");
  const productCategory =
    product.category || (isLargo ? "Liquid soap" : "Bleach & sanitizer");
  const stock = Number(product.stockLiters) || 0;
  const price = Number(product.pricePerLiter) || 0;
  const isLowStock = stock <= (Number(product.minStockAlert) || 50);
  const tankCapacity = 600;
  const tankPercent = Math.min(100, Math.round((stock / tankCapacity) * 100));

  const handleDispense = (liters) => {
    soundFX.playPop();
    onAddToCart(product, liters);
  };

  return (
    <div className={`dispenser-station-card ${isLargo ? "station-largo" : "station-barikina"}`}>
      {/* Station Header */}
      <div className="station-header">
        <div className="station-title-wrap">
          <div className="station-code-badge" style={{ backgroundColor: product.color || (isLargo ? "#0d9488" : "#0284c7") }}>
            <span>{product.name?.trim().charAt(0).toUpperCase() || "P"}</span>
          </div>
          <div>
            <div className="station-tag-row">
              <span className="station-badge">{productCategory}</span>
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
            <span>Tank Level:</span>
            <strong className="tank-liters-bold">{stock.toFixed(1)} L</strong>
            <span className="capacity-sub">/ 600L</span>
          </div>
          <div className="tank-actions-right">
            <span className={`stock-status-pill ${isLowStock ? "pill-low" : "pill-ok"}`}>
              {isLowStock ? "Low Stock" : `${tankPercent}% Full`}
            </span>
          </div>
        </div>
        <div className="tank-liquid-track">
          <div
            className={`tank-liquid-fill ${isLargo ? "liquid-teal" : "liquid-cyan"}`}
            style={{ width: `${tankPercent}%` }}
          >
            <div className="tank-liquid-wave"></div>
          </div>
        </div>
        <div className="tank-notches-row">
          <span>0L</span>
          <span>150L</span>
          <span>300L (50%)</span>
          <span>450L</span>
          <span>600L</span>
        </div>
      </div>

      {/* Container Options Grid */}
      <div className="station-containers-section">
        <span className="section-micro-label">CONTAINER SIZES</span>
        <div className="container-presets-grid">
          {CONTAINER_PRESETS.map((preset) => {
            const calculatedPrice = (preset.liters * price).toFixed(0);
            return (
              <button
                key={preset.label}
                type="button"
                className={`btn-container-card ${preset.popular ? "popular-card" : ""}`}
                onClick={() => handleDispense(preset.liters)}
                disabled={stock < preset.liters}
                title={`Dispense ${preset.liters}L of ${product.name}`}
              >
                {preset.popular && <span className="popular-badge">Best Seller</span>}
                <div className="container-icon-row">
                  <span className="container-code-pill">{preset.code}</span>
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
          <span className="section-micro-label">CUSTOM QUANTITY</span>
          <div className="quick-chip-buttons">
            {[0.5, 1, 2, 5, 10].map((amt) => (
              <button
                key={amt}
                type="button"
                className="quick-chip-btn"
                disabled={stock < amt}
                onClick={() => handleDispense(amt)}
                title={
                  stock < amt
                    ? `Not enough stock (${stock.toFixed(1)}L left)`
                    : `Dispense +${amt} Liters`
                }
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
                  e.preventDefault();
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
            <span>
              {customLiterVal && parseFloat(customLiterVal) > 0
                ? `Add ${(parseFloat(customLiterVal) * price).toFixed(0)} ${currency}`
                : "Add"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
