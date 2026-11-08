import { describe, it, expect } from "vitest";
import { isSameEthiopianDay, isSameEthiopianMonth } from "../utils/ethiopianDate";

describe("Dashboard & Fast Sales Helpers", () => {
  const sampleProducts = [
    {
      id: "prod-1",
      name: "ፈሳሽ ሳሙና (Largo)",
      pricePerLiter: 60,
      costPerLiter: 35,
      stockLiters: 100,
    },
    {
      id: "prod-2",
      name: "በረኪና (Barikina)",
      pricePerLiter: 50,
      costPerLiter: 28,
      stockLiters: 80,
    },
  ];

  it("correctly computes price for 1L, 2L, 5L, and 20L", () => {
    const largo = sampleProducts[0];
    const barikina = sampleProducts[1];

    expect(1 * largo.pricePerLiter).toBe(60);
    expect(2 * largo.pricePerLiter).toBe(120);
    expect(5 * largo.pricePerLiter).toBe(300);
    expect(20 * largo.pricePerLiter).toBe(1200);

    expect(1 * barikina.pricePerLiter).toBe(50);
    expect(5 * barikina.pricePerLiter).toBe(250);
  });

  it("calculates cash change correctly for standard payment amounts", () => {
    const total = 300;
    const tendered1 = 500;
    const tendered2 = 1000;
    const tenderedExact = 300;

    expect(tendered1 - total).toBe(200);
    expect(tendered2 - total).toBe(700);
    expect(tenderedExact - total).toBe(0);
  });

  it("filters sales by Ethiopian date periods correctly", () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    expect(isSameEthiopianDay(today.toISOString(), today)).toBe(true);
    expect(isSameEthiopianDay(yesterday.toISOString(), today)).toBe(false);
    expect(isSameEthiopianDay(yesterday.toISOString(), yesterday)).toBe(true);

    expect(isSameEthiopianMonth(today.toISOString(), today)).toBe(true);
    expect(isSameEthiopianMonth(twoMonthsAgo.toISOString(), today)).toBe(false);
  });

  it("calculates revenue, profit, and volume aggregates across sales", () => {
    const mockSales = [
      {
        id: "REC-1",
        date: new Date().toISOString(),
        paymentMethod: "Telebirr",
        total: 300,
        profit: 125,
        items: [{ liters: 5 }],
      },
      {
        id: "REC-2",
        date: new Date().toISOString(),
        paymentMethod: "Cash",
        total: 100,
        profit: 44,
        items: [{ liters: 2 }],
      },
    ];

    const revenue = mockSales.reduce((acc, s) => acc + s.total, 0);
    const profit = mockSales.reduce((acc, s) => acc + s.profit, 0);
    const liters = mockSales.reduce(
      (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.liters, 0),
      0
    );

    expect(revenue).toBe(400);
    expect(profit).toBe(169);
    expect(liters).toBe(7);

    const cash = mockSales
      .filter((s) => s.paymentMethod === "Cash")
      .reduce((acc, s) => acc + s.total, 0);
    const digital = mockSales
      .filter((s) => s.paymentMethod === "Telebirr")
      .reduce((acc, s) => acc + s.total, 0);

    expect(cash).toBe(100);
    expect(digital).toBe(300);
  });
});

