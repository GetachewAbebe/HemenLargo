// Formatting and date utilities

export const formatCurrency = (amount, currency = "ETB") => {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

export const getTodayDateStr = () => {
  return new Date().toISOString().split("T")[0];
};

export const getDateDaysAhead = (days = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};
