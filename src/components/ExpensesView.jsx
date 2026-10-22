import React, { useState } from "react";
import {
  TrendingDown,
  Plus,
  Search,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  FlaskConical,
  Beaker,
  Calculator,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import {
  formatEthiopianDate,
  formatEthiopianTime,
} from "../utils/ethiopianDate";
import Modal from "./common/Modal";

const COMMON_CHEMICALS = [
  { name: "SLS / SLES (Sodium Lauryl Ether Sulfate)", label: "SLS / SLES (ፎም)", unit: "L", defaultRate: 70 },
  { name: "LABSA / Sulfonic Acid (ማጽጃ አሲድ)", label: "Sulfonic Acid (LABSA)", unit: "L", defaultRate: 95 },
  { name: "Caustic Soda (ሶዲየም ሃይድሮክሳይድ)", label: "Caustic Soda", unit: "kg", defaultRate: 110 },
  { name: "Sodium Hypochlorite (ክሎሪን ኮንሰንትሬት)", label: "Chlorine Bleach", unit: "L", defaultRate: 45 },
  { name: "CDEA Foam Booster (አረፋ ማቆያ)", label: "CDEA Booster", unit: "L", defaultRate: 120 },
  { name: "Industrial Salt / NaCl (ውፍረት ሰጪ)", label: "Salt (NaCl)", unit: "kg", defaultRate: 15 },
  { name: "Soda Ash (ማረጋጊያ ሶዳ)", label: "Soda Ash", unit: "kg", defaultRate: 65 },
  { name: "Fragrance & Perfume Oil (ሽቶ)", label: "Fragrance / Perfume", unit: "L", defaultRate: 380 },
  { name: "Liquid Soap Dye (ቀለም)", label: "Colorant / Dye", unit: "L", defaultRate: 150 },
];

export default function ExpensesView({
  expenses = [],
  currency = "ETB",
  onAddExpense,
  onDeleteExpense,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [todayEthFormatted] = useState(() => formatEthiopianDate(new Date(), "full"));

  // 3 Primary Expense Categories requested
  const categories = [
    "Chemical",
    "Salary",
    "Rent",
  ];

  const initialExpenseState = {
    title: "",
    category: "Chemical",
    litersBought: "",
    pricePerLiter: "",
    unit: "L",
    amount: "",
    isUnitPricing: true,
    paymentMethod: "Telebirr",
    notes: "",
  };

  const [newExpense, setNewExpense] = useState(initialExpenseState);

  // Calculations
  const totalExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  
  const chemicalTotal = expenses
    .filter((e) => e.category === "Chemical" || e.category === "Raw Materials & Chemicals")
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  const totalChemicalLiters = expenses
    .filter((e) => (e.category === "Chemical" || e.category === "Raw Materials & Chemicals") && e.litersBought)
    .reduce((acc, e) => acc + (parseFloat(e.litersBought) || 0), 0);

  const salaryTotal = expenses
    .filter((e) => e.category === "Salary" || e.category === "Labor & Wages")
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  const rentTotal = expenses
    .filter((e) => e.category === "Rent" || e.category === "Shop Rent")
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== "all") {
      if (categoryFilter === "Chemical") {
        if (e.category !== "Chemical" && e.category !== "Raw Materials & Chemicals") return false;
      } else if (categoryFilter === "Salary") {
        if (e.category !== "Salary" && e.category !== "Labor & Wages") return false;
      } else if (categoryFilter === "Rent") {
        if (e.category !== "Rent" && e.category !== "Shop Rent") return false;
      } else if (e.category !== categoryFilter) {
        return false;
      }
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = e.title && e.title.toLowerCase().includes(q);
      const matchNotes = e.notes && e.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const handleCategoryChange = (cat) => {
    const isChemical = cat === "Chemical" || cat === "Raw Materials & Chemicals";
    setNewExpense((prev) => ({
      ...prev,
      category: cat,
      isUnitPricing: isChemical,
    }));
  };

  const handleLitersChange = (val) => {
    const liters = val;
    const rate = newExpense.pricePerLiter;
    let computedAmount = newExpense.amount;

    if (liters !== "" && rate !== "") {
      const lNum = parseFloat(liters);
      const rNum = parseFloat(rate);
      if (!isNaN(lNum) && !isNaN(rNum)) {
        computedAmount = (lNum * rNum).toFixed(2);
      }
    }

    setNewExpense((prev) => ({
      ...prev,
      litersBought: val,
      amount: computedAmount,
    }));
  };

  const handlePricePerLiterChange = (val) => {
    const rate = val;
    const liters = newExpense.litersBought;
    let computedAmount = newExpense.amount;

    if (liters !== "" && rate !== "") {
      const lNum = parseFloat(liters);
      const rNum = parseFloat(rate);
      if (!isNaN(lNum) && !isNaN(rNum)) {
        computedAmount = (lNum * rNum).toFixed(2);
      }
    }

    setNewExpense((prev) => ({
      ...prev,
      pricePerLiter: val,
      amount: computedAmount,
    }));
  };

  const handleAmountChange = (val) => {
    const amt = val;
    const liters = parseFloat(newExpense.litersBought);
    let updatedRate = newExpense.pricePerLiter;

    // If chemical volume is present, sync unit rate to whole price / volume
    if (newExpense.isUnitPricing && !isNaN(liters) && liters > 0 && amt !== "") {
      const aNum = parseFloat(amt);
      if (!isNaN(aNum) && aNum >= 0) {
        updatedRate = (aNum / liters).toFixed(2);
      }
    }

    setNewExpense((prev) => ({
      ...prev,
      amount: val,
      pricePerLiter: updatedRate,
    }));
  };

  const handleSelectChemicalPreset = (chem) => {
    const selectedUnit = chem.unit || "L";
    const selectedRate = chem.defaultRate ? String(chem.defaultRate) : newExpense.pricePerLiter;
    let computedAmount = newExpense.amount;

    if (newExpense.litersBought && selectedRate) {
      const lNum = parseFloat(newExpense.litersBought);
      const rNum = parseFloat(selectedRate);
      if (!isNaN(lNum) && !isNaN(rNum)) {
        computedAmount = (lNum * rNum).toFixed(2);
      }
    }

    setNewExpense((prev) => ({
      ...prev,
      title: chem.name,
      unit: selectedUnit,
      pricePerLiter: selectedRate,
      amount: computedAmount,
    }));
  };

  const handleUnitChange = (u) => {
    setNewExpense((prev) => ({
      ...prev,
      unit: u,
    }));
  };

  const handleCreateExpense = (e) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) return;

    const liters = parseFloat(newExpense.litersBought);
    const rate = parseFloat(newExpense.pricePerLiter);
    const hasCalc = newExpense.isUnitPricing && !isNaN(liters) && liters > 0 && !isNaN(rate) && rate > 0;

    let computedNotes = newExpense.notes.trim();
    if (hasCalc) {
      const calcSummary = `${liters} ${newExpense.unit || "L"} @ ${rate.toFixed(2)} ${currency}/${newExpense.unit || "L"}`;
      if (!computedNotes) {
        computedNotes = `Registered: ${calcSummary}`;
      } else if (!computedNotes.includes(calcSummary)) {
        computedNotes = `[${calcSummary}] ${computedNotes}`;
      }
    }

    const expenseRecord = {
      id: `exp-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      title: newExpense.title.trim(),
      category: newExpense.category,
      amount: parseFloat(newExpense.amount) || 0,
      paymentMethod: newExpense.paymentMethod,
      litersBought: hasCalc ? liters : (parseFloat(newExpense.litersBought) || null),
      pricePerLiter: hasCalc ? rate : (parseFloat(newExpense.pricePerLiter) || null),
      unit: newExpense.unit || "L",
      notes: computedNotes,
    };

    onAddExpense(expenseRecord);
    setIsAddModalOpen(false);
    setNewExpense(initialExpenseState);
  };

  return (
    <div className="expenses-layout animate-fade">
      {/* Metrics Row - 1-to-1 matching Total, Chemical, Salary, and Rent */}
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
            <span className="metric-title">1. Chemical Expenses</span>
            <div className="metric-icon-wrap stat-cyan">
              <FlaskConical size={20} />
            </div>
          </div>
          <div className="metric-value">
            {chemicalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">
            {totalChemicalLiters > 0 ? (
              <>
                <strong className="text-teal-700">{totalChemicalLiters.toLocaleString()} {currency === "ETB" ? "ሊትር" : "L"}</strong> registered • Concentrates & surfactants
              </>
            ) : (
              "SLS, Sulfonic, Caustic, Chlorine & Perfume"
            )}
          </span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">2. Salary Expenses</span>
            <div className="metric-icon-wrap stat-purple">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">
            {salaryTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Staff wages, technician labor & salaries</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">3. Shop Rent</span>
            <div className="metric-icon-wrap stat-amber">
              <Building2 size={20} />
            </div>
          </div>
          <div className="metric-value">
            {rentTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="metric-unit">{currency}</span>
          </div>
          <span className="metric-sub">Monthly kiosk lease & shop stall rent</span>
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
            <option value="Chemical">1. Chemical</option>
            <option value="Salary">2. Salary</option>
            <option value="Rent">3. Rent</option>
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
                filteredExpenses.map((exp) => {
                  const isChem = exp.category === "Chemical" || exp.category === "Raw Materials & Chemicals";
                  const isSal = exp.category === "Salary" || exp.category === "Labor & Wages";
                  const isRnt = exp.category === "Rent" || exp.category === "Shop Rent";

                  const tagClass = isChem ? "cat-chemical" : isSal ? "cat-salary" : "cat-rent";
                  const displayCat = isChem ? "Chemical" : isSal ? "Salary" : isRnt ? "Rent" : exp.category;

                  return (
                    <tr key={exp.id}>
                      <td>
                        <div className="expense-item-info">
                          <strong className="expense-title">{exp.title}</strong>
                          {exp.litersBought && exp.pricePerLiter ? (
                            <span className="expense-rate-badge" title="Registered volume and price per unit">
                              <Beaker size={12} />
                              <span>
                                {exp.litersBought} {exp.unit || "L"} @ {Number(exp.pricePerLiter).toFixed(2)} {currency}/{exp.unit || "L"}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={`table-category-tag ${tagClass}`}>
                          {displayCat}
                        </span>
                      </td>
                      <td>
                        <div className="date-time-cell">
                          <span className="font-semibold text-slate-800">
                            {formatEthiopianDate(exp.date, "medium")}
                          </span>
                          <span className="time-sub">
                            {formatEthiopianTime(exp.date, false)}
                            <span className="greg-inline-hint">
                              {" "}• {new Date(exp.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-pill badge-neutral">{exp.paymentMethod}</span>
                      </td>
                      <td>
                        <div>
                          <strong className="price-tag-danger">
                            -{parseFloat(exp.amount).toFixed(2)} {currency}
                          </strong>
                          {exp.litersBought && exp.pricePerLiter ? (
                            <span className="price-sub-calc">
                              {exp.litersBought} {exp.unit || "L"} × {Number(exp.pricePerLiter).toFixed(2)} {currency}
                            </span>
                          ) : null}
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal with 3 Clear Options: 1. Chemical, 2. Salary, 3. Rent */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Shop Expense"
        subtitle={`ቀን: ${todayEthFormatted}`}
        icon={TrendingDown}
        maxWidth="560px"
      >
        <form onSubmit={handleCreateExpense} className="modal-form">
          {/* 3 Prominent Options: 1. Chemical, 2. Salary, 3. Rent */}
          <div className="form-group">
            <label className="form-label">Expense Category *</label>
            <div className="category-options-grid">
              <button
                type="button"
                className={`category-pill ${newExpense.category === "Chemical" ? "selected chemical" : ""}`}
                onClick={() => handleCategoryChange("Chemical")}
              >
                <FlaskConical size={16} />
                <span>1. Chemical</span>
              </button>
              <button
                type="button"
                className={`category-pill ${newExpense.category === "Salary" ? "selected salary" : ""}`}
                onClick={() => handleCategoryChange("Salary")}
              >
                <Users size={16} />
                <span>2. Salary</span>
              </button>
              <button
                type="button"
                className={`category-pill ${newExpense.category === "Rent" ? "selected rent" : ""}`}
                onClick={() => handleCategoryChange("Rent")}
              >
                <Building2 size={16} />
                <span>3. Rent</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {newExpense.category === "Chemical"
                ? "Chemical Name / Description *"
                : newExpense.category === "Salary"
                ? "Employee / Labor Description *"
                : "Shop / Lease Description *"}
            </label>
            <input
              type="text"
              required
              placeholder={
                newExpense.category === "Chemical"
                  ? "e.g. SLES Concentrated Surfactant (50kg Drum)"
                  : newExpense.category === "Salary"
                  ? "e.g. Mixing Technician & Dispenser Monthly Salary"
                  : "e.g. Monthly Kiosk / Shop Stall Lease"
              }
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
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((c, idx) => (
                  <option key={c} value={c}>
                    {idx + 1}. {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Amount ({currency}) *</span>
                {newExpense.isUnitPricing && (
                  <span className="form-label-hint text-teal-600 font-semibold">(Whole Price)</span>
                )}
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="e.g. 3500"
                className="form-input font-bold"
                value={newExpense.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>
          </div>

          {/* 1. Chemical: Volume & Price Per Litre Calculator Panel */}
          {newExpense.isUnitPricing && (
            <div className="chemical-calc-panel animate-fade">
              <div className="calc-panel-header">
                <div className="calc-panel-title-wrap">
                  <div className="calc-icon-badge">
                    <FlaskConical size={16} />
                  </div>
                  <div>
                    <div className="calc-panel-title">
                      Chemical Volume & Unit Price Registration
                    </div>
                    <div className="calc-panel-sub">
                      Whole price automatically calculated from volume bought × price per litre
                    </div>
                  </div>
                </div>

                <div className="calc-unit-switcher">
                  <button
                    type="button"
                    className={`calc-unit-btn ${newExpense.unit === "L" ? "active" : ""}`}
                    onClick={() => handleUnitChange("L")}
                  >
                    L (Litre)
                  </button>
                  <button
                    type="button"
                    className={`calc-unit-btn ${newExpense.unit === "kg" ? "active" : ""}`}
                    onClick={() => handleUnitChange("kg")}
                  >
                    kg (Kilo)
                  </button>
                </div>
              </div>

              {/* Quick Chemical Preset Chips */}
              <div className="quick-chemicals-bar">
                <span className="quick-chemicals-label">Quick Chemical Presets:</span>
                <div className="quick-chemicals-grid">
                  {COMMON_CHEMICALS.map((chem) => (
                    <button
                      key={chem.name}
                      type="button"
                      className={`quick-chemical-chip ${newExpense.title === chem.name ? "selected" : ""}`}
                      onClick={() => handleSelectChemicalPreset(chem)}
                    >
                      <Sparkles size={11} />
                      <span>{chem.label}</span>
                      {chem.defaultRate && (
                        <span className="chip-rate-tag">
                          ({chem.defaultRate} {currency}/{chem.unit})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume & Price Per Litre Row */}
              <div className="form-group-row">
                {/* Litres Bought */}
                <div className="form-group">
                  <label className="form-label">
                    <span>{newExpense.unit === "kg" ? "Weight Bought (kg)" : "Litres Bought (L)"} *</span>
                  </label>
                  <div className="input-with-adornment">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="e.g. 50"
                      className="form-input"
                      value={newExpense.litersBought}
                      onChange={(e) => handleLitersChange(e.target.value)}
                    />
                    <span className="input-adornment-badge">{newExpense.unit || "L"}</span>
                  </div>

                  {/* Volume Presets */}
                  <div className="quick-vol-chips">
                    {[10, 20, 50, 100, 200].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="quick-vol-btn"
                        onClick={() => handleLitersChange(String(v))}
                      >
                        +{v}{newExpense.unit || "L"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price per Litre */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Price per {newExpense.unit === "kg" ? "Kilogram" : "Litre"} ({currency}) *</span>
                  </label>
                  <div className="input-with-adornment">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="e.g. 70"
                      className="form-input"
                      value={newExpense.pricePerLiter}
                      onChange={(e) => handlePricePerLiterChange(e.target.value)}
                    />
                    <span className="input-adornment-badge">{currency}/{newExpense.unit || "L"}</span>
                  </div>
                  <span className="form-label-hint">Rate per single {newExpense.unit === "kg" ? "kg" : "litre"}</span>
                </div>
              </div>

              {/* Live Whole Price Breakdown Banner */}
              <div className="calc-result-banner">
                <div className="calc-result-left">
                  <Calculator size={22} className="calc-result-icon" />
                  <div className="calc-breakdown-details">
                    <span className="calc-formula-text">
                      {parseFloat(newExpense.litersBought) > 0 && parseFloat(newExpense.pricePerLiter) > 0 ? (
                        <>
                          <strong>{newExpense.litersBought} {newExpense.unit || "L"}</strong> ×{" "}
                          <strong>{parseFloat(newExpense.pricePerLiter).toFixed(2)} {currency}/{newExpense.unit || "L"}</strong>
                        </>
                      ) : (
                        "Fill volume and price per litre above"
                      )}
                    </span>
                    <span className="calc-formula-sub">የጠቅላላ ዋጋ ስሌት • Whole Price Formula</span>
                  </div>
                </div>

                <div className="calc-total-badge">
                  <span className="calc-total-label">Whole Price (ጠቅላላ)</span>
                  <strong className="calc-total-val">
                    {parseFloat(newExpense.amount) > 0
                      ? `${parseFloat(newExpense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
                      : `0.00 ${currency}`}
                  </strong>
                </div>
              </div>
            </div>
          )}

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
            <label className="form-label">Notes / Details</label>
            <textarea
              rows="2"
              className="form-input"
              placeholder={
                newExpense.category === "Chemical"
                  ? (newExpense.litersBought && newExpense.pricePerLiter
                      ? `e.g. Supplier contact, batch receipt for ${newExpense.litersBought}${newExpense.unit || "L"} @ ${newExpense.pricePerLiter} ${currency}...`
                      : "Optional supplier contact, batch receipt number...")
                  : newExpense.category === "Salary"
                  ? "Optional staff contact, monthly period, wage payment reference..."
                  : "Optional landlord contact, shop lease number, period covered..."
              }
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
      </Modal>
    </div>
  );
}
