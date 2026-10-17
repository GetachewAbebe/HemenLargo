import React from "react";
import { DollarSign, CheckCircle, Users, AlertCircle } from "lucide-react";
import StatCard from "../common/StatCard";

export default function DebtStats({
  totalOutstanding,
  totalCollected,
  activeDebtCount,
  overdueCount,
  currency = "ETB",
}) {
  return (
    <div className="metrics-grid">
      <StatCard
        title="Total Outstanding Debts (ዕዳ)"
        value={`${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
        subtext={`Across ${activeDebtCount} active customers`}
        icon={DollarSign}
        iconColor="rose"
        highlight={totalOutstanding > 0 ? "red" : undefined}
      />
      <StatCard
        title="Total Recovered / Repaid"
        value={`${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`}
        subtext="Payments collected back from credit"
        icon={CheckCircle}
        iconColor="emerald"
        highlight="green"
      />
      <StatCard
        title="Active Customers with Debt"
        value={`${activeDebtCount} Customers`}
        subtext="Regular clients & bulk buyers"
        icon={Users}
        iconColor="purple"
      />
      <StatCard
        title="Overdue Repayments"
        value={`${overdueCount} Overdue`}
        subtext={overdueCount > 0 ? "Past promised repayment date" : "All customer debts on schedule"}
        icon={AlertCircle}
        iconColor={overdueCount > 0 ? "rose" : "emerald"}
        highlight={overdueCount > 0 ? "red" : undefined}
      />
    </div>
  );
}
