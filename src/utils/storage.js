import {
  INITIAL_SHOP_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
} from "../data/initialData";

const STORAGE_KEYS = {
  SHOP_CONFIG: "sukie_shop_config_v2",
  PRODUCTS: "sukie_products_v2",
  SALES: "sukie_sales_v2",
  EXPENSES: "sukie_expenses_v2",
};

export const loadStoredData = () => {
  try {
    const config = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_CONFIG)) || INITIAL_SHOP_CONFIG;
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || INITIAL_PRODUCTS;
    const sales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || INITIAL_SALES;
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)) || INITIAL_EXPENSES;

    return { config, products, sales, expenses };
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    return {
      config: INITIAL_SHOP_CONFIG,
      products: INITIAL_PRODUCTS,
      sales: INITIAL_SALES,
      expenses: INITIAL_EXPENSES,
    };
  }
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage:`, err);
  }
};

export const exportAllDataAsJSON = () => {
  const currentData = loadStoredData();
  const exportPayload = {
    appName: "Sukie Liquid Soap Management",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: currentData,
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `sukie_backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const resetToDefaults = () => {
  localStorage.setItem(STORAGE_KEYS.SHOP_CONFIG, JSON.stringify(INITIAL_SHOP_CONFIG));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  localStorage.removeItem("sukie_debts_v2");
  return {
    config: INITIAL_SHOP_CONFIG,
    products: INITIAL_PRODUCTS,
    sales: INITIAL_SALES,
    expenses: INITIAL_EXPENSES,
  };
};
