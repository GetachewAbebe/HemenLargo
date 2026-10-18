import React, { useState, useEffect } from "react";
import {
  Store,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  ShieldAlert,
  Volume2,
  VolumeX,
  Calendar,
} from "lucide-react";
import { exportAllDataAsJSON } from "../utils/storage";
import { soundFX } from "../utils/audio";
import { formatEthiopianDate } from "../utils/ethiopianDate";

export default function SettingsView({
  config,
  onSaveConfig,
  onResetDefaults,
  onImportData,
  onClearTransactionsOnly,
}) {
  const [formData, setFormData] = useState({ ...config });
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);
  const [savedCalendarSuccess, setSavedCalendarSuccess] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundFX.isMuted());
  const [previewNow] = useState(() => new Date());

  useEffect(() => {
    return soundFX.subscribe((muted) => setIsMuted(muted));
  }, []);

  const handleToggleMute = () => {
    const next = soundFX.toggleMute();
    setIsMuted(next);
    if (!next) {
      soundFX.playPop();
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    soundFX.playPop();
    setSavedProfileSuccess(true);
    setTimeout(() => setSavedProfileSuccess(false), 3000);
  };

  const handleSaveCalendar = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    soundFX.playPop();
    setSavedCalendarSuccess(true);
    setTimeout(() => setSavedCalendarSuccess(false), 3000);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.data) {
          onImportData(parsed.data);
          alert("Data successfully restored from backup file!");
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to read backup file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-layout animate-fade">
      {/* Store Information Form */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="stat-icon-wrapper stat-cyan">
            <Store size={22} />
          </div>
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
              <Check size={18} />
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
              <Check size={18} />
              <span>Save Shop Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Calendar System & Localization Preferences */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="stat-icon-wrapper stat-emerald">
            <Calendar size={22} />
          </div>
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
              <Check size={18} />
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
                <option value="ethiopian">🇪🇹 Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር) [Recommended]</option>
                <option value="gregorian">🌐 Gregorian Calendar (የፈረንጆች አቆጣጠር)</option>
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
              <Calendar size={16} />
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
              <Check size={18} />
              <span>Save Calendar Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Management & Backups */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="stat-icon-wrapper stat-purple">
            <Download size={20} />
          </div>
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
              <Download size={20} className="text-cyan" />
              <strong>Download Backup (JSON)</strong>
            </div>
            <p className="backup-tile-desc">
              Save a full copy of your soaps catalog, inventory liters, sales receipts, and expenses to your device.
            </p>
            <button className="btn-secondary" onClick={exportAllDataAsJSON}>
              <Download size={16} />
              <span>Export All Data Now</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="backup-tile">
            <div className="backup-tile-header">
              <Upload size={20} className="text-purple" />
              <strong>Restore from Backup</strong>
            </div>
            <p className="backup-tile-desc">
              Upload a previously exported JSON backup file to restore all your shop records.
            </p>
            <label className="btn-secondary file-upload-label">
              <Upload size={16} />
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
          <div className={`stat-icon-wrapper ${isMuted ? "stat-rose" : "stat-cyan"}`}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </div>
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
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
              🫧 Soap Bubble Pop
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playBeep()}
            >
              🔊 POS Scanner Beep
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playCoin()}
            >
              🪙 Cash Coin Chime
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playCheckoutChime()}
            >
              🔔 Completion Fanfare
            </button>
            <button
              type="button"
              className="btn-audio-test"
              onClick={() => soundFX.playWarning()}
            >
              ⚠️ Low Stock Buzz
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset or Clear */}
      <div className="settings-card danger-card">
        <div className="settings-card-header">
          <div className="stat-icon-wrapper stat-rose">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="section-title text-rose">Maintenance & Reset</h3>
            <p className="section-subtitle">
              Reset demo transactions or restore original starter soaps.
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
            <Trash2 size={16} />
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
            <RefreshCw size={16} />
            <span>Reset to Starter Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
