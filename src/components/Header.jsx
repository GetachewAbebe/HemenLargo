import React, { useState, useEffect } from "react";
import { AlertTriangle, Wallet, ShoppingBag, Droplets, Plus, Clock, Volume2, VolumeX } from "lucide-react";
import { soundFX } from "../utils/audio";
import { useApp } from "../context";

export default function Header({
  config,
  sales = [],
  debts = [],
  products = [],
  onNewSaleClick,
  activeTab,
}) {
  const { cloudStatus } = useApp();
  const [isMuted, setIsMuted] = useState(() => soundFX.isMuted());

  useEffect(() => {
    return soundFX.subscribe((muted) => setIsMuted(muted));
  }, []);

  const handleToggleSound = () => {
    const next = soundFX.toggleMute();
    setIsMuted(next);
    if (!next) {
      soundFX.playPop();
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);
  const todayLiters = todaySales.reduce((acc, s) => {
    return acc + (s.items?.reduce((iAcc, item) => iAcc + (item.liters || 0), 0) || 0);
  }, 0);

  const totalPendingDebt = debts
    .filter((d) => d.status !== "Paid")
    .reduce((acc, d) => acc + (d.remainingBalance || 0), 0);

  const lowStockCount = products.filter(
    (p) => p.stockLiters <= (p.minStockAlert || 40)
  ).length;

  const todayDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="no-print top-header-v2">
      <div className="header-brand-group">
        <div className="header-logo-container bubble-anim">
          <span className="header-logo-emoji">🫧</span>
        </div>
        <div className="header-brand-text">
          <div className="header-title-line">
            <h1 className="header-store-title">{config.shopName || "Sukie"}</h1>
            <span className="live-status-pill">
              <span className="live-dot-pulse"></span> Open Store
            </span>
            <span
              className="live-status-pill"
              style={
                cloudStatus === "connected"
                  ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }
                  : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
              }
              title={
                cloudStatus === "connected"
                  ? "Real-time sync active with Hemen-Soap-Shop on Supabase"
                  : "Operating with local offline cache"
              }
            >
              <span
                className="live-dot-pulse"
                style={{
                  backgroundColor: cloudStatus === "connected" ? "#3b82f6" : "#94a3b8",
                  boxShadow:
                    cloudStatus === "connected"
                      ? "0 0 8px #60a5fa"
                      : "none",
                }}
              ></span>
              {cloudStatus === "connected" ? "☁️ Supabase Cloud" : "Offline"}
            </span>
          </div>
          <p className="header-store-tagline">
            {config.tagline || "ፈሳሽ ሳሙና (ላርጎ) እና በረኪና • Quality Cleansers"}
          </p>
        </div>
      </div>

      <div className="header-stats-container">
        {/* Date Tag */}
        <div className="header-date-pill">
          <Clock size={14} className="text-teal" />
          <span>{todayDateFormatted}</span>
        </div>

        {/* Today's Sales */}
        <div className="header-kpi-card">
          <div className="kpi-icon-box kpi-emerald">
            <ShoppingBag size={17} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Today's Sales</span>
            <span className="kpi-val">
              {todayRevenue.toLocaleString()} <span className="kpi-currency">{config.currency}</span>
            </span>
          </div>
        </div>

        {/* Liters Dispensed */}
        <div className="header-kpi-card">
          <div className="kpi-icon-box kpi-cyan">
            <Droplets size={17} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Liters Dispensed</span>
            <span className="kpi-val">
              {todayLiters.toFixed(1)} <span className="kpi-currency">L</span>
            </span>
          </div>
        </div>

        {/* Customer Debts (ዕዳ) */}
        <div className="header-kpi-card">
          <div className="kpi-icon-box kpi-rose">
            <Wallet size={17} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Customer Debts (ዕዳ)</span>
            <span className="kpi-val text-rose">
              {totalPendingDebt.toLocaleString()} <span className="kpi-currency">{config.currency}</span>
            </span>
          </div>
        </div>

        {/* Low Stock Alert if any */}
        {lowStockCount > 0 && (
          <div className="header-kpi-card kpi-warning-card">
            <div className="kpi-icon-box kpi-amber">
              <AlertTriangle size={17} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Tank Alert</span>
              <span className="kpi-val text-amber">{lowStockCount} Low</span>
            </div>
          </div>
        )}

        {/* Sound FX Toggle Button */}
        <button
          className={`btn-sound-toggle ${isMuted ? "sound-muted" : "sound-on"}`}
          onClick={handleToggleSound}
          title={isMuted ? "Sound effects muted (Click to unmute)" : "Sound effects active (Click to mute)"}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          <span className="sound-label">{isMuted ? "Muted" : "Sound"}</span>
        </button>

        {/* Quick New Sale Button */}
        {activeTab !== "pos" && (
          <button className="btn-header-new-sale" onClick={onNewSaleClick}>
            <Plus size={16} />
            <span>POS Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
