import React from "react";
import { CONTAINER_PRESETS } from "../../constants/containers";

export default function ContainerPresets({ product, onSelect, currency = "ETB" }) {
  return (
    <div className="container-presets-grid">
      {CONTAINER_PRESETS.map((preset) => {
        const itemPrice = preset.liters * product.pricePerLiter;
        const isOutOfStock = product.stockLiters < preset.liters;

        return (
          <button
            key={preset.label}
            type="button"
            className={`container-btn-card ${preset.popular ? "card-popular" : ""} ${
              isOutOfStock ? "btn-disabled" : ""
            }`}
            onClick={() => onSelect(product, preset.liters)}
            disabled={isOutOfStock}
          >
            {preset.popular && <span className="popular-badge">★ Popular</span>}
            <span className="container-icon">{preset.icon}</span>
            <div className="container-meta">
              <span className="container-size">{preset.label}</span>
              <span className="container-cost">
                {itemPrice.toLocaleString()} {currency}
              </span>
            </div>
            {isOutOfStock ? (
              <span className="preset-out-tag">Out</span>
            ) : (
              <span className="preset-add-label">+ Fill</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
