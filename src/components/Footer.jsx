import React, { useState, useEffect } from "react";
import { useApp } from "../context";
import { soundFX } from "../utils/audio";
import {
  formatEthiopianDate,
} from "../utils/ethiopianDate";

export default function Footer({
  config: propConfig,
}) {
  const context = useApp();
  const config = propConfig || context.config || {};
  const cloudStatus = context.cloudStatus;

  const [isMuted, setIsMuted] = useState(() => soundFX.isMuted());
  const [showDualDate, setShowDualDate] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    return soundFX.subscribe((muted) => setIsMuted(muted));
  }, []);

  // Live ticking clock (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    const next = soundFX.toggleMute();
    setIsMuted(next);
    if (!next) {
      soundFX.playPop();
    }
  };

  const scrollToTop = () => {
    soundFX.playPop();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isEthCal = config.calendarSystem !== "gregorian";
  const ethDateFull = formatEthiopianDate(currentTime, "full");
  const gregDateFormatted = currentTime.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // 12h clock
  const hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  const seconds = String(currentTime.getSeconds()).padStart(2, "0");
  const h12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  let periodAm = "ጥዋት";
  let greetingAm = "እንደምን አደሩ";
  if (hours >= 12 && hours < 17) {
    periodAm = "ከሰዓት";
    greetingAm = "እንደምን ዋሉ";
  } else if (hours >= 17 && hours < 23) {
    periodAm = "ማታ";
    greetingAm = "እንደምን አመሹ";
  } else if (hours >= 23 || hours < 6) {
    periodAm = "ሌሊት";
    greetingAm = "ሰላም ቆዩ";
  }

  const cashierName = config.ownerName || "Cashier";

  return (
    <footer className="no-print app-footer-v2">
      <div className="footer-inner-container">
        {/* 1. Operational Status Bar */}
        <div className="footer-operations-bar">
          <div className="footer-ops-left">
            {/* Store Status */}
            <span className="footer-op-pill pill-store-open">
              <span className="footer-pulse-dot dot-green"></span>
              <span>Open Store</span>
            </span>

            {/* Cloud Status */}
            <span
              className="footer-op-pill"
              style={
                cloudStatus === "connected"
                  ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }
                  : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
              }
            >
              <span
                className="footer-pulse-dot"
                style={{
                  backgroundColor: cloudStatus === "connected" ? "#3b82f6" : "#94a3b8",
                  boxShadow: cloudStatus === "connected" ? "0 0 6px #60a5fa" : "none",
                }}
              ></span>
              <span>{cloudStatus === "connected" ? "Supabase Cloud Synced" : "Local Offline"}</span>
            </span>

            {/* Cashier Greeting */}
            <div className="footer-cashier-chip">
              <span>{greetingAm},</span>
              <strong>{cashierName}</strong>
            </div>
          </div>

          <div className="footer-ops-right">
            {/* Live Clock */}
            <div className="footer-clock-pill" title="Local Time">
              <span className="footer-pulse-dot dot-teal"></span>
              <span className="clock-num-text">
                {String(h12).padStart(2, "0")}:{minutes}:{seconds}
              </span>
              <span className="clock-ampm-text">{ampm} • {periodAm}</span>
            </div>

            {/* Ethiopian Calendar */}
            <button
              type="button"
              className="footer-eth-date-btn"
              onClick={() => setShowDualDate(!showDualDate)}
              title="Click to toggle Gregorian equivalent date"
            >
              <span className="eth-date-title">{isEthCal ? ethDateFull : gregDateFormatted}</span>
              {showDualDate && isEthCal && (
                <span className="greg-date-hint">[{gregDateFormatted}]</span>
              )}
              <span className="eth-badge-flag">{isEthCal ? "ዓ.ም" : "G.C."}</span>
            </button>

            {/* Sound FX Toggle */}
            <button
              type="button"
              className={`footer-sound-btn ${isMuted ? "muted" : "active"}`}
              onClick={handleToggleSound}
              title={isMuted ? "Sound muted (click to unmute)" : "Sound active (click to mute)"}
            >
              <span>{isMuted ? "Sound: Off" : "Sound: On"}</span>
            </button>
          </div>
        </div>

        {/* 2. Sleek Minimalist Bottom Bar */}
        <div className="footer-bottom-row">
          <div className="footer-copy-text">
            <span>© 2017/2026</span>
            <strong>{config.shopName || "Sukie"}</strong>
            <span>• Liquid Soap Retail OS</span>
          </div>

          <div className="footer-tech-stack-row">
            <span>Addis Ababa, Ethiopia</span>
            <span>•</span>
            <button
              type="button"
              className="btn-back-to-top"
              onClick={scrollToTop}
              title="Scroll to top of page"
            >
              <span>Back to Top</span>
              <span>↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
