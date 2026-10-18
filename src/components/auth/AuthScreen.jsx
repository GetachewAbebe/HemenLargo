import React, { useState } from "react";
import {
  Lock,
  User,
  Store,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { soundFX } from "../../utils/audio";
import { loginUser, registerUser } from "../../services/authService";

export default function AuthScreen({ onAuthSuccess, initialShopName = "Sukie Liquid Soap" }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Login Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState("getachew");
  const [loginPin, setLoginPin] = useState("1234");

  // Registration Form Fields
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regShopName, setRegShopName] = useState(initialShopName);
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState("");

  const handleTabSwitch = (newMode) => {
    soundFX.playPop();
    setErrorMessage("");
    setSuccessMessage("");
    setMode(newMode);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const res = loginUser(loginIdentifier, loginPin);
    if (!res.success) {
      soundFX.playWarning();
      setErrorMessage(res.error);
      return;
    }

    soundFX.playCheckoutChime();
    setSuccessMessage(`እንኳን ደህና መጡ፣ ${res.user.fullName}!`);
    setTimeout(() => {
      onAuthSuccess(res.user);
    }, 600);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const res = registerUser({
      fullName: regFullName,
      username: regUsername,
      shopName: regShopName,
      phone: regPhone,
      role: "Owner",
      pin: regPin,
    });

    if (!res.success) {
      soundFX.playWarning();
      setErrorMessage(res.error);
      return;
    }

    soundFX.playSuccess();
    setSuccessMessage(`ምዝገባው ተሳክቷል! እንኳን ደህና መጡ፣ ${res.user.fullName}!`);
    setTimeout(() => {
      onAuthSuccess(res.user);
    }, 700);
  };

  const handleQuickDemoFill = () => {
    soundFX.playPop();
    setLoginIdentifier("getachew");
    setLoginPin("1234");
    setErrorMessage("");
  };

  return (
    <div className="auth-viewport-wrapper">
      {/* Background Liquid Soap Ambient Glows */}
      <div className="auth-ambient-glow glow-teal"></div>
      <div className="auth-ambient-glow glow-blue"></div>

      <div className="auth-card-container animate-fade">
        {/* Brand Header */}
        <div className="auth-brand-block">
          <div className="auth-icon-avatar">
            <span className="bubble-anim">🧴</span>
          </div>
          <h1 className="auth-brand-title">Sukie Liquid Soap</h1>
          <p className="auth-brand-subtitle">
            Hemen Soap Operations & Counter POS System • የፈሳሽ ሳሙና መሸጫና መቆጣጠሪያ
          </p>
        </div>

        {/* Auth Mode Segmented Switcher */}
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

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="auth-alert-box alert-error animate-fade">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="auth-alert-box alert-success animate-fade">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="auth-form-body animate-fade">
            <div className="auth-field-group">
              <label className="auth-field-label">Username or Phone (የመግቢያ ስም / ስልክ)</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-text-input"
                  placeholder="e.g. getachew or 0911000000"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label">Security PIN or Password (ሚስጥር ቁጥር)</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-text-input"
                  placeholder="Enter 4-digit PIN"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-btn-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide PIN" : "Show PIN"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              <span>Access POS Counter</span>
              <ArrowRight size={17} />
            </button>

            {/* Quick Demo Cashier Switcher */}
            <div className="auth-demo-badge-wrap">
              <button
                type="button"
                className="auth-demo-pill"
                onClick={handleQuickDemoFill}
                title="Fill demo credentials"
              >
                <Sparkles size={13} className="text-teal" />
                <span>One-Click Demo Cashier: <strong>Getachew</strong> (PIN: 1234)</span>
              </button>
            </div>
          </form>
        )}

        {/* Register Account Form */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="auth-form-body animate-fade">
            <div className="auth-field-row">
              <div className="auth-field-group">
                <label className="auth-field-label">Full Name (ሙሉ ስም)</label>
                <div className="auth-input-wrapper">
                  <User size={15} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-text-input"
                    placeholder="e.g. Getachew Abebe"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Username (የመግቢያ ስም)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-prefix">@</span>
                  <input
                    type="text"
                    className="auth-text-input prefix-padding"
                    placeholder="e.g. getachew"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label">Shop / Store Name (የሱቁ ስም)</label>
              <div className="auth-input-wrapper">
                <Store size={15} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-text-input"
                  placeholder="e.g. Hemen Liquid Soap"
                  value={regShopName}
                  onChange={(e) => setRegShopName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field-row">
              <div className="auth-field-group">
                <label className="auth-field-label">Phone Number (ስልክ ቁጥር)</label>
                <div className="auth-input-wrapper">
                  <Phone size={15} className="auth-input-icon" />
                  <input
                    type="tel"
                    className="auth-text-input"
                    placeholder="0911223344"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Create Security PIN (4-Digit PIN)</label>
                <div className="auth-input-wrapper">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-text-input"
                    placeholder="Enter 4-digit PIN (e.g. 2026)"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    required
                    minLength={4}
                    maxLength={12}
                  />
                  <button
                    type="button"
                    className="auth-btn-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide PIN" : "Show PIN"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              <ShieldCheck size={18} />
              <span>Register & Launch Store POS</span>
            </button>
          </form>
        )}

        {/* Footer Info */}
        <div className="auth-footer-note">
          <span>Protected by Sukie Local Encryption • Addis Ababa, Ethiopia</span>
        </div>
      </div>
    </div>
  );
}
