import { describe, it, expect } from "vitest";
import {
  calculateCartTotals,
  deductStockForSale,
  restoreStockForVoidedSale,
} from "./saleService";

describe("Sale Service Domain Logic", () => {
  const sampleProducts = [
    {
      id: "prod-1",
      name: "ፈሳሽ ሳሙና (Largo)",
      pricePerLiter: 60,
      costPerLiter: 35,
      stockLiters: 100,
      soldLiters: 20,
    },
    {
      id: "prod-2",
      name: "በረኪና (Barikina)",
      pricePerLiter: 50,
      costPerLiter: 28,
      stockLiters: 80,
      soldLiters: 10,
    },
  ];

  it("calculates cart totals and profit accurately", () => {
    const cart = [
      { productId: "prod-1", liters: 5, totalPrice: 300, totalCost: 175 },
      { productId: "prod-2", liters: 2, totalPrice: 100, totalCost: 56 },
    ];

    const result = calculateCartTotals(cart, 10, false);
    expect(result.totalLiters).toBe(7);
    expect(result.grossSubtotal).toBe(400);
    expect(result.totalCost).toBe(231);
    expect(result.totalDiscount).toBe(10);
    expect(result.finalTotal).toBe(390);
    expect(result.estimatedProfit).toBe(159);
  });

  it("applies BYOC (Bring Your Own Container) flat discount", () => {
    const cart = [
      { productId: "prod-1", liters: 5, totalPrice: 300, totalCost: 175 },
    ];

    const result = calculateCartTotals(cart, 0, true, 5);
    expect(result.grossSubtotal).toBe(300);
    expect(result.byocDiscountVal).toBe(5);
    expect(result.totalDiscount).toBe(5);
    expect(result.finalTotal).toBe(295);
  });

  it("deducts stock and increments sold liters when sale completes", () => {
    const saleItems = [
      { productId: "prod-1", liters: 15 },
      { productId: "prod-2", liters: 5 },
    ];

    const updated = deductStockForSale(sampleProducts, saleItems);
    const prod1 = updated.find((p) => p.id === "prod-1");
    const prod2 = updated.find((p) => p.id === "prod-2");

    expect(prod1.stockLiters).toBe(85);
    expect(prod1.soldLiters).toBe(35);
    expect(prod2.stockLiters).toBe(75);
    expect(prod2.soldLiters).toBe(15);
  });

  it("restores stock and decrements sold liters when sale is voided", () => {
    const saleItemsToVoid = [
      { productId: "prod-1", liters: 10 },
    ];

    const restored = restoreStockForVoidedSale(sampleProducts, saleItemsToVoid);
    const prod1 = restored.find((p) => p.id === "prod-1");

    expect(prod1.stockLiters).toBe(110);
    expect(prod1.soldLiters).toBe(10);
  });
});
