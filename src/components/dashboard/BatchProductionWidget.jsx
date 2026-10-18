import React, { useState, useMemo } from "react";
import {
  Beaker,
  PackagePlus,
  CheckCircle2,
} from "lucide-react";
import { soundFX } from "../../utils/audio";

const FORMULA_PRESETS = [
  {
    id: "largo",
    name: "ፈሳሽ ሳሙና (Largo)",
    localName: "ላርጎ • Multipurpose Soap",
    color: "#0d9488",
    defaultPricePerLiter: 60,
    costPerLiter: 35,
    ingredients: [
      { name: "SLES (ፎም ሰጪ ኬሚካል)", ratio: 0.08, unit: "kg" },
      { name: "Sulfonic Acid / LABSA (ማጽጃ አሲድ)", ratio: 0.06, unit: "kg" },
      { name: "Caustic Soda (ገለልተኛ አድራጊ)", ratio: 0.01, unit: "kg" },
      { name: "Industrial Salt / NaCl (ውፍረት ሰጪ)", ratio: 0.035, unit: "kg" },
      { name: "CDEA Foam Booster (አረፋ ማቆያ)", ratio: 0.01, unit: "kg" },
      { name: "Fresh Perfume & Scent", ratio: 0.003, unit: "L" },
    ],
  },
  {
    id: "barikina",
    name: "በረኪና (Barikina)",
    localName: "በረኪና • Chlorine Bleach",
    color: "#0284c7",
    defaultPricePerLiter: 50,
    costPerLiter: 28,
    ingredients: [
      { name: "Sodium Hypochlorite (ክሎሪን ኮንሰንትሬት)", ratio: 0.10, unit: "L" },
      { name: "Soda Ash (ማረጋጊያ ሶዳ)", ratio: 0.02, unit: "kg" },
      { name: "Treated Water (ውሃ)", ratio: 0.88, unit: "L" },
    ],
  },
  {
    id: "softener",
    name: "ኮንዲሽነር (Softener)",
    localName: "የጨርቅ ማለስለሻ • Fabric Softener",
    color: "#8b5cf6",
    defaultPricePerLiter: 80,
    costPerLiter: 38,
    ingredients: [
      { name: "Flake Softener Base (ማለስለሻ ቅንጣት)", ratio: 0.05, unit: "kg" },
      { name: "Floral Fragrance Oil (ሽቶ)", ratio: 0.015, unit: "L" },
      { name: "Purified Water (ንጹህ ውሃ)", ratio: 0.935, unit: "L" },
    ],
  },
];

