import React from "react";
import StatCard from "../common/StatCard";

export default function InventoryStats({
  totalLitersInStock,
  totalStockCostValue,
  totalPotentialRetail,
  lowStockCount,
  currency = "ETB",
}) {
  return (
    <div className="metrics-grid">
      <StatCard
        title="Total Liquid Soap In Tanks"
        value={`${(Number(totalLitersInStock) || 0).toFixed(1)} L`}
        subtext="Across all bulk storage containers"
      />
      <StatCard
        title="Total Batch Cost (Capital)"
        value={`${(Number(totalStockCostValue) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
        subtext="Raw materials & chemical investment"
      />
      <StatCard
        title="Potential Retail Value"
        value={`${(Number(totalPotentialRetail) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
        subtext="Gross retail revenue if sold out"
        highlight="green"
      />
      <StatCard
        title="Tanks Needing Refill"
        value={lowStockCount}
        subtext={lowStockCount > 0 ? "Under safe alert reserve levels" : "All tanks sufficiently supplied"}
        highlight={lowStockCount > 0 ? "red" : undefined}
      />
    </div>
  );
}
