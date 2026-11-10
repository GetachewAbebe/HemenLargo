// Domain service for product tank inventory and valuations

export const calculateInventoryMetrics = (products = []) => {
  const totalLitersInStock = products.reduce((acc, p) => acc + (p.stockLiters || 0), 0);
  const totalStockCostValue = products.reduce((acc, p) => acc + ((p.stockLiters || 0) * (p.costPerLiter || 0)), 0);
  const totalPotentialRetail = products.reduce((acc, p) => acc + ((p.stockLiters || 0) * (p.pricePerLiter || 0)), 0);
  const lowStockCount = products.filter((p) => (p.stockLiters || 0) <= (p.minStockAlert || 40)).length;

  return {
    totalLitersInStock: Number(totalLitersInStock.toFixed(1)),
    totalStockCostValue: Number(totalStockCostValue.toFixed(2)),
    totalPotentialRetail: Number(totalPotentialRetail.toFixed(2)),
    lowStockCount,
  };
};

// Weighted-average cost: the liters already in the tank keep their old cost and the
// new batch adds its own, so profit on remaining stock stays accurate after a restock.
export const blendCostPerLiter = (currentStock, currentCost, addedLiters, batchCostPerLiter) => {
  const stock = Math.max(0, Number(currentStock) || 0);
  const added = Math.max(0, Number(addedLiters) || 0);
  const oldCost = Number(currentCost) || 0;
  if (batchCostPerLiter == null || !Number.isFinite(Number(batchCostPerLiter))) return oldCost;
  const newCost = Number(batchCostPerLiter);
  if (stock + added <= 0) return newCost;
  return Number(((stock * oldCost + added * newCost) / (stock + added)).toFixed(2));
};

export const restockProductStock = (products, productId, litersToAdd, batchCost) => {
  const liters = parseFloat(litersToAdd) || 0;
  const cost = batchCost === "" || batchCost == null ? null : parseFloat(batchCost);

  return products.map((p) => {
    if (p.id === productId) {
      return {
        ...p,
        stockLiters: Number(((p.stockLiters || 0) + liters).toFixed(2)),
        costPerLiter: blendCostPerLiter(p.stockLiters, p.costPerLiter, liters, Number.isFinite(cost) ? cost : null),
      };
    }
    return p;
  });
};
