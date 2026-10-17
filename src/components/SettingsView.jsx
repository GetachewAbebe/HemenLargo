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
} from "lucide-react";
import { exportAllDataAsJSON } from "../utils/storage";
import { soundFX } from "../utils/audio";

export default function SettingsView({
  config,
  onSaveConfig,
  onResetDefaults,
  onImportData,
  onClearTransactionsOnly,
}) {
  const [formData, setFormData] = useState({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundFX.isMuted());

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
            <Store size={20} />
          </div>
          <div>
            <h3 className="section-title">Shop Profile & Receipt Header</h3>
            <p className="section-subtitle">
              These details appear on your printed receipts and customer bills.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {savedSuccess && (
            <div className="alert-success animate-fade">
              <Check size={18} />
              <span>Shop settings saved successfully!</span>
            </div>
          )}

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">Shop Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.shopName || ""}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tagline / Motto</label>
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
              <label className="form-label">Shop Owner / Cashier</label>
              <input
                type="text"
                className="form-input"
                value={formData.ownerName || ""}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
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
              <label className="form-label">Shop Location / Address</label>
              <input
                type="text"
                className="form-input"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input
                type="text"
                className="form-input"
                value={formData.currency || "ETB"}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Receipt Footer Message</label>
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
