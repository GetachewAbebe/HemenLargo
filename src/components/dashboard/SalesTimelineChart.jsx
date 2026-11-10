import React, { useState, useMemo } from "react";
import { formatEthiopianDate } from "../../utils/ethiopianDate";
import { localDateKey } from "../../services/formatters";
import { useNow } from "../../hooks/useNow";

export default function SalesTimelineChart({
  sales = [],
  currency = "ETB",
  period = "today", // 'today' | 'yesterday' | 'week' | 'month' | 'all'
}) {
  const [hoveredBucket, setHoveredBucket] = useState(null);
  const referenceNow = useNow();

  // Group sales into time buckets depending on the selected period
  const chartData = useMemo(() => {
    if (period === "today" || period === "yesterday") {
      // 6 time buckets across 24h:
      // Early (06:00-09:00), Morning (09:00-12:00), Noon (12:00-15:00), Afternoon (15:00-18:00), Evening (18:00-21:00), Night (21:00-06:00)
      const buckets = [
        { id: "b1", label: "06:00-09:00", nameAm: "ጥዋት 12 - 3", startH: 6, endH: 9, total: 0, liters: 0, count: 0 },
        { id: "b2", label: "09:00-12:00", nameAm: "ረፋድ 3 - 6", startH: 9, endH: 12, total: 0, liters: 0, count: 0 },
        { id: "b3", label: "12:00-15:00", nameAm: "ቀትር 6 - 9", startH: 12, endH: 15, total: 0, liters: 0, count: 0 },
        { id: "b4", label: "15:00-18:00", nameAm: "ከሰዓት 9 - 12", startH: 15, endH: 18, total: 0, liters: 0, count: 0 },
        { id: "b5", label: "18:00-21:00", nameAm: "ምሽት 12 - 3", startH: 18, endH: 21, total: 0, liters: 0, count: 0 },
        { id: "b6", label: "21:00-06:00", nameAm: "ሌሊት 3 - 12", startH: 21, endH: 6, total: 0, liters: 0, count: 0 },
      ];

      sales.forEach((s) => {
        const d = new Date(s.date);
        const h = d.getHours();
        const saleLiters = s.items?.reduce((acc, i) => acc + (i.liters || 0), 0) || 0;
        const total = s.total || 0;

        let matched = false;
        for (let i = 0; i < 5; i++) {
          if (h >= buckets[i].startH && h < buckets[i].endH) {
            buckets[i].total += total;
            buckets[i].liters += saleLiters;
            buckets[i].count += 1;
            matched = true;
            break;
          }
        }
        if (!matched) {
          buckets[5].total += total;
          buckets[5].liters += saleLiters;
          buckets[5].count += 1;
        }
      });

      return buckets;
    } else {
      // Group by last 7 days or days with sales
      const dayMap = new Map();
      const nowTime = referenceNow.getTime();

      // Create last 7 days entries
      for (let i = 6; i >= 0; i--) {
        const d = new Date(nowTime - i * 24 * 60 * 60 * 1000);
        const key = localDateKey(d);
        const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        const ethDate = formatEthiopianDate(d, "short");
        dayMap.set(key, {
          id: key,
          label: `${dayLabel}`,
          nameAm: ethDate,
          total: 0,
          liters: 0,
          count: 0,
        });
      }

      sales.forEach((s) => {
        const key = localDateKey(s.date);
        const saleLiters = s.items?.reduce((acc, i) => acc + (i.liters || 0), 0) || 0;
        const total = s.total || 0;

        if (dayMap.has(key)) {
          const entry = dayMap.get(key);
          entry.total += total;
          entry.liters += saleLiters;
          entry.count += 1;
        } else if (period === "all" || period === "month") {
          // If in month or all, also accumulate
          const d = new Date(s.date);
          const ethDate = formatEthiopianDate(d, "short");
          dayMap.set(key, {
            id: key,
            label: key.slice(5),
            nameAm: ethDate,
            total,
            liters: saleLiters,
            count: 1,
          });
        }
      });

      return Array.from(dayMap.values()).slice(-7);
    }
  }, [sales, period, referenceNow]);

  const maxTotal = useMemo(() => {
    const m = Math.max(...chartData.map((b) => b.total), 1);
    return m > 0 ? m : 100;
  }, [chartData]);

  // Find peak bucket
  const peakBucket = useMemo(() => {
    let peak = null;
    chartData.forEach((b) => {
      if (!peak || b.total > peak.total) {
        if (b.total > 0) peak = b;
      }
    });
    return peak;
  }, [chartData]);

  const totalPeriodRevenue = useMemo(() => {
    return chartData.reduce((acc, b) => acc + b.total, 0);
  }, [chartData]);

  const totalPeriodOrders = useMemo(() => {
    return chartData.reduce((acc, b) => acc + b.count, 0);
  }, [chartData]);

  return (
    <div className="dashboard-chart-card animate-fade">
      {/* Chart Top Header */}
      <div className="chart-header-row">
        <div className="chart-title-wrap">
          <div>
            <h3 className="chart-main-title">Sales Flow & Activity Timeline (የሽያጭ ፍሰት)</h3>
            <span className="chart-subtitle">
              {period === "today"
                ? "Hourly counter velocity across Ethiopian daylight shifts"
                : "Daily sales & customer traffic trends"}
            </span>
          </div>
        </div>

        <div className="chart-meta-tags">
          {peakBucket && (
            <span className="peak-badge animate-pop">
              <span>Peak:</span>
              <strong>
                {peakBucket.nameAm || peakBucket.label} ({peakBucket.total.toLocaleString()} {currency})
              </strong>
            </span>
          )}
          <span className="total-orders-pill">
            {totalPeriodOrders} {totalPeriodOrders === 1 ? "Sale" : "Sales"} • {totalPeriodRevenue.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      {/* Bar Chart Visualization (Pure CSS/SVG Responsive Grid) */}
      <div className="chart-bars-viewport">
        {chartData.map((b) => {
          const heightPercent = maxTotal > 0 ? Math.round((b.total / maxTotal) * 100) : 0;
          const isPeak = peakBucket && peakBucket.id === b.id && b.total > 0;
          const isHovered = hoveredBucket?.id === b.id;

          return (
            <div
              key={b.id}
              className={`chart-bar-col ${isPeak ? "is-peak" : ""} ${isHovered ? "is-hovered" : ""}`}
              onMouseEnter={() => setHoveredBucket(b)}
              onMouseLeave={() => setHoveredBucket(null)}
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div className="chart-bar-tooltip animate-pop">
                  <strong className="tooltip-title">{b.nameAm || b.label}</strong>
                  <div className="tooltip-stat">
                    <span>Revenue:</span>
                    <strong>{b.total.toLocaleString()} {currency}</strong>
                  </div>
                  <div className="tooltip-stat">
                    <span>Volume:</span>
                    <strong>{b.liters.toFixed(1)} Liters</strong>
                  </div>
                  <div className="tooltip-stat">
                    <span>Orders:</span>
                    <strong>{b.count}</strong>
                  </div>
                </div>
              )}

              {/* Bar Value on Top if has sales */}
              <div className="bar-top-value">
                {b.total > 0 ? `${Math.round(b.total)}` : ""}
              </div>

              {/* Track and Animated Fill Bar */}
              <div className="chart-bar-track">
                <div
                  className="chart-bar-fill"
                  style={{
                    height: `${Math.max(6, heightPercent)}%`,
                    opacity: b.total > 0 ? 1 : 0.25,
                  }}
                >
                  <div className="bar-shine"></div>
                </div>
              </div>

              {/* Labels below */}
              <div className="chart-bar-labels">
                <span className="bar-label-primary">{b.nameAm || b.label}</span>
                <span className="bar-label-sub">{b.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
