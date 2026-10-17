import React from "react";
import { RefreshCw, Edit2, Trash2, Droplets } from "lucide-react";

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
        <Droplets size={40} className="text-muted" />
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
              <th>Selling Price / L</th>
              <th>Gross Margin</th>
              <th>Total Sold</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isLow = p.stockLiters <= (p.minStockAlert || 40);
              const isZero = p.stockLiters <= 0;
              const marginPerL = p.pricePerLiter - p.costPerLiter;
              const marginPercent = p.pricePerLiter > 0 ? ((marginPerL / p.pricePerLiter) * 100).toFixed(0) : 0;
              const gaugePercent = Math.min(100, Math.max(5, (p.stockLiters / 400) * 100));

              return (
                <tr key={p.id}>
                  <td>
                    <div className="table-soap-info">
                      <div
                        className="soap-table-icon"
                        style={{ backgroundColor: `${p.color}20`, color: p.color }}
                      >
                        {p.iconEmoji || "🧴"}
                      </div>
                      <div>
                        <strong className="soap-table-name">{p.name}</strong>
                        {p.localName && <div className="soap-table-sub">{p.localName}</div>}
                        <div className="soap-scent-badge">{p.scent || "Standard"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="table-category-tag">{p.category}</span>
                  </td>
                  <td>
                    <div className="tank-level-wrap">
                      <div className="tank-level-header">
                        <span className={`tank-number ${isLow ? "text-rose" : "text-emerald"}`}>
                          {p.stockLiters.toFixed(1)} L
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
                      <span className="tank-alert-threshold">Min alert: {p.minStockAlert}L</span>
                    </div>
                  </td>
                  <td>
                    <span className="price-tag-sub">
                      {p.costPerLiter.toFixed(2)} {currency}
                    </span>
                  </td>
                  <td>
                    <strong className="price-tag-main">
                      {p.pricePerLiter.toFixed(2)} {currency}
                    </strong>
                  </td>
                  <td>
                    <div className="margin-indicator">
                      <span className="margin-val text-emerald">+{marginPerL.toFixed(2)} {currency}</span>
                      <span className="margin-pct">({marginPercent}%)</span>
                    </div>
                  </td>
                  <td>
                    <span className="sold-liters-badge">
                      {(p.soldLiters || 0).toFixed(1)} L
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
                        <RefreshCw size={15} />
                        <span>Refill</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon edit-btn"
                        title="Edit Details & Prices"
                        onClick={() => onOpenEdit(p)}
                      >
                        <Edit2 size={15} />
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
                        <Trash2 size={15} />
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