function createProductionExpenseRecord(batchSizeLiters, formulaName, totalCost, costPerLiter, currency) {
  return {
    id: `exp-prod-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    title: `Raw Chemicals: ${batchSizeLiters}L ${formulaName} Batch`,
    category: "Raw Materials & Chemicals",
    amount: totalCost,
    paymentMethod: "Cash",
    notes: `Brewed batch: ${batchSizeLiters}L @ ${costPerLiter} ${currency}/L`,
  };
}

export default function BatchProductionWidget({
  products = [],
  currency = "ETB",
  onRestockLiters,
  onAddExpense,
}) {
  const [selectedFormulaId, setSelectedFormulaId] = useState("largo");
  const [batchSizeLiters, setBatchSizeLiters] = useState(200); // 100, 200, 400
  const [productionSuccess, setProductionSuccess] = useState(false);

  const activeFormula = useMemo(() => {
    return FORMULA_PRESETS.find((f) => f.id === selectedFormulaId) || FORMULA_PRESETS[0];
  }, [selectedFormulaId]);

  // Find corresponding product in store tanks (by matching category or name)
  const matchedProduct = useMemo(() => {
    return (
      products.find((p) => p.name.toLowerCase().includes(activeFormula.id)) ||
      products.find((p) => p.name.includes("Largo") || p.name.includes("ላርጎ")) ||
      products[0]
    );
  }, [products, activeFormula]);

  const retailRate = matchedProduct?.pricePerLiter || activeFormula.defaultPricePerLiter;
  const totalCost = Math.round(batchSizeLiters * activeFormula.costPerLiter);
  const totalRetail = Math.round(batchSizeLiters * retailRate);
  const projectedProfit = totalRetail - totalCost;
  const marginPct = totalRetail > 0 ? Math.round((projectedProfit / totalRetail) * 100) : 0;

  const handleProduceBatch = () => {
    if (!matchedProduct || !onRestockLiters) return;

    soundFX.playCheckoutChime();
    onRestockLiters(matchedProduct.id, batchSizeLiters, activeFormula.costPerLiter);

    if (onAddExpense) {
      onAddExpense(
        createProductionExpenseRecord(
          batchSizeLiters,
          activeFormula.name.split(" ")[0],
          totalCost,
          activeFormula.costPerLiter,
          currency
        )
      );
    }

    setProductionSuccess(true);
    setTimeout(() => setProductionSuccess(false), 3500);
  };

  return (
    <div className="dashboard-widget-card batch-production-card">
      <div className="widget-header-row">
        <div className="widget-title-wrap">
          <div className="widget-icon-avatar bg-cyan-subtle">
            <Beaker size={18} className="text-cyan" />
          </div>
          <div>
            <h4 className="widget-main-title">Soap Production Batch Mixer (የሳሙና ማምረቻ ቀመር)</h4>
            <span className="widget-sub-title">Barrel raw materials, chemical costs, and profit planner</span>
          </div>
        </div>

        {/* Formula Switcher */}
        <div className="formula-select-pills">
          {FORMULA_PRESETS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`formula-pill-btn ${selectedFormulaId === f.id ? "active" : ""}`}
              onClick={() => {
                soundFX.playPop();
                setSelectedFormulaId(f.id);
              }}
            >
              <span>{f.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Batch Size Selector */}
      <div className="batch-size-selector-row">
        <span className="batch-size-label">Select Barrel Size (የማምረቻ በርሜል):</span>
        <div className="batch-buttons-group">
          {[100, 200, 400].map((liters) => (
            <button
              key={liters}
              type="button"
              className={`btn-batch-size ${batchSizeLiters === liters ? "size-active" : ""}`}
              onClick={() => {
                soundFX.playPop();
                setBatchSizeLiters(liters);
              }}
            >
              <strong>{liters} Liters</strong>
              <span>{liters === 200 ? "(Standard Barrel)" : liters === 400 ? "(Large Tank)" : "(Small Half)"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chemical Ingredients Recipe Matrix */}
      <div className="batch-ingredients-box">
        <span className="box-section-title">Raw Chemical Recipe for {batchSizeLiters}L {activeFormula.name}</span>
        <div className="ingredients-chips-grid">
          {activeFormula.ingredients.map((ing, idx) => {
            const amount = (ing.ratio * batchSizeLiters).toFixed(1);
            return (
              <div key={idx} className="ingredient-chip">
                <span className="ing-name">{ing.name}</span>
                <strong className="ing-amount">{amount} {ing.unit}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Projections Summary Bar */}
      <div className="batch-financial-grid">
        <div className="batch-fin-item">
          <span className="fin-item-label">Raw Material Cost (የኬሚካል ወጪ)</span>
          <strong className="fin-item-val">{totalCost.toLocaleString()} {currency}</strong>
          <span className="fin-item-sub">~{activeFormula.costPerLiter} {currency} / Liter</span>
        </div>

        <div className="batch-fin-item">
          <span className="fin-item-label">Projected Retail Revenue (የሚሸጥበት ዋጋ)</span>
          <strong className="fin-item-val text-cyan">{totalRetail.toLocaleString()} {currency}</strong>
          <span className="fin-item-sub">{retailRate} {currency} / Liter</span>
        </div>

        <div className="batch-fin-item highlight-margin">
          <span className="fin-item-label">Projected Gross Profit (የሚገኝ ትርፍ)</span>
          <strong className="fin-item-val text-emerald">+{projectedProfit.toLocaleString()} {currency}</strong>
          <span className="margin-pct-pill">{marginPct}% Gross Margin</span>
        </div>
      </div>

      {/* Produce Action Trigger */}
      <div className="batch-action-row">
        {productionSuccess ? (
          <div className="batch-success-notice animate-fade">
            <CheckCircle2 size={16} />
            <span>Success! Produced {batchSizeLiters}L added directly to reservoir tank!</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-produce-batch"
            onClick={handleProduceBatch}
            title="Produce this batch and automatically add liters to tank"
          >
            <PackagePlus size={17} />
            <span>Produce {batchSizeLiters}L & Refill {activeFormula.name.split(" ")[0]} Tank</span>
          </button>
        )}
      </div>
    </div>
  );
}
