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
  USERS: "sukie_users_list_v1",
  SESSION: "sukie_active_session_v1",
};

export const loadStoredData = () => {
  try {
    const rawConfig = localStorage.getItem(STORAGE_KEYS.SHOP_CONFIG);
    const rawProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const rawSales = localStorage.getItem(STORAGE_KEYS.SALES);
    const rawExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const rawDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);

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
    if (!Array.isArray(products) || products.length === 0) {
      products = INITIAL_PRODUCTS;
    } else {
      products = products.map((p) => ({
        ...p,
        stockLiters: typeof p.stockLiters === "number" && !isNaN(p.stockLiters) ? p.stockLiters : 0,
        pricePerLiter: typeof p.pricePerLiter === "number" && !isNaN(p.pricePerLiter) ? p.pricePerLiter : 60,
        costPerLiter: typeof p.costPerLiter === "number" && !isNaN(p.costPerLiter) ? p.costPerLiter : 35,
      }));
    }

    // Validate sales, expenses, and debts arrays
    if (!Array.isArray(sales)) sales = INITIAL_SALES;
    if (!Array.isArray(expenses)) expenses = INITIAL_EXPENSES;
    if (!Array.isArray(debts)) debts = INITIAL_DEBTS;

    return { config, products, sales, expenses, debts };
  } catch (error) {
    console.error("Critical error reading localStorage, falling back to safe starter defaults:", error);
    return {
      config: INITIAL_SHOP_CONFIG,
      products: INITIAL_PRODUCTS,
      sales: INITIAL_SALES,
      expenses: INITIAL_EXPENSES,
      debts: INITIAL_DEBTS,
    };
  }
};

export const saveToStorage = (key, data) => {
  try {
    const storageKey = STORAGE_KEYS[key] || key;
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

export const exportAllDataAsJSON = () => {
  try {
    const currentData = loadStoredData();
    let usersList = [];
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawUsers) usersList = JSON.parse(rawUsers);
    } catch {
      // Ignore user parse fail
    }

    const exportPayload = {
      appName: "Sukie Liquid Soap Management",
      version: "2.5-production",
      exportedAt: new Date().toISOString(),
      data: {
        ...currentData,
        users: usersList,
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
      iconEmoji: p.iconEmoji || "🧴",
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

  if (Array.isArray(payload.users)) {
    sanitized.users = payload.users;
  }

  return sanitized;
};

export const resetToDefaults = () => {
  localStorage.setItem(STORAGE_KEYS.SHOP_CONFIG, JSON.stringify(INITIAL_SHOP_CONFIG));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(INITIAL_DEBTS));
  return {
    config: INITIAL_SHOP_CONFIG,
    products: INITIAL_PRODUCTS,
    sales: INITIAL_SALES,
    expenses: INITIAL_EXPENSES,
    debts: INITIAL_DEBTS,
  };
};
