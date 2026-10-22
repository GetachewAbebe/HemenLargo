// Domain service for sales, inventory deductions, and credit conversions

export const deductStockForSale = (products, saleItems) => {
  return products.map((prod) => {
    const soldItem = saleItems.find((item) => item.productId === prod.id);
    if (soldItem) {
      const newStock = Math.max(0, prod.stockLiters - soldItem.liters);
      const newSold = (prod.soldLiters || 0) + soldItem.liters;
      return {
        ...prod,
        stockLiters: Number(newStock.toFixed(2)),
        soldLiters: Number(newSold.toFixed(2)),
      };
    }
    return prod;
  });
};

export const restoreStockForVoidedSale = (products, saleItems) => {
  return products.map((prod) => {
    const soldItem = saleItems?.find((item) => item.productId === prod.id);
    if (soldItem) {
      const restoredStock = Number((prod.stockLiters + (soldItem.liters || 0)).toFixed(2));
      const restoredSold = Number(Math.max(0, (prod.soldLiters || 0) - (soldItem.liters || 0)).toFixed(2));
      return {
        ...prod,
        stockLiters: restoredStock,
        soldLiters: restoredSold,
      };
    }
    return prod;
  });
};

export const calculateCartTotals = (cart = [], discountAmount = 0, byocDiscountActive = false, byocFlatDiscount = 5) => {
  const totalLiters = cart.reduce((acc, item) => acc + (Number(item.liters) || 0), 0);
  const grossSubtotal = cart.reduce((acc, item) => acc + (Number(item.totalPrice ?? item.total) || 0), 0);
  const totalCost = cart.reduce((acc, item) => acc + (Number(item.totalCost) || 0), 0);
  const byocDiscountVal = byocDiscountActive ? byocFlatDiscount : 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const totalDiscount = byocDiscountVal + numDiscount;
  const finalTotal = Math.max(0, grossSubtotal - totalDiscount);
  const estimatedProfit = Math.max(0, finalTotal - totalCost);

  return {
    totalLiters: Number(totalLiters.toFixed(2)),
    grossSubtotal: Number(grossSubtotal.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    byocDiscountVal: Number(byocDiscountVal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    finalTotal: Number(finalTotal.toFixed(2)),
    estimatedProfit: Number(estimatedProfit.toFixed(2)),
  };
};

export const applyDebtRepayment = (debt, paymentAmount, paymentMethod = "Cash", note = "") => {
  const amount = Math.max(0, parseFloat(paymentAmount) || 0);
  const newPaid = Number(((debt.paidAmount || 0) + amount).toFixed(2));
  const newRemaining = Math.max(0, Number((debt.totalAmount - newPaid).toFixed(2)));
  const newStatus = newRemaining <= 0 ? "Settled" : "Partially Paid";
  const newPayment = {
    id: `pay-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    amount,
    paymentMethod,
    note,
  };

  return {
    ...debt,
    paidAmount: newPaid,
    remainingBalance: newRemaining,
    status: newStatus,
    payments: [newPayment, ...(debt.payments || [])],
  };
};
