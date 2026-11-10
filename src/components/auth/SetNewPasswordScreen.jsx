import React, { useState } from "react";
import { completePasswordReset } from "../../services/authService";

// Shown after the user opens a password-reset email link.
export default function SetNewPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMessage("The two passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await completePasswordReset(password);
      onDone?.();
    } catch (error) {
      setErrorMessage(error.message || "Could not update the password. Request a new reset link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card-container animate-fade">
        <div className="auth-brand-block">
          <h1 className="auth-brand-title">Set a New Password</h1>
          <p className="auth-brand-subtitle">አዲስ የይለፍ ቃል ያስገቡ</p>
        </div>

        {errorMessage && (
          <div className="auth-alert-box alert-error animate-fade" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="new-password">New password</label>
            <div className="auth-input-wrapper">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                className="auth-text-input"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
          </div>
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              className="auth-text-input"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            <span>{isSubmitting ? "Saving..." : "Save Password & Continue"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
