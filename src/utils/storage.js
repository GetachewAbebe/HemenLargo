import {
  INITIAL_SHOP_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_DEBTS,
} from "../data/initialData";

const STORAGE_KEYS = {
  SHOP_CONFIG: "sukie_shop_config_v2",
  PRODUCTS: "sukie_products_v2",
  SALES: "sukie_sales_v2",
  EXPENSES: "sukie_expenses_v2",
  DEBTS: "sukie_debts_v2",
};

const getStorageKey = (key, shopId) => {
  const baseKey = STORAGE_KEYS[key] || key;
  return shopId ? `${baseKey}:${shopId}` : baseKey;
};

export const loadStoredData = (shopId = null) => {
  try {
    const rawConfig = localStorage.getItem(getStorageKey("SHOP_CONFIG", shopId));
    const rawProducts = localStorage.getItem(getStorageKey("PRODUCTS", shopId));
    const rawSales = localStorage.getItem(getStorageKey("SALES", shopId));
    const rawExpenses = localStorage.getItem(getStorageKey("EXPENSES", shopId));
    const rawDebts = localStorage.getItem(getStorageKey("DEBTS", shopId));

    let config = rawConfig ? JSON.parse(rawConfig) : null;
    let products = rawProducts ? JSON.parse(rawProducts) : null;
    let sales = rawSales ? JSON.parse(rawSales) : null;
    let expenses = rawExpenses ? JSON.parse(rawExpenses) : null;
    let debts = rawDebts ? JSON.parse(rawDebts) : null;

    // Validate config structure
    if (!config || typeof config !== "object") {
      config = INITIAL_SHOP_CONFIG;
    } else {
      config = { ...INITIAL_SHOP_CONFIG, ...config };
    }

    // Validate products array and fields
    if (!Array.isArray(products) || (!shopId && products.length === 0)) {
      products = INITIAL_PRODUCTS;
    } else {
      products = products.map((p) => ({
        ...p,
        name: p.name || p.localName || "Liquid Soap",
        localName: p.localName || p.name || "",
        category: p.category || "General Cleanser",
        scent: p.scent || "Fresh",
        stockLiters: typeof p.stockLiters === "number" && !isNaN(p.stockLiters) ? p.stockLiters : (parseFloat(p.stockLiters) || 0),
        pricePerLiter: typeof p.pricePerLiter === "number" && !isNaN(p.pricePerLiter) ? p.pricePerLiter : (parseFloat(p.pricePerLiter) || 60),
        costPerLiter: typeof p.costPerLiter === "number" && !isNaN(p.costPerLiter) ? p.costPerLiter : (parseFloat(p.costPerLiter) || 35),
        minStockAlert: typeof p.minStockAlert === "number" && !isNaN(p.minStockAlert) ? p.minStockAlert : (parseFloat(p.minStockAlert) || 40),
        soldLiters: typeof p.soldLiters === "number" && !isNaN(p.soldLiters) ? p.soldLiters : (parseFloat(p.soldLiters) || 0),
      }));
    }

    // Validate sales, expenses, and debts arrays
    if (!Array.isArray(sales)) sales = shopId ? [] : INITIAL_SALES;
    if (!Array.isArray(expenses)) expenses = shopId ? [] : INITIAL_EXPENSES;
    if (!Array.isArray(debts)) debts = shopId ? [] : INITIAL_DEBTS;

    return { config, products, sales, expenses, debts };
  } catch (error) {
    console.error("Critical error reading localStorage, falling back to safe starter defaults:", error);
    return {
      config: INITIAL_SHOP_CONFIG,
      products: INITIAL_PRODUCTS,
      sales: shopId ? [] : INITIAL_SALES,
      expenses: shopId ? [] : INITIAL_EXPENSES,
      debts: shopId ? [] : INITIAL_DEBTS,
    };
  }
};

export const saveToStorage = (key, data, shopId = null) => {
  try {
    const storageKey = getStorageKey(key, shopId);
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage:`, err);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sukie_storage_quota_warning", {
          detail: {
            key,
            isQuotaExceeded: err.name === "QuotaExceededError" || err.code === 22,
          },
        })
      );
    }
    return false;
  }
};

export const exportAllDataAsJSON = (shopId = null) => {
  try {
    const currentData = loadStoredData(shopId);

    const exportPayload = {
      appName: "Sukie Liquid Soap Management",
      version: "2.5-production",
      exportedAt: new Date().toISOString(),
      data: {
        ...currentData,
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sukie_pos_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  } catch (err) {
    console.error("Failed to generate backup JSON file:", err);
    return false;
  }
};

export const exportLegacyLocalDataAsJSON = () => {
  const legacyKeys = [
    STORAGE_KEYS.SHOP_CONFIG,
    STORAGE_KEYS.PRODUCTS,
    STORAGE_KEYS.SALES,
    STORAGE_KEYS.EXPENSES,
    STORAGE_KEYS.DEBTS,
  ];
  if (!legacyKeys.some((key) => localStorage.getItem(key) !== null)) return false;

  const exportPayload = {
    appName: "Sukie Liquid Soap Management",
    version: "2.5-production",
    exportedAt: new Date().toISOString(),
    data: loadStoredData(),
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `sukie_legacy_backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  return true;
};

export const sanitizeImportPayload = (imported) => {
  if (!imported || typeof imported !== "object") return null;
  const payload = imported.data || imported;

  const sanitized = {};

  if (payload.config && typeof payload.config === "object") {
    sanitized.config = { ...INITIAL_SHOP_CONFIG, ...payload.config };
  }

  if (Array.isArray(payload.products)) {
    sanitized.products = payload.products.map((p, idx) => ({
      id: p.id || `soap-${idx + 1}`,
      name: p.name || "Custom Soap",
      localName: p.localName || "",
      category: p.category || "General Cleanser",
      scent: p.scent || "",
      color: p.color || "#0d9488",
      iconEmoji: p.iconEmoji || "",
      pricePerLiter: parseFloat(p.pricePerLiter) || 60,
      costPerLiter: parseFloat(p.costPerLiter) || 35,
      stockLiters: parseFloat(p.stockLiters) || 0,
      minStockAlert: parseFloat(p.minStockAlert) || 40,
      soldLiters: parseFloat(p.soldLiters) || 0,
    }));
  }

  if (Array.isArray(payload.sales)) {
    sanitized.sales = payload.sales.filter((s) => s && s.id && s.total != null);
  }

  if (Array.isArray(payload.expenses)) {
    sanitized.expenses = payload.expenses.filter((e) => e && e.id && e.amount != null);
  }

  if (Array.isArray(payload.debts)) {
    sanitized.debts = payload.debts.filter((d) => d && d.id && d.totalAmount != null);
  }

  return sanitized;
};

export const resetToDefaults = (shopId = null) => {
  localStorage.setItem(getStorageKey("SHOP_CONFIG", shopId), JSON.stringify(INITIAL_SHOP_CONFIG));
  localStorage.setItem(getStorageKey("PRODUCTS", shopId), JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(getStorageKey("SALES", shopId), JSON.stringify(INITIAL_SALES));
  localStorage.setItem(getStorageKey("EXPENSES", shopId), JSON.stringify(INITIAL_EXPENSES));
  localStorage.setItem(getStorageKey("DEBTS", shopId), JSON.stringify(INITIAL_DEBTS));
  return {
    config: INITIAL_SHOP_CONFIG,
    products: INITIAL_PRODUCTS,
    sales: INITIAL_SALES,
    expenses: INITIAL_EXPENSES,
    debts: INITIAL_DEBTS,
  };
};
