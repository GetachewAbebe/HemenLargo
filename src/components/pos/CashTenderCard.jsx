import React from "react";
import { Banknote } from "lucide-react";
import { soundFX } from "../../utils/audio";

export default function CashTenderCard({
  finalTotal,
  cashTendered,
  setCashTendered,
  changeDue,
  currency = "ETB",
}) {
  const tenderedNum = parseFloat(cashTendered) || 0;
  const hasTendered = tenderedNum > 0;
  const isShort = hasTendered && tenderedNum < finalTotal;
  const shortage = isShort ? Number((finalTotal - tenderedNum).toFixed(2)) : 0;

  return (
    <div className="cash-tender-card animate-fade">
      <div className="cash-tender-header">
        <Banknote size={14} className="text-emerald" />
        <strong>Cash Tender & Change Due (ጥሬ ገንዘብ & መልስ)</strong>
      </div>
      <div className="cash-quick-denominations">
        <button
          type="button"
          className="btn-quick-denom btn-exact-denom"
          onClick={() => {
            soundFX.playCoin();
            setCashTendered(finalTotal > 0 ? (Number.isInteger(finalTotal) ? finalTotal.toString() : finalTotal.toFixed(2)) : "0");
          }}
          title="Exact change (ትክክለኛ ሂሳብ)"
        >
          Exact ({finalTotal > 0 ? (Number.isInteger(finalTotal) ? finalTotal : finalTotal.toFixed(2)) : 0})
        </button>
        {[50, 100, 200, 500, 1000].map((denom) => (
          <button
            key={denom}
            type="button"
            className="btn-quick-denom"
            onClick={() => {
              soundFX.playCoin();
              setCashTendered(denom.toString());
            }}
          >
            {denom} ብር
          </button>
        ))}
      </div>
      <div className="cash-input-and-change-row">
        <div className="cash-tender-input-wrap">
          <label className="cash-sublabel">Amount Received ({currency})</label>
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder={`e.g. ${finalTotal > 0 ? Math.ceil(finalTotal / 50) * 50 : 500}`}
            className="cash-received-input"
            value={cashTendered}
            onChange={(e) => setCashTendered(e.target.value)}
          />
        </div>
        <div
          className={`change-due-box ${
            isShort ? "change-shortage" : changeDue > 0 ? "change-positive" : ""
          }`}
        >
          <span className="change-due-label">
            {isShort ? "SHORTAGE (ቀሪ ያልተከፈለ)" : "CHANGE TO RETURN (መልስ)"}
          </span>
          <strong className="change-due-amount">
            {isShort ? `-${shortage.toFixed(2)}` : changeDue.toFixed(2)}{" "}
            <span className="change-cur">{currency}</span>
          </strong>
        </div>
      </div>
    </div>
  );
}
