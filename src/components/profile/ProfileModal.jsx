import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { soundFX } from "../../utils/audio";
import { updateActiveUserProfile } from "../../services/authService";
import SettingsView from "../SettingsView";
import { useApp } from "../../context";

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
  const { role } = useApp();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'settings'
  const [fullName, setFullName] = useState(currentUser?.fullName || config?.ownerName || "Getachew");
  const [phone, setPhone] = useState(currentUser?.phone || config?.phone || "+251 91 100 0000");
  const [shopName, setShopName] = useState(currentUser?.shopName || config?.shopName || "Sukie Liquid Soap");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Close on Escape key and prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    soundFX.playPop();

    try {
      const updated = await updateActiveUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        shopName: shopName.trim(),
      });
      if (onUpdateUser) {
        onUpdateUser(updated);
      }

      if (onSaveConfig && config) {
        onSaveConfig({
          ...config,
          shopName: shopName.trim(),
          ownerName: fullName.trim(),
          phone: phone.trim(),
        });
      }

      setErrorMessage("");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error("Could not update the authenticated profile:", error);
      setErrorMessage(`Profile update failed: ${error.message}`);
    }
  };

  const initials = (fullName || "Cashier")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const modalContent = (
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
                <span>{role === "cashier" ? "Cashier (ገንዘብ ተቀባይ)" : "Owner (ባለቤት)"}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            title="Close Profile (Esc)"
          >
            ×
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
            <span>Store & POS Settings (ማስተካከያ)</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="profile-modal-body">
          {activeTab === "profile" && (
            <div className="profile-tab-pane animate-fade">
              {savedSuccess && (
                <div className="profile-alert-ok">
                  <span>Profile updated successfully! ማስተካከያው ተቀምጧል።</span>
                </div>
              )}
              {errorMessage && (
                <div className="auth-alert-box alert-error" role="alert">
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label className="profile-label">Full Name (ሙሉ ስም)</label>
                    <div className="profile-input-wrap">
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
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Hemen Liquid Soap"
                        required
                      />
                    </div>
                  </div>

                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="btn-save-profile">
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
                  shopId={currentUser?.shopId}
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

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
