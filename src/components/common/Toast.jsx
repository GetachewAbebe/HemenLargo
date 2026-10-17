import React from "react";

export default function Toast({ toast }) {
  if (!toast) return null;

  const icon = toast.type === "info" ? "ℹ️" : toast.type === "warning" ? "⚠️" : "✨";

  return (
    <div className={`toast-notification animate-pop toast-${toast.type || "success"}`}>
      <span className="toast-icon">{icon}</span>
      <span className="toast-text">{toast.message}</span>
    </div>
  );
}
