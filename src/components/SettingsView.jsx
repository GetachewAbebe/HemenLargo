import React, { useState } from "react";
import { exportAllDataAsJSON } from "../utils/storage";
import { soundFX } from "../utils/audio";
import { formatEthiopianDate } from "../utils/ethiopianDate";
import { useApp } from "../context";
import { localDateKey } from "../services/formatters";

const OPERATION_LABELS = {
  sale: "Sale",
  void_sale: "Void sale",
  clear_sales: "Clear all sales",
  stock_update: "Stock update",
  product_upsert: "Product change",
  product_restock: "Restock",
  product_delete: "Delete product",
  expense_upsert: "Expense",
  expense_delete: "Delete expense",
  debt_upsert: "New debt",
  debt_delete: "Delete debt",
  debt_payment: "Debt repayment",
  config_upsert: "Shop settings",
  initial_products: "Starter products",
};

const describeOperation = (op, currency) => {
  const p = op.payload || {};
  switch (op.type) {
    case "sale":
      return `${p.id} · ${Number(p.total || 0).toFixed(2)} ${currency}`;
    case "void_sale":
      return p.saleId;
    case "product_upsert":
      return p.name;
    case "product_restock":
      return `${p.liters} L → ${p.productId}`;
    case "expense_upsert":
      return `${p.title} · ${Number(p.amount || 0).toFixed(2)} ${currency}`;
    case "debt_upsert":
      return `${p.customerName} · ${Number(p.totalAmount || 0).toFixed(2)} ${currency}`;
    case "debt_payment":
      return `${Number(p.payment?.amount || 0).toFixed(2)} ${currency}`;
    default:
      return "";
  }
};

