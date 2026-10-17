import React, { useState } from "react";
import {
  Package,
  Plus,
  RefreshCw,
  AlertTriangle,
  Edit2,
  Trash2,
  Droplets,
  DollarSign,
  TrendingUp,
  Search,
  Check,
  X,
} from "lucide-react";

export default function InventoryView({
  products,
  currency = "ETB",
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onRestockLiters,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal States
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Selected product for restock / edit
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockLiters, setRestockLiters] = useState("");
  const [restockCost, setRestockCost] = useState("");

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: "",
    localName: "",
    category: "General Cleanser",
    scent: "",
    color: "#0d9488",
    iconEmoji: "🧴",
    pricePerLiter: 60,
    costPerLiter: 35,
    stockLiters: 100,
    minStockAlert: 40,
    description: "",
  });

  // Edit Product Form State
  const [editForm, setEditForm] = useState(null);

  // Metrics
  const totalLitersInStock = products.reduce((acc, p) => acc + (p.stockLiters || 0), 0);
  const totalStockCostValue = products.reduce((acc, p) => acc + (p.stockLiters * p.costPerLiter || 0), 0);
  const totalPotentialRetail = products.reduce((acc, p) => acc + (p.stockLiters * p.pricePerLiter || 0), 0);
  const lowStockCount = products.filter((p) => p.stockLiters <= (p.minStockAlert || 40)).length;

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.localName && p.localName.toLowerCase().includes(query)) ||
      (p.scent && p.scent.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  const handleOpenRestock = (prod) => {
    setSelectedProduct(prod);
    setRestockLiters("");
    setRestockCost(prod.costPerLiter);
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = (e) => {
    e.preventDefault();
    if (!selectedProduct || !restockLiters || parseFloat(restockLiters) <= 0) return;
    onRestockLiters(
      selectedProduct.id,
      parseFloat(restockLiters),
      parseFloat(restockCost) || selectedProduct.costPerLiter
    );
    setIsRestockModalOpen(false);
  };

  const handleOpenEdit = (prod) => {
    setEditForm({ ...prod });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm) return;
    onUpdateProduct(editForm);
    setIsEditModalOpen(false);
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    const prodToCreate = {
      ...newProduct,
      id: `prod-${Date.now().toString().slice(-6)}`,
      pricePerLiter: parseFloat(newProduct.pricePerLiter) || 0,
      costPerLiter: parseFloat(newProduct.costPerLiter) || 0,
      stockLiters: parseFloat(newProduct.stockLiters) || 0,
      minStockAlert: parseFloat(newProduct.minStockAlert) || 30,
      soldLiters: 0,
    };

    onAddProduct(prodToCreate);
    setIsAddModalOpen(false);
    setNewProduct({
      name: "",
      localName: "",
      category: "General Cleanser",
      scent: "",
      color: "#0d9488",
      iconEmoji: "🧴",
      pricePerLiter: 60,
      costPerLiter: 35,
      stockLiters: 100,
      minStockAlert: 40,
      description: "",
    });
  };

  return (
    <div className="inventory-layout animate-fade">
      {/* Top Inventory Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Liters in Stock</span>
            <div className="metric-icon-wrap stat-cyan">
              <Droplets size={20} />
            </div>
          </div>
          <div className="metric-value">
            {totalLitersInStock.toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
            <span className="metric-unit">Liters</span>
          </div>
          <span className="metric-sub">Across {products.length} liquid soap varieties</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Inventory Cost Value</span>
            <div className="metric-icon-wrap stat-amber">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">
            {totalStockCostValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Invested capital in stock tanks</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Potential Retail Revenue</span>
            <div className="metric-icon-wrap stat-emerald">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="metric-value">
            {totalPotentialRetail.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">
            Estimated profit: {(totalPotentialRetail - totalStockCostValue).toLocaleString()} {currency}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Low Stock Tanks</span>
            <div className={`metric-icon-wrap ${lowStockCount > 0 ? "stat-rose" : "stat-emerald"}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="metric-value">
            {lowStockCount} <span className="metric-unit">Need refill</span>
          </div>
          <span className="metric-sub">
            {lowStockCount > 0 ? "Under safe alert threshold" : "All tank levels healthy"}
          </span>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="inventory-controls-bar">
        <div className="inventory-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="inventory-search-input"
            placeholder="Search soaps by name, scent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-select-wrap">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Soap Categories" : c}
              </option>
            ))}
          </select>
        </div>

        <div className="inventory-actions-right">
          <button className="btn-secondary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>Add Soap Variety</span>
          </button>
        </div>
      </div>

      {/* Soap Products Table */}
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
              {filteredProducts.map((p) => {
                const isLow = p.stockLiters <= (p.minStockAlert || 40);
                const isZero = p.stockLiters <= 0;
                const marginPerL = p.pricePerLiter - p.costPerLiter;
                const marginPercent = p.pricePerLiter > 0 ? ((marginPerL / p.pricePerLiter) * 100).toFixed(0) : 0;
                
                // Visual gauge bar percentage (max tank e.g. 500L)
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
                          className="btn-action-icon refill-btn"
                          title="Refill / Add Liters to Tank"
                          onClick={() => handleOpenRestock(p)}
                        >
                          <RefreshCw size={15} />
                          <span>Refill</span>
                        </button>
                        <button
                          className="btn-action-icon edit-btn"
                          title="Edit Details & Prices"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
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

      {/* Modal: Refill Tank Liters */}
      {isRestockModalOpen && selectedProduct && (
        <div className="modal-backdrop animate-fade">
          <div className="modal-box animate-pop">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="stat-icon-wrapper stat-cyan">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Refill Soap Tank</h3>
                  <p className="modal-subtitle">
                    Adding volume for: <strong>{selectedProduct.name}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsRestockModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="modal-form">
              <div className="form-group">
                <label className="form-label">Current Tank Volume</label>
                <div className="tank-read-only">
                  {selectedProduct.stockLiters.toFixed(1)} Liters currently available
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Liters to Add (e.g., 50L, 100L, 200L barrel)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  placeholder="Enter liters brewed or purchased..."
                  className="form-input"
                  value={restockLiters}
                  onChange={(e) => setRestockLiters(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Batch Cost per Liter ({currency})</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="form-input"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                />
                <span className="input-hint">
                  Total batch investment:{" "}
                  {((parseFloat(restockLiters) || 0) * (parseFloat(restockCost) || 0)).toFixed(2)}{" "}
                  {currency}
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsRestockModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <Check size={18} />
                  <span>Confirm Tank Refill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Product */}
      {isAddModalOpen && (
        <div className="modal-backdrop animate-fade">
          <div className="modal-box modal-lg animate-pop">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="stat-icon-wrapper stat-emerald">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Add New Soap Formula / Product</h3>
                  <p className="modal-subtitle">Define a new liquid detergent or specialty cleanser</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="modal-form">
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
                  <label className="form-label">Local / Amharic Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. የዕቃ ሳሙና (ሱፐር)"
                    className="form-input"
                    value={newProduct.localName}
                    onChange={(e) => setNewProduct({ ...newProduct, localName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="General Cleanser">General Cleanser</option>
                    <option value="Kitchen & Dishes">Kitchen & Dishes</option>
                    <option value="Personal Hygiene">Personal Hygiene</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Floors & Tiles">Floors & Tiles</option>
                    <option value="Sanitizer">Sanitizer / Bleach</option>
                    <option value="Automotive">Automotive / Car Wash</option>
                    <option value="Glass & Surfaces">Glass & Surfaces</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fragrance / Scent</label>
                  <input
                    type="text"
                    placeholder="e.g. Strawberry, Pine, Lemon, Lavender"
                    className="form-input"
                    value={newProduct.scent}
                    onChange={(e) => setNewProduct({ ...newProduct, scent: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Selling Price per Liter ({currency}) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 70"
                    className="form-input"
                    value={newProduct.pricePerLiter}
                    onChange={(e) => setNewProduct({ ...newProduct, pricePerLiter: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Production Cost per Liter ({currency}) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 38"
                    className="form-input"
                    value={newProduct.costPerLiter}
                    onChange={(e) => setNewProduct({ ...newProduct, costPerLiter: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Initial Tank Stock (Liters) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 150"
                    className="form-input"
                    value={newProduct.stockLiters}
                    onChange={(e) => setNewProduct({ ...newProduct, stockLiters: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Alert Threshold (Liters)</label>
                  <input
                    type="number"
                    step="5"
                    placeholder="e.g. 40"
                    className="form-input"
                    value={newProduct.minStockAlert}
                    onChange={(e) => setNewProduct({ ...newProduct, minStockAlert: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Theme Color</label>
                  <input
                    type="color"
                    className="form-color-picker"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon Emoji</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProduct.iconEmoji}
                    onChange={(e) => setNewProduct({ ...newProduct, iconEmoji: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <Check size={18} />
                  <span>Create Soap Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product Details & Prices */}
      {isEditModalOpen && editForm && (
        <div className="modal-backdrop animate-fade">
          <div className="modal-box animate-pop">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="stat-icon-wrapper stat-purple">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Edit Soap Product</h3>
                  <p className="modal-subtitle">Update pricing and details for {editForm.name}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Product Name</label>
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
                  <label className="form-label">Fragrance / Scent</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.scent || ""}
                    onChange={(e) => setEditForm({ ...editForm, scent: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Selling Price per Liter ({currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    value={editForm.pricePerLiter}
                    onChange={(e) =>
                      setEditForm({ ...editForm, pricePerLiter: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost per Liter ({currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    value={editForm.costPerLiter}
                    onChange={(e) =>
                      setEditForm({ ...editForm, costPerLiter: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Stock Liters Adjustment</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    value={editForm.stockLiters}
                    onChange={(e) =>
                      setEditForm({ ...editForm, stockLiters: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Alert Liters</label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    value={editForm.minStockAlert}
                    onChange={(e) =>
                      setEditForm({ ...editForm, minStockAlert: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <Check size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
