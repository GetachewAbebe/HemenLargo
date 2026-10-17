import React from "react";
import { Droplets, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
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
        value={`${totalLitersInStock.toFixed(1)} L`}
        subtext="Across all bulk storage containers"
        icon={Droplets}
        iconColor="teal"
      />
      <StatCard
        title="Total Batch Cost (Capital)"
        value={`${totalStockCostValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
        subtext="Raw materials & chemical investment"
        icon={DollarSign}
        iconColor="amber"
      />
      <StatCard
        title="Potential Retail Value"
        value={`${totalPotentialRetail.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
        subtext="Gross retail revenue if sold out"
        icon={TrendingUp}
        iconColor="emerald"
        highlight="green"
      />
      <StatCard
        title="Tanks Needing Refill"
        value={lowStockCount}
        subtext={lowStockCount > 0 ? "Under safe alert reserve levels" : "All tanks sufficiently supplied"}
        icon={AlertTriangle}
        iconColor={lowStockCount > 0 ? "rose" : "slate"}
        highlight={lowStockCount > 0 ? "red" : undefined}
      />
    </div>
  );
}
