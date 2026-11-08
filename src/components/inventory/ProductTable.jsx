import React from "react";

export default function ProductTable({
  products,
  currency = "ETB",
  onOpenRestock,
  onOpenEdit,
  onDeleteProduct,
}) {
  if (products.length === 0) {
    return (
      <div className="empty-table-state">
        <p>No products match your search or filter.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Soap Variety & Scent</th>
              <th>Category</th>
              <th>Tank Level (Liters)</th>
              <th>Cost Price / L</th>
              <th>Selling Price</th>
              <th>Gross Margin</th>
              <th>Total Sold</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = Number(p.stockLiters) || 0;
              const cost = Number(p.costPerLiter) || 0;
              const price = Number(p.pricePerLiter) || 0;
              const isLow = stock <= (Number(p.minStockAlert) || 40);
              const isZero = stock <= 0;
              const marginPerL = price - cost;
              const marginPercent = price > 0 ? ((marginPerL / price) * 100).toFixed(0) : 0;
              const gaugePercent = Math.min(100, Math.max(5, (stock / 400) * 100));

              return (
                <tr key={p.id}>
                  <td>
                    <div className="table-soap-info">
                      <div
                        className="soap-table-dot"
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: p.color || "#0d9488",
                          marginRight: "8px",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <strong className="soap-table-name">{p.name || "Soap Product"}</strong>
                        {p.localName && <div className="soap-table-sub">{p.localName}</div>}
                        <div className="soap-scent-badge">{p.scent || "Standard"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="table-category-tag">{p.category || "General"}</span>
                  </td>
                  <td>
                    <div className="tank-level-wrap">
                      <div className="tank-level-header">
                        <span className={`tank-number ${isLow ? "text-rose" : "text-emerald"}`}>
                          {stock.toFixed(1)} L
                        </span>
                        <span
                          className={`badge-pill ${
                            isZero ? "badge-danger" : isLow ? "badge-warning" : "badge-success"
                          }`}
                        >
                          {isZero ? "Empty" : isLow ? "Low Stock" : "Good"}
                        </span>
                      </div>
                      <div className="tank-progress-track">
                        <div
                          className={`tank-progress-fill ${isLow ? "fill-danger" : "fill-teal"}`}
                          style={{
                            width: `${gaugePercent}%`,
                            backgroundColor: isLow ? "#e11d48" : p.color || "#0d9488",
                          }}
                        ></div>
                      </div>
                      <span className="tank-alert-threshold">Min alert: {p.minStockAlert || 40}L</span>
                    </div>
                  </td>
                  <td>
                    <span className="price-tag-sub">
                      {cost.toFixed(2)} {currency}
                    </span>
                  </td>
                  <td>
                    <div className="product-size-prices">
                      <strong className="price-tag-main">{price.toFixed(2)} {currency} / L</strong>
                      <span>{Number(p.pricePerHalfLiter ?? price / 2).toFixed(2)} {currency} / 0.5 L</span>
                    </div>
                  </td>
                  <td>
                    <div className="margin-indicator">
                      <span className="margin-val text-emerald">+{marginPerL.toFixed(2)} {currency}</span>
                      <span className="margin-pct">({marginPercent}%)</span>
                    </div>
                  </td>
                  <td>
                    <span className="sold-liters-badge">
                      {(Number(p.soldLiters) || 0).toFixed(1)} L
                    </span>
                  </td>
                  <td>
                    <div className="table-actions-group">
                      <button
                        type="button"
                        className="btn-action-icon refill-btn"
                        title="Refill / Add Liters to Tank"
                        onClick={() => onOpenRestock(p)}
                      >
                        <span>Refill</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon edit-btn"
                        title="Edit Details & Prices"
                        onClick={() => onOpenEdit(p)}
                      >
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon delete-btn"
                        title="Delete Product"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${p.name}"?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                      >
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
