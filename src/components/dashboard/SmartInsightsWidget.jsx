import React, { useMemo } from "react";
import { Sparkles, Award, Smartphone, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";

export default function SmartInsightsWidget({
  products = [],
  sales = [],
  currency = "ETB",
  periodRevenue = 0,
  dailyTarget = 5000,
}) {
  const insights = useMemo(() => {
    const list = [];

    // 1. Top Selling Product
    const productSales = {};
    sales.forEach((s) => {
      s.items?.forEach((i) => {
        productSales[i.name] = (productSales[i.name] || 0) + (i.liters || 0);
      });
    });

    const entries = Object.entries(productSales).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0 && entries[0][1] > 0) {
      const topName = entries[0][0];
      const topLiters = entries[0][1];
      const totalLiters = entries.reduce((acc, e) => acc + e[1], 0);
      const pct = totalLiters > 0 ? Math.round((topLiters / totalLiters) * 100) : 0;

      list.push({
        id: "top-product",
        type: "success",
        icon: Award,
        iconColor: "#059669",
        bgClass: "insight-green",
        title: "Top Performer (ዋነኛ ምርት)",
        description: `"${topName}" is driving ${pct}% of your total volume (${topLiters.toFixed(1)}L sold).`,
      });
    }

    // 2. Digital Payment Preference
    const telebirrTotal = sales
      .filter((s) => s.paymentMethod === "Telebirr")
      .reduce((acc, s) => acc + (s.total || 0), 0);
    const cashTotal = sales
      .filter((s) => s.paymentMethod === "Cash")
      .reduce((acc, s) => acc + (s.total || 0), 0);
    const totalRev = sales.reduce((acc, s) => acc + (s.total || 0), 0);

    if (totalRev > 0) {
      const telebirrPct = Math.round((telebirrTotal / totalRev) * 100);
      if (telebirrPct >= 40) {
        list.push({
          id: "telebirr-share",
          type: "info",
          icon: Smartphone,
          iconColor: "#0284c7",
          bgClass: "insight-blue",
          title: "High Digital Adoption (ቴሌብር ክፍያ)",
          description: `${telebirrPct}% of sales paid via Telebirr (${telebirrTotal.toLocaleString()} ${currency}). Cash handling is reduced!`,
        });
      } else {
        list.push({
          id: "cash-preference",
          type: "info",
          icon: Smartphone,
          iconColor: "#059669",
          bgClass: "insight-green",
          title: "Cash Liquidity (የጥሬ ገንዘብ ፍሰት)",
          description: `Cash register holds ${cashTotal.toLocaleString()} ${currency} (${Math.round((cashTotal / totalRev) * 100)}% of transactions).`,
        });
      }
    }

    // 3. Tank Stock Alert
    const lowStockProduct = products.find(
      (p) => p.stockLiters <= (p.minStockAlert || 40)
    );
    if (lowStockProduct) {
      list.push({
        id: "stock-alert",
        type: "warning",
        icon: AlertTriangle,
        iconColor: "#d97706",
        bgClass: "insight-amber",
        title: "Tank Refill Needed (ታንከር ይሙላ)",
        description: `"${lowStockProduct.name}" is low at ${lowStockProduct.stockLiters.toFixed(1)}L. Consider preparing a new batch.`,
      });
    } else {
      list.push({
        id: "stock-healthy",
        type: "success",
        icon: CheckCircle2,
        iconColor: "#059669",
        bgClass: "insight-teal",
        title: "All Reservoirs Healthy (ታንከሮች ሙሉ ናቸው)",
        description: `All soap tanks are well-supplied above safety thresholds. Ready for peak hours!`,
      });
    }

    // 4. Sales Target Velocity
    const targetPct = Math.min(100, Math.round((periodRevenue / dailyTarget) * 100));
    if (targetPct >= 100) {
      list.push({
        id: "target-achieved",
        type: "celebrate",
        icon: TrendingUp,
        iconColor: "#7c3aed",
        bgClass: "insight-purple",
        title: "Target Smashed! (ግብ ተሳክቷል)",
        description: `Congratulations! You reached ${periodRevenue.toLocaleString()} ${currency} (${targetPct}% of goal).`,
      });
    } else {
      const remaining = Math.max(0, dailyTarget - periodRevenue);
      list.push({
        id: "target-pace",
        type: "progress",
        icon: TrendingUp,
        iconColor: "#0d9488",
        bgClass: "insight-teal",
        title: "Goal Progress (የቀን ግብ)",
        description: `${targetPct}% of daily ${dailyTarget.toLocaleString()} ${currency} reached. ${remaining.toLocaleString()} ${currency} to go!`,
      });
    }

    return list;
  }, [products, sales, currency, periodRevenue, dailyTarget]);

  return (
    <div className="dashboard-widget-card smart-insights-widget animate-fade">
      <div className="widget-header-row">
        <div className="widget-title-wrap">
          <div className="widget-icon-avatar bg-cyan-subtle">
            <Sparkles size={18} className="text-cyan" />
          </div>
          <div>
            <h4 className="widget-main-title">Shop Intelligence & Live Insights (የሱቅ ግንዛቤ)</h4>
            <span className="widget-sub-title">Automated sales velocity & operational highlights</span>
          </div>
        </div>

        <span className="live-ai-badge">
          <span className="beacon-dot"></span>
          <span>Live Pulse</span>
        </span>
      </div>

      <div className="smart-insights-grid">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className={`smart-insight-card ${item.bgClass}`}>
              <div className="insight-card-header">
                <div
                  className="insight-icon-bubble"
                  style={{ color: item.iconColor }}
                >
                  <Icon size={16} />
                </div>
                <strong className="insight-card-title">{item.title}</strong>
              </div>
              <p className="insight-card-desc">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
