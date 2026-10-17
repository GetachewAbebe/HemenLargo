// Domain service for customer debts (ዕዳ) and repayments

export const applyDebtPayment = (debts, { debtId, amount, method, note }) => {
  return debts.map((d) => {
    if (d.id === debtId) {
      const numAmount = parseFloat(amount) || 0;
      const newPaid = Number(((d.paidAmount || 0) + numAmount).toFixed(2));
      const newBalance = Math.max(0, Number((d.totalAmount - newPaid).toFixed(2)));
      const newStatus = newBalance <= 0 ? "Paid" : "Partially Paid";
      const paymentAudit = note
        ? `${d.notes || ""} [Repaid ${numAmount} via ${method}: ${note}]`
        : `${d.notes || ""} [Repaid ${numAmount} via ${method}]`;

      return {
        ...d,
        paidAmount: newPaid,
        remainingBalance: newBalance,
        status: newStatus,
        notes: paymentAudit.trim(),
      };
    }
    return d;
  });
};

export const createManualDebt = ({ customerName, customerPhone, totalAmount, dueDate, notes }) => {
  const amount = parseFloat(totalAmount) || 0;
  return {
    id: `debt-${Date.now().toString().slice(-6)}`,
    customerName: customerName.trim(),
    customerPhone: customerPhone?.trim() || "N/A",
    saleId: `MANUAL-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString(),
    totalAmount: amount,
    paidAmount: 0,
    remainingBalance: amount,
    dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    status: "Unpaid",
    notes: notes?.trim() || "Manual credit record entry.",
  };
};

export const calculateDebtMetrics = (debts, todayStr = new Date().toISOString().split("T")[0]) => {
  const activeDebts = debts.filter((d) => d.status !== "Paid");
  const totalOutstanding = activeDebts.reduce((acc, d) => acc + (d.remainingBalance || 0), 0);
  const totalCollected = debts.reduce((acc, d) => acc + (d.paidAmount || 0), 0);
  const overdueCount = activeDebts.filter((d) => d.dueDate && d.dueDate < todayStr).length;

  return {
    activeDebts,
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    totalCollected: Number(totalCollected.toFixed(2)),
    overdueCount,
    activeDebtCount: activeDebts.length,
  };
};
