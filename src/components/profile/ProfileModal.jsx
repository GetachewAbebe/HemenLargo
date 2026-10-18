import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Settings,
  Shield,
  Phone,
  Store,
  LogOut,
  Lock,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { soundFX } from "../../utils/audio";
import { updateActiveUserProfile } from "../../services/authService";
import SettingsView from "../SettingsView";

export default function ProfileModal({
  currentUser,
  config,
  onUpdateUser,
  onLogout,
  onClose,
  onSaveConfig,
  onResetDefaults,
  onImportData,
  onClearTransactionsOnly,
}) {
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'settings'
  const [fullName, setFullName] = useState(currentUser?.fullName || config?.ownerName || "Getachew");
  const [phone, setPhone] = useState(currentUser?.phone || config?.phone || "+251 91 100 0000");
  const [shopName, setShopName] = useState(currentUser?.shopName || config?.shopName || "Sukie Liquid Soap");
  const [pin, setPin] = useState(currentUser?.pin || "1234");
  const [showPin, setShowPin] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    const updated = updateActiveUserProfile(currentUser.id, {
      fullName,
      phone,
      shopName,
      role: "Owner",
      pin,
    });

    if (updated) {
      soundFX.playSuccess();
      onUpdateUser(updated);

      // Sync updated store name and owner name into store config
      if (onSaveConfig) {
        onSaveConfig({
          ...config,
          shopName,
          ownerName: fullName,
          phone,
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const initials = (fullName || "Cashier")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose}>
      <div
        className="profile-modal-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-title-row">
            <div className="profile-header-avatar">
              <span>{initials}</span>
            </div>
            <div className="profile-header-titles">
              <h2 className="profile-user-fullname">{fullName || "Cashier"}</h2>
              <span className="profile-user-role-badge">
                <Shield size={12} />
                <span>Owner (ባለቤት)</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            title="Close Profile (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="profile-tab-switcher">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setActiveTab("profile");
            }}
          >
            <User size={15} />
            <span>Cashier Profile (መገለጫ)</span>
          </button>

          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setActiveTab("settings");
            }}
          >
            <Settings size={15} />
            <span>Store & POS Settings (ማስተካከያ)</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="profile-modal-body">
          {activeTab === "profile" && (
            <div className="profile-tab-pane animate-fade">
              {savedSuccess && (
                <div className="profile-alert-ok">
                  <CheckCircle2 size={16} />
                  <span>Profile updated successfully! ማስተካከያው ተቀምጧል።</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label className="profile-label">Full Name (ሙሉ ስም)</label>
                    <div className="profile-input-wrap">
                      <User size={15} />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Getachew Abebe"
                        required
                      />
                    </div>
                  </div>

                  <div className="profile-field">
                    <label className="profile-label">Phone Number (ስልክ)</label>
                    <div className="profile-input-wrap">
                      <Phone size={15} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+251 91 100 0000"
                      />
                    </div>
                  </div>

                  <div className="profile-field">
                    <label className="profile-label">Store / Shop Name (የሱቁ ስም)</label>
                    <div className="profile-input-wrap">
                      <Store size={15} />
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Hemen Liquid Soap"
                        required
                      />
                    </div>
                  </div>

                  <div className="profile-field">
                    <label className="profile-label">Security PIN (ሚስጥር ቁጥር)</label>
                    <div className="profile-input-wrap">
                      <Lock size={15} />
                      <input
                        type={showPin ? "text" : "password"}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        minLength={4}
                        maxLength={12}
                        placeholder="Enter 4-digit PIN"
                      />
                      <button
                        type="button"
                        className="btn-profile-pwd-toggle"
                        onClick={() => setShowPin(!showPin)}
                        title={showPin ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="btn-save-profile">
                    <Save size={15} />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>

              {/* Account Management & Logout Area */}
              <div className="profile-danger-zone">
                <div className="danger-zone-text">
                  <strong>Session & Access Control</strong>
                  <span>Sign out of this counter terminal or switch cashier accounts.</span>
                </div>

                <button
                  type="button"
                  className="btn-profile-logout"
                  onClick={() => {
                    soundFX.playPop();
                    onLogout();
                  }}
                  title="Sign out of Sukie POS"
                >
                  <LogOut size={16} />
                  <span>Sign Out / Lock Terminal</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="profile-tab-pane animate-fade">
              <div className="profile-settings-embed">
                <SettingsView
                  config={config}
                  onSaveConfig={onSaveConfig}
                  onResetDefaults={onResetDefaults}
                  onImportData={onImportData}
                  onClearTransactionsOnly={onClearTransactionsOnly}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
