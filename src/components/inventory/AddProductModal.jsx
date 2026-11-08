import React, { useMemo } from "react";
import Modal from "../common/Modal";

const PRODUCT_TYPES = [
  {
    id: "Largo",
    localName: "ላርጎ",
    category: "Liquid Soap (ላርጎ)",
    color: "#0d9488",
  },
  {
    id: "Berekina",
    localName: "በረኪና",
    category: "Bleach & Sanitizer (በረኪና)",
    color: "#0284c7",
  },
];

export default function AddProductModal({
  isOpen,
  onClose,
  newProduct,
  setNewProduct,
  onSubmit,
  currency = "ETB",
}) {
  const selectedType = PRODUCT_TYPES.find((type) => type.id === newProduct.category) || PRODUCT_TYPES[0];
  const { profit, marginPct, isProfitable, isThin } = useMemo(() => {
    const price = parseFloat(newProduct.pricePerLiter) || 0;
    const cost = parseFloat(newProduct.costPerLiter) || 0;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

    return {
      profit: price - cost,
      marginPct: margin.toFixed(1),
      isProfitable: price > cost,
      isThin: price > cost && margin < 25,
    };
  }, [newProduct.pricePerLiter, newProduct.costPerLiter]);

  const updateField = (field) => (event) => {
    setNewProduct((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add product"
      subtitle="Choose a product and enter its prices and opening stock."
      maxWidth="560px"
    >
      <form onSubmit={onSubmit} className="modal-form add-product-form">
        <fieldset className="add-product-type-fieldset">
          <legend className="form-label">Product type</legend>
          <div className="add-product-type-options">
            {PRODUCT_TYPES.map((type) => {
              const isSelected = selectedType.id === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  className={`add-product-type-option ${isSelected ? "selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => setNewProduct((current) => ({ ...current, category: type.id }))}
                >
                  <span className="add-product-type-mark" style={{ backgroundColor: type.color }} />
                  <span>
                    <strong>{type.id}</strong>
                    <small>{type.localName}</small>
                  </span>
                  <span className="add-product-type-check" aria-hidden="true">
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="add-product-pricing-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="add-product-price-1l">
              Selling price · 1 L ({currency})
            </label>
            <input
              id="add-product-price-1l"
              type="number"
              min="0"
              step="0.01"
              required
              className="form-input"
              placeholder="Enter price"
              value={newProduct.pricePerLiter}
              onChange={updateField("pricePerLiter")}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-product-price-half">
              Selling price · 0.5 L ({currency})
            </label>
            <input
              id="add-product-price-half"
              type="number"
              min="0"
              step="0.01"
              required
              className="form-input"
              placeholder="Enter price"
              value={newProduct.pricePerHalfLiter}
              onChange={updateField("pricePerHalfLiter")}
            />
          </div>
        </div>

        <div className="add-product-pricing-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="add-product-cost">
              Production cost · 1 L ({currency})
            </label>
            <input
              id="add-product-cost"
              type="number"
              min="0"
              step="0.01"
              required
              className="form-input"
              placeholder="Enter cost"
              value={newProduct.costPerLiter}
              onChange={updateField("costPerLiter")}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-product-opening-stock">
              Opening stock (L)
            </label>
            <input
              id="add-product-opening-stock"
              type="number"
              min="0"
              step="0.1"
              required
              className="form-input"
              placeholder="Enter liters in tank"
              value={newProduct.stockLiters}
              onChange={updateField("stockLiters")}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="add-product-low-stock">
            Low-stock alert (L)
          </label>
          <input
            id="add-product-low-stock"
            type="number"
            min="0"
            step="0.1"
            required
            className="form-input"
            value={newProduct.minStockAlert}
            onChange={updateField("minStockAlert")}
          />
        </div>

        <div className="add-product-margin-summary" aria-live="polite">
          <span>Estimated profit per liter</span>
          <strong className={!isProfitable ? "margin-loss" : isThin ? "margin-thin-text" : ""}>
            {profit >= 0 ? "+" : ""}{profit.toFixed(2)} {currency}
          </strong>
          <span>Margin {marginPct}%</span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-modal-submit">
            Add {selectedType.id}
          </button>
        </div>
      </form>
    </Modal>
  );
}