function SyncIssuesCard({ issues, currency, onRetry, onDiscard }) {
  if (!issues.length) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(issues, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sukie-sync-issues-${localDateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-card danger-card sync-issues-card">
      <div className="settings-card-header">
        <div>
          <h3 className="section-title text-rose">Sync Issues ({issues.length})</h3>
          <p className="section-subtitle">
            These changes were saved on this device but the cloud rejected them, so other devices don't see them.
            Retry after fixing the cause (for example, restocking a tank), or discard to accept the cloud's data.
          </p>
        </div>
      </div>

      <ul className="sync-issues-list">
        {issues.map((issue) => (
          <li key={issue.id} className="sync-issue-row">
            <div className="sync-issue-info">
              <strong>{OPERATION_LABELS[issue.type] || issue.type}</strong>
              <span className="sync-issue-detail">{describeOperation(issue, currency)}</span>
              <span className="sync-issue-error">{issue.error}</span>
              <span className="sync-issue-date">{new Date(issue.createdAt).toLocaleString()}</span>
            </div>
            <div className="sync-issue-actions">
              <button type="button" className="btn-primary" onClick={() => onRetry(issue.id)}>
                Retry
              </button>
              <button
                type="button"
                className="btn-danger-outline"
                onClick={() => {
                  if (window.confirm("Discard this change? This device will reload the cloud's data and the change will be lost.")) {
                    onDiscard(issue.id);
                  }
                }}
              >
                Discard
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" className="btn-danger-outline" onClick={handleExport}>
        Export issues as JSON
      </button>
    </div>
  );
}

export default function SettingsView({
  config,
  onSaveConfig,
  onResetDefaults,
  onImportData,
  onClearTransactionsOnly,
  shopId,
}) {
  const { syncIssues, retrySyncIssue, discardSyncIssue, isOwner, currency, products, sales, expenses, debts } = useApp();
  const [formData, setFormData] = useState({ ...config });
  const [prevConfig, setPrevConfig] = useState(config);
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);
  const [savedCalendarSuccess, setSavedCalendarSuccess] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundFX.isMuted());
  const [previewNow] = useState(() => new Date());

  if (config !== prevConfig) {
    setPrevConfig(config);
    setFormData({ ...config });
  }

  const handleSaveProfile = (e) => {
    e.preventDefault();
    soundFX.playPop();
    onSaveConfig(formData);
    setSavedProfileSuccess(true);
    setTimeout(() => setSavedProfileSuccess(false), 3000);
  };

  const handleSaveCalendar = (e) => {
    e.preventDefault();
    soundFX.playPop();
    onSaveConfig(formData);
    setSavedCalendarSuccess(true);
    setTimeout(() => setSavedCalendarSuccess(false), 3000);
  };

  const handleToggleMute = () => {
    const nextMuted = soundFX.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundFX.playPop();
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        soundFX.playCheckoutChime();
        onImportData(parsed);
      } catch (err) {
        console.warn("Import failed:", err);
        soundFX.playWarning();
        alert("Failed to read JSON backup file. Please check file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-layout animate-fade">
      <SyncIssuesCard
        issues={syncIssues}
        currency={currency}
        onRetry={retrySyncIssue}
        onDiscard={discardSyncIssue}
      />

      {/* Store Information Form */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3 className="section-title">Shop Profile & Receipt Header</h3>
            <p className="section-subtitle">
              These details appear on your printed receipts and customer bills.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="settings-form">
          {savedProfileSuccess && (
            <div className="alert-success animate-fade">
              <span>Shop profile details updated successfully!</span>
            </div>
          )}

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">
                <span>Shop Name *</span>
                <span className="form-label-hint">Required</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.shopName || ""}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span>Tagline / Motto</span>
                <span className="form-label-hint">Shown under logo</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.tagline || ""}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">
                <span>Shop Owner / Cashier</span>
                <span className="form-label-hint">Greeting & sign-off</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.ownerName || ""}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span>Phone Number</span>
                <span className="form-label-hint">For receipts</span>
              </label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">
                <span>Shop Location / Address</span>
                <span className="form-label-hint">Addis Ababa, etc.</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span>Currency Symbol</span>
                <span className="form-label-hint">e.g. ETB</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.currency || "ETB"}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Receipt Footer Message</span>
              <span className="form-label-hint">Appears at bottom of slip</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.receiptFooter || ""}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
            />
          </div>

          <div className="form-actions-row">
            <button type="submit" className="btn-primary">
              <span>Save Shop Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Calendar System & Localization Preferences */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3 className="section-title">Calendar System & Date Preferences (የቀን መቁጠሪያ)</h3>
            <p className="section-subtitle">
              Configure whether receipts, headers, analytics, and sales logs use Ethiopian or Gregorian dates.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCalendar} className="settings-form">
          {savedCalendarSuccess && (
            <div className="alert-success animate-fade">
              <span>Calendar preferences saved and applied across the app!</span>
            </div>
          )}

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">
                <span>Primary Calendar System (የቀን አቆጣጠር)</span>
                <span className="form-label-hint">System-wide</span>
              </label>
              <select
                className="form-input"
                value={formData.calendarSystem || "ethiopian"}
                onChange={(e) => setFormData({ ...formData, calendarSystem: e.target.value })}
              >
                <option value="ethiopian">Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር) [Recommended]</option>
                <option value="gregorian">Gregorian Calendar (የፈረንጆች አቆጣጠር)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Date Display Style (የአቀራረብ ዘይቤ)</span>
                <span className="form-label-hint">Formatting format</span>
              </label>
              <select
                className="form-input"
                value={formData.calendarStyle || "amharic"}
                disabled={formData.calendarSystem === "gregorian"}
                onChange={(e) => setFormData({ ...formData, calendarStyle: e.target.value })}
              >
                <option value="amharic">አማርኛ (e.g. ጥቅምት 8, 2019 ዓ.ም)</option>
                <option value="full">ሙሉ አማርኛ (e.g. እሑድ፣ ጥቅምት 8 ቀን 2019 ዓ.ም)</option>
                <option value="latin">English / Latin (e.g. Sunday, 8 Tikimt 2019 E.C.)</option>
                <option value="dual">Dual View (e.g. ጥቅምት 8, 2019 [Oct 18, 2026])</option>
                <option value="geez">Ge'ez Numerals (e.g. ፰ ጥቅምት ፳፻፲፱ ዓ.ም)</option>
              </select>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="calendar-preview-card">
            <div className="calendar-preview-title">
              <span>Live Date Preview (ቅድመ ዕይታ)</span>
            </div>
            <div className="calendar-preview-text">
              {formData.calendarSystem === "gregorian"
                ? previewNow.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : formatEthiopianDate(previewNow, formData.calendarStyle || "amharic")}
            </div>
            <span className="calendar-preview-hint">
              This formatted date will appear on your top header, thermal receipts, and transaction records.
            </span>
          </div>

          <div className="form-actions-row">
            <button type="submit" className="btn-primary">
              <span>Save Calendar Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Management & Backups */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3 className="section-title">Data Backup & Safety</h3>
            <p className="section-subtitle">
              Export and download your complete sales, stock, and expense records anytime.
            </p>
          </div>
        </div>

        <div className="backup-actions-grid">
          {/* Export JSON */}
          <div className="backup-tile">
            <div className="backup-tile-header">
              <strong>Download Backup (JSON)</strong>
            </div>
            <p className="backup-tile-desc">
              Save a full copy of your soaps catalog, inventory liters, sales receipts, and expenses to your device.
            </p>
            <button className="btn-secondary" onClick={() => exportAllDataAsJSON(shopId, { config, products, sales, expenses, debts })}>
              <span>Export All Data Now</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="backup-tile">
            <div className="backup-tile-header">
              <strong>Restore from Backup</strong>
            </div>
            <p className="backup-tile-desc">
              Restore a backup to this device only. Cloud records are not overwritten.
            </p>
            <label className="btn-secondary file-upload-label">
              <span>Choose Backup File</span>
              <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleFileImport}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Audio & Sound Preferences */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-header-text-flex">
            <div>
              <h3 className="section-title">POS Sound Effects & Cashier Audio</h3>
              <p className="section-subtitle">
                Synthesized sound cues for soap dispensing, item scanning, cash tender, and completions.
              </p>
            </div>
            <button
              type="button"
              className={`btn-sound-toggle-large ${isMuted ? "toggle-muted" : "toggle-active"}`}
              onClick={handleToggleMute}
            >
              <span>{isMuted ? "Sound: Muted" : "Sound: Active (ON)"}</span>
            </button>
          </div>
        </div>

        <div className="audio-test-station">
          <span className="audio-test-label">TEST SOUND CHIMES:</span>
          <div className="audio-buttons-row">
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playPop()}
            >
              Pop Sound
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playBeep()}
            >
              Scanner Beep
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playCoin()}
            >
              Coin Chime
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playCheckoutChime()}
            >
              Completion Fanfare
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playWarning()}
            >
              Stock Alert Buzz
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset or Clear (owner only; also enforced by the database) */}
      {isOwner && (
      <div className="settings-card danger-card">
        <div className="settings-card-header">
          <div>
            <h3 className="section-title text-rose">Maintenance & Reset</h3>
            <p className="section-subtitle">
              Clear synced sales records or restore starter demo data on this device only.
            </p>
          </div>
        </div>

        <div className="danger-actions-row">
          <button
            className="btn-danger-outline"
            onClick={() => {
              if (
                window.confirm(
                  "Clear all sales transactions to start with a clean slate? (Soap inventory catalog will be preserved)."
                )
              ) {
                onClearTransactionsOnly();
              }
            }}
          >
            <span>Clear Sales Records (Keep Soaps)</span>
          </button>

          <button
            className="btn-danger-outline"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to reset everything back to default demo data? All custom entries will be replaced."
                )
              ) {
                onResetDefaults();
              }
            }}
          >
            <span>Reset to Starter Demo Data</span>
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
