import React, { useState, useMemo } from "react";
import { Calendar, CalendarClock, RotateCcw, AlertTriangle } from "lucide-react";
import { formatEthiopianDate } from "../../utils/ethiopianDate";
import { soundFX } from "../../utils/audio";

const TODAY_ISO = new Date().toISOString().split("T")[0];

export default function SaleDateSelector({
  saleDateMode, // 'today' | 'yesterday' | 'custom'
  onSelectMode,
  customDateStr, // 'YYYY-MM-DD'
  onCustomDateChange,
  customTimeStr, // 'HH:MM'
  onCustomTimeChange,
  onResetToToday,
}) {
  const [baseNow] = useState(() => new Date());

  // Calculate preview Date object based on current state
  const previewDate = useMemo(() => {
    if (saleDateMode === "today") {
      return baseNow;
    }
    if (saleDateMode === "yesterday") {
      const y = new Date(baseNow);
      y.setDate(y.getDate() - 1);
      return y;
    }
    if (saleDateMode === "custom" && customDateStr) {
      const [year, month, day] = customDateStr.split("-").map(Number);
      let hours = baseNow.getHours();
      let minutes = baseNow.getMinutes();
      if (customTimeStr) {
        const [h, m] = customTimeStr.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          hours = h;
          minutes = m;
        }
      }
      return new Date(year, month - 1, day, hours, minutes);
    }
    return baseNow;
  }, [saleDateMode, customDateStr, customTimeStr, baseNow]);

  const isBackdated = saleDateMode !== "today";

  return (
    <div className="pos-date-selector-card">
      <div className="pos-date-header-row">
        <label className="field-label">
          <Calendar size={13} className="text-teal" />
          <span>Sale Registration Date (የሽያጭ ቀን)</span>
        </label>
        {isBackdated && (
          <button
            type="button"
            className="btn-date-reset-link"
            onClick={() => {
              soundFX.playPop();
              onResetToToday();
            }}
            title="Reset to current live date & time"
          >
            <RotateCcw size={11} />
            <span>Reset to Today</span>
          </button>
        )}
      </div>

      {/* Date Mode Pills */}
      <div className="pos-date-tabs-grid">
        <button
          type="button"
          className={`pos-date-tab-btn ${saleDateMode === "today" ? "tab-active" : ""}`}
          onClick={() => {
            soundFX.playPop();
            onSelectMode("today");
          }}
        >
          <span>⚡ ዛሬ (Today)</span>
        </button>

        <button
          type="button"
          className={`pos-date-tab-btn ${saleDateMode === "yesterday" ? "tab-active" : ""}`}
          onClick={() => {
            soundFX.playPop();
            onSelectMode("yesterday");
          }}
        >
          <span>ትላንት (Yesterday)</span>
        </button>

        <button
          type="button"
          className={`pos-date-tab-btn ${saleDateMode === "custom" ? "tab-active" : ""}`}
          onClick={() => {
            soundFX.playPop();
            onSelectMode("custom");
          }}
        >
          <CalendarClock size={13} />
          <span>ቀን ይምረጡ (Pick)</span>
        </button>
      </div>

      {/* Custom Date Input (shown when "Pick Date" is selected) */}
      {saleDateMode === "custom" && (
        <div className="pos-custom-date-inputs animate-fade">
          <div className="pos-date-inputs-row">
            <div className="pos-date-input-wrap">
              <label className="pos-sub-label">Date (ቀን):</label>
              <input
                type="date"
                className="field-input pos-date-field"
                max={TODAY_ISO}
                value={customDateStr}
                onChange={(e) => onCustomDateChange(e.target.value)}
              />
            </div>
            <div className="pos-time-input-wrap">
              <label className="pos-sub-label">Time (ሰዓት - optional):</label>
              <input
                type="time"
                className="field-input pos-time-field"
                value={customTimeStr}
                onChange={(e) => onCustomTimeChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ethiopian Date Visual Badge */}
      <div className={`pos-date-preview-badge ${isBackdated ? "badge-backdated" : "badge-today"}`}>
        <div className="pos-date-badge-left">
          <span className="pos-date-flag-icon">🇪🇹</span>
          <div className="pos-date-badge-text">
            <strong className="eth-full-date">
              {formatEthiopianDate(previewDate, "full")}
            </strong>
            <span className="greg-date-sub">
              {previewDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })} • {previewDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        {isBackdated && (
          <span className="backdated-warning-tag">
            <AlertTriangle size={11} />
            <span>Backdated</span>
          </span>
        )}
      </div>
    </div>
  );
}
