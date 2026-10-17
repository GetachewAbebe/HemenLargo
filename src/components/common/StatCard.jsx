import React from "react";

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = "teal",
  highlight, // 'green' | 'red' | 'amber' etc.
  className = "",
  onClick,
}) {
  const highlightClass = highlight ? `card-highlight-${highlight}` : "";

  return (
    <div
      className={`metric-card ${highlightClass} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && <Icon size={18} className={`text-${iconColor}`} />}
      </div>
      <span className="metric-value">{value}</span>
      {subtext && <span className="metric-sub">{subtext}</span>}
    </div>
  );
}
