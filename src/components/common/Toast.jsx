import React from "react";

export default function Toast({ toast }) {
  if (!toast) return null;

  const tag = toast.type === "info" ? "Info" : toast.type === "warning" ? "Alert" : "Success";

  return (
    <div className={`toast-notification animate-pop toast-${toast.type || "success"}`}>
      <span className="toast-tag">[{tag}]</span>
      <span className="toast-text">{toast.message}</span>
    </div>
  );
}
