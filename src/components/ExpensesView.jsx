import React, { useState } from "react";
import {
  TrendingDown,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Trash2,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Check,
} from "lucide-react";

export default function ExpensesView({
  expenses,
  currency = "ETB",
  onAddExpense,
  onDeleteExpense,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "Raw Materials & Chemicals",
    amount: "",
    paymentMethod: "Telebirr",
    notes: "",
  });

  const categories = [
    "Raw Materials & Chemicals",
    "Packaging & Containers",
    "Shop Rent",
    "Water & Utilities",
    "Transport & Logistics",
    "Labor & Wages",
    "Equipment & Maintenance",
    "Other Overhead",
  ];

  // Calculations
  const totalExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  
  const rawMaterialTotal = expenses
    .filter((e) => e.category === "Raw Materials & Chemicals")
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  const packagingTotal = expenses
    .filter((e) => e.category === "Packaging & Containers")
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  const rentAndUtilitiesTotal = expenses
    .filter((e) => e.category === "Shop Rent" || e.category === "Water & Utilities")
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = e.title && e.title.toLowerCase().includes(q);
      const matchNotes = e.notes && e.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const handleCreateExpense = (e) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) return;

    const expenseRecord = {
      id: `exp-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      title: newExpense.title.trim(),
      category: newExpense.category,
      amount: parseFloat(newExpense.amount) || 0,
      paymentMethod: newExpense.paymentMethod,
      notes: newExpense.notes.trim(),
    };

    onAddExpense(expenseRecord);
    setIsAddModalOpen(false);
    setNewExpense({
      title: "",
      category: "Raw Materials & Chemicals",
      amount: "",
      paymentMethod: "Telebirr",
      notes: "",
    });
  };

  return (
    <div className="expenses-layout animate-fade">
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Shop Expenses</span>
            <div className="metric-icon-wrap stat-rose">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="metric-value text-rose">
            {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Total recorded operational expenses</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Chemicals & Raw Materials</span>
            <div className="metric-icon-wrap stat-cyan">
              <Tag size={20} />
            </div>
          </div>
          <div className="metric-value">
            {rawMaterialTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Surfactants, scents, dye, soda ash</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Packaging & Bottles</span>
            <div className="metric-icon-wrap stat-amber">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">
            {packagingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Cans, jerrycans, caps, and labels</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Rent & Utilities</span>
            <div className="metric-icon-wrap stat-purple">
              <Calendar size={20} />
            </div>
          </div>
          <div className="metric-value">
            {rentAndUtilitiesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Shop lease, water for dilution & power</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="inventory-controls-bar">
        <div className="inventory-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="inventory-search-input"
            placeholder="Search expenses by title or note..."
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
            <option value="all">All Expense Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-secondary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <strong className="expense-title">{exp.title}</strong>
                    </td>
                    <td>
                      <span className="table-category-tag">{exp.category}</span>
                    </td>
                    <td>
                      <span className="date-sub">
                        {new Date(exp.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge-pill badge-neutral">{exp.paymentMethod}</span>
                    </td>
                    <td>
                      <strong className="price-tag-danger">
                        -{parseFloat(exp.amount).toFixed(2)} {currency}
                      </strong>
                    </td>
                    <td>
                      <span className="expense-note-cell">{exp.notes || "—"}</span>
                    </td>
                    <td>
                      <button
                        className="btn-action-icon delete-btn"
                        title="Delete expense"
                        onClick={() => {
                          if (window.confirm(`Delete expense "${exp.title}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop animate-fade">
          <div className="modal-box animate-pop">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="stat-icon-wrapper stat-rose">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Record Shop Expense</h3>
                  <p className="modal-subtitle">Track purchases, rent, utilities, and raw chemicals</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="modal-form">
              <div className="form-group">
                <label className="form-label">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SLES Concentrated Surfactant (50kg Drum)"
                  className="form-input"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ({currency}) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 3500"
                    className="form-input"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Paid Via</label>
                <div className="payment-options-grid">
                  <button
                    type="button"
                    className={`payment-pill ${newExpense.paymentMethod === "Telebirr" ? "selected telebirr" : ""}`}
                    onClick={() => setNewExpense({ ...newExpense, paymentMethod: "Telebirr" })}
                  >
                    <Smartphone size={16} />
                    <span>Telebirr</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-pill ${newExpense.paymentMethod === "Cash" ? "selected cash" : ""}`}
                    onClick={() => setNewExpense({ ...newExpense, paymentMethod: "Cash" })}
                  >
                    <Banknote size={16} />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-pill ${newExpense.paymentMethod === "CBE Birr" ? "selected cbe" : ""}`}
                    onClick={() => setNewExpense({ ...newExpense, paymentMethod: "CBE Birr" })}
                  >
                    <CreditCard size={16} />
                    <span>CBE / Bank</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Supplier Details</label>
                <textarea
                  rows="2"
                  className="form-input"
                  placeholder="Optional supplier contact, batch receipt number..."
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                ></textarea>
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
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
