import React, { useState } from "react";
import { soundFX } from "../../utils/audio";
import { loginUser, registerUser } from "../../services/authService";
import { exportLegacyLocalDataAsJSON } from "../../utils/storage";

export default function AuthScreen({ onAuthSuccess, initialShopName = "Sukie Liquid Soap", authError = "" }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState(initialShopName);
  const [phone, setPhone] = useState("");

  const handleTabSwitch = (newMode) => {
    soundFX.playPop();
    setErrorMessage("");
    setSuccessMessage("");
    setMode(newMode);
  };

  const handleLegacyBackup = () => {
    try {
      const exported = exportLegacyLocalDataAsJSON();
      setBackupMessage(
        exported
          ? "Legacy local data backup downloaded. Keep it in a safe place."
          : "No pre-migration local shop data was found on this device."
      );
    } catch (error) {
      console.error("Could not export legacy local data:", error);
      setBackupMessage(`Backup failed: ${error.message}`);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const result =
        mode === "login"
          ? await loginUser(email, password)
          : await registerUser({ email, password, fullName, shopName, phone });

      if (!result.success) {
        soundFX.playWarning();
        setErrorMessage(result.error);
        return;
      }

      if (result.confirmationRequired) {
        setSuccessMessage("Check your email to confirm your account, then sign in.");
        return;
      }

      soundFX.playSuccess();
      onAuthSuccess(result.user);
    } catch (error) {
      soundFX.playWarning();
      setErrorMessage(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-ambient-glow glow-teal"></div>
      <div className="auth-ambient-glow glow-blue"></div>

      <div className="auth-card-container animate-fade">
        <div className="auth-brand-block">
          <div className="auth-icon-avatar">
            <span className="auth-avatar-text">S</span>
          </div>
          <h1 className="auth-brand-title">SUKIE | ሱቄ</h1>
          <p className="auth-brand-subtitle">
            Smart Liquid Soap Counter &amp; Operations • የፈሳሽ ሳሙና እና በረኪና መሸጫና መቆጣጠሪያ
          </p>
        </div>

        <div className="auth-mode-dock">
          <button
            type="button"
            className={`auth-dock-btn ${mode === "login" ? "dock-active" : ""}`}
            onClick={() => handleTabSwitch("login")}
          >
            <span>Sign In (ግባ)</span>
          </button>
          <button
            type="button"
            className={`auth-dock-btn ${mode === "register" ? "dock-active" : ""}`}
            onClick={() => handleTabSwitch("register")}
          >
            <span>Register (ተመዝገብ)</span>
          </button>
        </div>

        {(errorMessage || authError) && (
          <div className="auth-alert-box alert-error animate-fade" role="alert">
            <span>{errorMessage || authError}</span>
          </div>
        )}
        {successMessage && (
          <div className="auth-alert-box alert-success animate-fade" role="status">
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-body animate-fade">
          {mode === "register" && (
            <>
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-full-name">Full Name (ሙሉ ስም)</label>
                <input
                  id="auth-full-name"
                  type="text"
                  className="auth-text-input"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-shop-name">Shop / Store Name (የሱቁ ስም)</label>
                <input
                  id="auth-shop-name"
                  type="text"
                  className="auth-text-input"
                  autoComplete="organization"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  required
                />
              </div>
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-phone">Phone Number (ስልክ ቁጥር)</label>
                <input
                  id="auth-phone"
                  type="tel"
                  className="auth-text-input"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="auth-text-input"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-password">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="auth-text-input"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={mode === "register" ? 8 : undefined}
                required
              />
              <button
                type="button"
                className="auth-btn-pwd-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "register" && <small>Use at least 8 characters.</small>}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            <span>{isSubmitting ? "Please wait..." : mode === "login" ? "Access POS Counter" : "Register & Launch Store POS"}</span>
          </button>
        </form>

        {backupMessage && <div className="auth-alert-box alert-success" role="status">{backupMessage}</div>}
        <button type="button" className="auth-demo-pill" onClick={handleLegacyBackup}>
          Export old local data before signing in
        </button>

        <div className="auth-footer-note">
          <span>Authentication and shop access are managed securely by Supabase.</span>
        </div>
      </div>
    </div>
  );
}
