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

export const restockProductStock = (products, productId, litersToAdd, batchCost) => {
  const liters = parseFloat(litersToAdd) || 0;
  const cost = batchCost ? parseFloat(batchCost) : null;

  return products.map((p) => {
    if (p.id === productId) {
      return {
        ...p,
        stockLiters: Number(((p.stockLiters || 0) + liters).toFixed(2)),
        costPerLiter: cost !== null ? cost : p.costPerLiter,
      };
    }
    return p;
  });
};
