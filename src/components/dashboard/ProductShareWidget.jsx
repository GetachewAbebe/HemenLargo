import React, { useMemo } from "react";
import { Package, Droplets, Zap } from "lucide-react";
import { soundFX } from "../../utils/audio";

export default function ProductShareWidget({
  products = [],
  sales = [],
  currency = "ETB",
  onQuickDispense,
}) {
  // Aggregate sales by product
  const productMetrics = useMemo(() => {
    const map = new Map();

    products.forEach((p) => {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        localName: p.localName || "",
        color: p.color || "#0d9488",
        emoji: p.iconEmoji || "🧴",
        pricePerLiter: p.pricePerLiter,
        stockLiters: p.stockLiters,
        minStockAlert: p.minStockAlert || 40,
        litersSold: 0,
        revenue: 0,
        ordersCount: 0,
      });
    });

    sales.forEach((s) => {
      s.items?.forEach((item) => {
        const pId = item.productId || (products.find((p) => p.name === item.name)?.id);
        if (pId && map.has(pId)) {
          const entry = map.get(pId);
          entry.litersSold += item.liters || 0;
          entry.revenue += item.totalPrice || 0;
          entry.ordersCount += 1;
        }
      });
    });

    return Array.from(map.values());
  }, [products, sales]);

  const totalPeriodLiters = useMemo(() => {
    return productMetrics.reduce((acc, p) => acc + p.litersSold, 0);
  }, [productMetrics]);

  return (
    <div className="dashboard-widget-card product-share-widget animate-fade">
      {/* Header */}
      <div className="widget-header-row">
        <div className="widget-title-wrap">
          <div className="widget-icon-avatar bg-emerald-subtle">
            <Package size={18} className="text-teal" />
          </div>
          <div>
            <h4 className="widget-main-title">Product Mix & Tank Distribution (የምርቶች ድርሻ)</h4>
            <span className="widget-sub-title">Liters sold & revenue earned by soap formula</span>
          </div>
        </div>

        <span className="period-liters-badge">
          <Droplets size={13} />
          <span>{totalPeriodLiters.toFixed(1)} L Total Sold</span>
        </span>
      </div>

      {/* Product List */}
      <div className="product-share-list">
        {productMetrics.map((p) => {
          const sharePercent = totalPeriodLiters > 0 ? Math.round((p.litersSold / totalPeriodLiters) * 100) : 0;
          const isLowStock = p.stockLiters <= p.minStockAlert;
          const tankPercent = Math.min(100, Math.round((p.stockLiters / 400) * 100));

          return (
            <div key={p.id} className="product-share-row">
              <div className="prod-share-top-line">
                <div className="prod-identity-info">
                  <span className="prod-emoji-icon">{p.emoji}</span>
                  <div>
                    <strong className="prod-title-text">{p.name}</strong>
                    <span className="prod-subtitle-text">{p.localName}</span>
                  </div>
                </div>

                <div className="prod-stat-numbers">
                  <div className="prod-metric-col">
                    <span className="metric-header-tiny">Volume Sold</span>
                    <strong className="metric-val-bold text-teal">{p.litersSold.toFixed(1)} L</strong>
                  </div>
                  <div className="prod-metric-col">
                    <span className="metric-header-tiny">Revenue</span>
                    <strong className="metric-val-bold">{p.revenue.toLocaleString()} {currency}</strong>
                  </div>

                  {onQuickDispense && (
                    <button
                      type="button"
                      className="btn-quick-sell-pill"
                      onClick={() => {
                        soundFX.playPop();
                        onQuickDispense(p.id);
                      }}
                      title={`Quick sell ${p.name}`}
                    >
                      <Zap size={13} />
                      <span>Sell</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Distribution Bar */}
              <div className="prod-share-bar-wrap">
                <div className="prod-share-bar-track">
                  <div
                    className="prod-share-bar-fill"
                    style={{
                      width: `${Math.max(4, sharePercent)}%`,
                      backgroundColor: p.color,
                    }}
                  ></div>
                </div>
                <div className="prod-share-hints">
                  <span className="hint-share">{sharePercent}% of total volume</span>
                  <span className={`hint-tank ${isLowStock ? "tank-warning" : "tank-ok"}`}>
                    Tank Stock: <strong>{p.stockLiters.toFixed(1)}L</strong> ({tankPercent}% full)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

