// Formatting and date utilities for Sukie POS
import {
  formatEthiopianDate,
  formatEthiopianDateTime,
  formatEthiopianTime,
  getEthiopianDaysAhead,
  getEthiopianToday,
  isSameEthiopianDay,
  isSameEthiopianMonth,
  toEthiopianDate,
} from "../utils/ethiopianDate";

export const formatCurrency = (amount, currency = "ETB") => {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

// YYYY-MM-DD in the device's local time zone (Ethiopia is UTC+3, so
// toISOString() would report yesterday's date between midnight and 3 AM).
export const localDateKey = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getTodayDateStr = () => localDateKey();

export const getDateDaysAhead = (days = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateKey(d);
};

// Formats a date for display. Defaults to Ethiopian Calendar.
export const formatDisplayDate = (dateStr, style = "amharic", calendar = "ethiopian") => {
  if (!dateStr) return "";
  try {
    if (calendar === "gregorian") {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return formatEthiopianDate(dateStr, style);
  } catch {
    return dateStr;
  }
};

// Formats a date and time for display. Defaults to Ethiopian Calendar.
export const formatDisplayDateTime = (dateStr, style = "amharic", calendar = "ethiopian") => {
  if (!dateStr) return "";
  try {
    if (calendar === "gregorian") {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return formatEthiopianDateTime(dateStr, style);
  } catch {
    return dateStr;
  }
};

export {
  formatEthiopianDate,
  formatEthiopianDateTime,
  formatEthiopianTime,
  getEthiopianDaysAhead,
  getEthiopianToday,
  isSameEthiopianDay,
  isSameEthiopianMonth,
  toEthiopianDate,
};
