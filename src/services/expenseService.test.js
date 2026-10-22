import { describe, it, expect } from "vitest";
import { normalizeExpenseFromSupabase } from "./supabaseService";

describe("Chemical Registration & Expense Calculation", () => {
  it("calculates whole price correctly from litres bought and price per litre", () => {
    const litersBought = 50;
    const pricePerLiter = 70;
    const wholePrice = (litersBought * pricePerLiter).toFixed(2);
    expect(parseFloat(wholePrice)).toBe(3500.0);
  });

  it("handles decimal litres and rates accurately", () => {
    const litersBought = 12.5;
    const pricePerLiter = 72.4;
    const wholePrice = (litersBought * pricePerLiter).toFixed(2);
    expect(parseFloat(wholePrice)).toBe(905.0);
  });

  it("normalizes and preserves chemical volume and unit price from records", () => {
    const rawExpense = {
      id: "exp-99",
      title: "SLS Surfactant",
      category: "Raw Materials & Chemicals",
      amount: 3500,
      payment_method: "Telebirr",
      liters_bought: 50,
      price_per_liter: 70,
      unit: "L",
      notes: "Purchased from Merkato importer",
    };

    const normalized = normalizeExpenseFromSupabase(rawExpense);
    expect(normalized.litersBought).toBe(50);
    expect(normalized.pricePerLiter).toBe(70);
    expect(normalized.unit).toBe("L");
    expect(normalized.amount).toBe(3500);
  });

  it("gracefully recovers liters bought and rate from notes string when schema columns are absent", () => {
    const rawLegacyExpense = {
      id: "exp-legacy",
      title: "Sulfonic Acid Batch",
      category: "Raw Materials & Chemicals",
      amount: 4750,
      payment_method: "CBE Birr",
      notes: "Registered: 50 L @ 95.00 ETB/L • Received at morning delivery",
    };

    const normalized = normalizeExpenseFromSupabase(rawLegacyExpense);
    expect(normalized.litersBought).toBe(50);
    expect(normalized.pricePerLiter).toBe(95);
    expect(normalized.unit).toBe("L");
  });
});
