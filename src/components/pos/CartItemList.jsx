import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

export default function CartItemList({
  cart,
  currency = "ETB",
  onUpdateLiters,
  onRemoveItem,
}) {
  if (cart.length === 0) {
    return (
      <div className="cart-empty-state-v2">
        <div className="empty-soap-bubble">🫧</div>
        <strong className="empty-title-v2">Cashier Ready</strong>
        <p className="empty-desc-v2">
          Tap any container size (0.5L to 20L Jerrycan) from Largo or Barikina on the left.
        </p>
      </div>
    );
  }

  return (
    <div className="cart-items-list-v2">
      {cart.map((item) => (
        <div key={item.productId} className="cart-item-card-v2 animate-fade">
          <div className="cart-item-top-row">
            <div className="item-badge-dot" style={{ backgroundColor: item.color }}></div>
            <div className="cart-item-title-col">
              <strong className="cart-item-title">{item.name}</strong>
              <span className="cart-item-rate">
                {item.pricePerLiter} {currency} / L
              </span>
            </div>
            <button
              type="button"
              className="btn-trash-item"
              onClick={() => onRemoveItem(item.productId)}
              title="Remove"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="cart-item-bottom-row">
            <div className="cart-qty-stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => onUpdateLiters(item.productId, -0.5)}
                title="Minus 0.5L"
              >
                <Minus size={14} />
              </button>
              <span className="stepper-val">{item.liters.toFixed(1)} L</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => onUpdateLiters(item.productId, 0.5)}
                title="Add 0.5L"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="cart-item-price-tag">
              <span className="item-price-number">
                {item.totalPrice.toFixed(2)}
              </span>
              <span className="item-price-cur">{currency}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
