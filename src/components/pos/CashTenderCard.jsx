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
            setCashTendered(finalTotal > 0 ? finalTotal.toFixed(0) : "0");
          }}
          title="Exact change (ትክክለኛ ሂሳብ)"
        >
          Exact ({finalTotal > 0 ? finalTotal.toFixed(0) : 0})
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
            step="1"
            min="0"
            placeholder={`e.g. ${finalTotal > 0 ? Math.ceil(finalTotal / 100) * 100 : 500}`}
            className="cash-received-input"
            value={cashTendered}
            onChange={(e) => setCashTendered(e.target.value)}
          />
        </div>
        <div className={`change-due-box ${changeDue > 0 ? "change-positive" : ""}`}>
          <span className="change-due-label">CHANGE TO RETURN</span>
          <strong className="change-due-amount">
            {changeDue.toFixed(2)} <span className="change-cur">{currency}</span>
          </strong>
        </div>
      </div>
    </div>
  );
}
