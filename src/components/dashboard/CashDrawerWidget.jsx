import React, { useState } from "react";
import {
  Banknote,
  ArrowRightLeft,
  Smartphone,
  Edit3,
  Save,
} from "lucide-react";
import { soundFX } from "../../utils/audio";

export default function CashDrawerWidget({
  todaySales = [],
  todayExpenses = [],
  currency = "ETB",
  cashierName = "Cashier",
}) {
  const [openingFloat, setOpeningFloat] = useState(() => {
    const saved = localStorage.getItem("sukie_cash_drawer_float");
    return saved !== null ? parseFloat(saved) : 500;
  });
  const [isEditingFloat, setIsEditingFloat] = useState(false);
  const [tempFloat, setTempFloat] = useState(openingFloat);

  // Cash sales collected today
  const todayCashSales = todaySales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((acc, s) => acc + (s.total || 0), 0);

  // Digital payments today (Telebirr & CBE Birr)
  const todayTelebirr = todaySales
    .filter((s) => s.paymentMethod === "Telebirr")
    .reduce((acc, s) => acc + (s.total || 0), 0);

  const todayCbeBirr = todaySales
    .filter((s) => s.paymentMethod === "CBE Birr")
    .reduce((acc, s) => acc + (s.total || 0), 0);

  // Cash expenses paid out of drawer today
  const todayCashExpenses = todayExpenses
    .filter((e) => !e.paymentMethod || e.paymentMethod === "Cash")
    .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

  // Calculated expected cash in drawer
  const expectedCashInDrawer = Math.max(0, openingFloat + todayCashSales - todayCashExpenses);

  const handleSaveFloat = (e) => {
    e.preventDefault();
    const val = parseFloat(tempFloat) || 0;
    setOpeningFloat(val);
    localStorage.setItem("sukie_cash_drawer_float", val.toString());
    setIsEditingFloat(false);
    soundFX.playPop();
  };

  return (
    <div className="dashboard-widget-card cash-drawer-card">
      <div className="widget-header-row">
        <div className="widget-title-wrap">
          <div className="widget-icon-avatar bg-emerald-subtle">
            <Banknote size={18} className="text-emerald" />
          </div>
          <div>
            <h4 className="widget-main-title">Cash Drawer & Counter Shift (የካውንተር ቁጥጥር)</h4>
            <span className="widget-sub-title">Real-time physical cash float vs digital channels</span>
          </div>
        </div>

        <div className="shift-active-beacon">
          <span className="beacon-dot"></span>
          <span>Shift Active: <strong>{cashierName}</strong></span>
        </div>
      </div>

      {/* Main Expected Drawer Balance Banner */}
      <div className="drawer-balance-hero">
        <div className="drawer-balance-info">
          <span className="drawer-balance-label">Expected Physical Cash in Drawer (ካዝና ውስጥ ያለ ጥሬ ብር)</span>
          <div className="drawer-amount-row">
            <strong className="drawer-amount-num text-emerald">
              {expectedCashInDrawer.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
            <span className="drawer-currency-badge">{currency}</span>
          </div>
        </div>

        {/* Float Edit Button / Modal Trigger */}
        {!isEditingFloat ? (
          <button
            type="button"
            className="btn-edit-float"
            onClick={() => {
              setTempFloat(openingFloat);
              setIsEditingFloat(true);
              soundFX.playPop();
            }}
            title="Adjust Opening Float"
          >
            <Edit3 size={13} />
            <span>Float: {openingFloat.toLocaleString()} {currency}</span>
          </button>
        ) : (
          <form onSubmit={handleSaveFloat} className="float-inline-form">
            <input
              type="number"
              className="float-num-input"
              value={tempFloat}
              onChange={(e) => setTempFloat(e.target.value)}
              step="50"
              autoFocus
            />
            <button type="submit" className="btn-save-float" title="Save Opening Float">
              <Save size={13} />
            </button>
          </form>
        )}
      </div>

      {/* Drawer Mathematical Reconciliation Breakdown */}
      <div className="drawer-reconcile-grid">
        <div className="drawer-flow-item">
          <span className="flow-item-label">Opening Float (መነሻ ካፒታል)</span>
          <strong className="flow-item-val">+{openingFloat.toLocaleString()} {currency}</strong>
        </div>

        <div className="drawer-flow-item">
          <span className="flow-item-label">Cash Collected (የጥሬ ሽያጭ)</span>
          <strong className="flow-item-val text-emerald">+{todayCashSales.toLocaleString()} {currency}</strong>
        </div>

        <div className="drawer-flow-item">
          <span className="flow-item-label">Cash Payouts (ወጪ የተከፈለ)</span>
          <strong className="flow-item-val text-rose">-{todayCashExpenses.toLocaleString()} {currency}</strong>
        </div>
      </div>

      {/* Digital Bank & Mobile Channels Summary */}
      <div className="drawer-digital-row">
        <div className="digital-channel-chip">
          <Smartphone size={14} className="text-teal" />
          <span>Telebirr:</span>
          <strong>{todayTelebirr.toLocaleString()} {currency}</strong>
        </div>

        <div className="digital-channel-chip">
          <ArrowRightLeft size={14} className="text-blue" />
          <span>CBE Birr:</span>
          <strong>{todayCbeBirr.toLocaleString()} {currency}</strong>
        </div>

        <div className="digital-total-chip">
          <span>Total Digital Banked:</span>
          <strong>{(todayTelebirr + todayCbeBirr).toLocaleString()} {currency}</strong>
        </div>
      </div>
    </div>
  );
}
