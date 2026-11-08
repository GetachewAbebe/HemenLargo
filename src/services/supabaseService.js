import { supabase, isSupabaseConfigured } from "./supabaseClient";

export { isSupabaseConfigured };

const requireClient = () => {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

const fetchAll = async (table, configureQuery = (query) => query) => {
  const client = requireClient();
  const pageSize = 500;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    let query = configureQuery(client.from(table).select("*"));
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
};

export const normalizeProductFromSupabase = (p) => {
  if (!p) return null;
  const productName = p.name || p.product_name || p.local_name || "Liquid Soap";
  const isLargo = p.id === "prod-largo" || productName.includes("Largo") || productName.includes("ላርጎ");
  const isBerekina = p.id === "prod-berekina" || productName.includes("Berekina") || productName.includes("በረኪና");

  return {
    id: p.id,
    name: productName,
    localName:
      p.local_name ||
      p.localName ||
      (isLargo ? "ላርጎ ፈሳሽ ሳሙና" : isBerekina ? "በረኪና ማጽጃ" : productName),
    category: p.category || (isBerekina ? "በረኪና" : "ላርጎ"),
    scent: p.scent || p.fragrance_or_color || (isBerekina ? "Clear / Chlorine" : "Lemon"),
    color: p.color || (isBerekina ? "#06b6d4" : "#0d9488"),
    iconEmoji: p.icon_emoji || "",
    pricePerLiter: Number(p.price_per_liter ?? p.selling_price) || (isLargo ? 110 : 75),
    costPerLiter: Number(p.cost_per_liter ?? p.cost_price) || (isLargo ? 65 : 45),
    stockLiters: Number(p.stock_liters ?? p.current_stock) || 0,
    minStockAlert: Number(p.min_stock_alert) || 20,
    soldLiters: Number(p.sold_liters) || 0,
    description: p.description || "",
  };
};

export const normalizeSaleFromSupabase = (s) => {
  if (!s) return null;
  const items = Array.isArray(s.items)
    ? s.items.map((i) => ({
        productId: i.productId || "prod-unknown",
        name: i.productName || i.name || "Liquid Soap",
        pricePerLiter: Number(i.unitPrice ?? i.pricePerLiter) || 0,
        liters: Number(i.quantity ?? i.liters) || 0,
        totalPrice: Number(i.subtotal ?? i.totalPrice) || 0,
        totalCost: Number(i.totalCost) || 0,
        color: i.color || "#0d9488",
        scent: i.scent || "Fresh",
      }))
    : [];
  const totalAmount = Number(s.total_amount ?? s.total) || 0;

  return {
    id: s.id,
    invoiceNumber: s.invoice_number || s.id,
    date: s.date || s.created_at || new Date().toISOString(),
    customerName: s.customer_name || "Walk-in Customer",
    customerPhone: s.customer_phone || "N/A",
    paymentMethod: s.payment_method || "Cash",
    items,
    subtotal: Number(s.subtotal) || totalAmount,
    discount: Number(s.discount) || 0,
    total: totalAmount,
    profit: Number(s.profit) || 0,
    totalLiters: items.reduce((total, item) => total + item.liters, 0) || Number(s.total_liters) || 0,
    cashTendered: s.cash_tendered == null ? null : Number(s.cash_tendered),
    changeDue: s.change_due == null ? null : Number(s.change_due),
    note: s.notes || s.note || "",
    status: s.status || s.payment_status || "Completed",
    creditDueDate: s.credit_due_date || null,
  };
};

export const normalizeExpenseFromSupabase = (e) => {
  if (!e) return null;
  const notes = e.notes || e.note || "";
  let litersBought = Number(e.liters_bought ?? e.litersBought) || null;
  let pricePerLiter = Number(e.price_per_liter ?? e.pricePerLiter) || null;
  let unit = e.unit || "L";

  if (!litersBought && notes) {
    const match = notes.match(/(\d+(?:\.\d+)?)\s*(L|kg)\s*@\s*(\d+(?:\.\d+)?)/i);
    if (match) {
      litersBought = parseFloat(match[1]);
      unit = match[2];
      pricePerLiter = parseFloat(match[3]);
    }
  }

  return {
    id: e.id,
    title: e.title || "Shop Expense",
    category: e.category || "Supplies",
    amount: Number(e.amount) || 0,
    paymentMethod: e.payment_method || "Cash",
    date: e.date || e.created_at || new Date().toISOString(),
    litersBought,
    pricePerLiter,
    unit,
    notes,
  };
};

export const normalizeDebtFromSupabase = (debt, payments = []) => {
  if (!debt) return null;
  const totalAmount = Number(debt.total_amount) || 0;
  const paidAmount = Number(debt.paid_amount) || 0;
  const remainingBalance = Number(debt.remaining_balance ?? (totalAmount - paidAmount)) || 0;

  return {
    id: debt.id,
    customerName: debt.customer_name || "Customer",
    customerPhone: debt.customer_phone || "N/A",
    saleId: debt.sale_id || "",
    date: debt.date || debt.created_at || new Date().toISOString(),
    totalAmount,
    paidAmount,
    remainingBalance,
    dueDate: debt.due_date || "",
    status: debt.status || (remainingBalance <= 0 ? "Settled" : paidAmount > 0 ? "Partially Paid" : "Unpaid"),
    notes: debt.notes || "",
    payments,
  };
};

export const fetchSupabaseProducts = async () =>
  (await fetchAll("products", (query) => query.order("id", { ascending: true })))
    .map(normalizeProductFromSupabase)
    .filter(Boolean);

export const fetchSupabaseSales = async () =>
  (await fetchAll("sales", (query) => query.neq("status", "Voided").order("created_at", { ascending: false })))
    .map(normalizeSaleFromSupabase)
    .filter(Boolean);

export const fetchSupabaseExpenses = async () =>
  (await fetchAll("expenses", (query) => query.order("created_at", { ascending: false })))
    .map(normalizeExpenseFromSupabase)
    .filter(Boolean);

export const fetchSupabaseDebts = async () => {
  const [debts, payments] = await Promise.all([
    fetchAll("debts", (query) => query.order("created_at", { ascending: false })),
    fetchAll("debt_payments", (query) => query.order("date", { ascending: false })),
  ]);
  const paymentsByDebt = new Map();
  for (const payment of payments) {
    const list = paymentsByDebt.get(payment.debt_id) || [];
    list.push({
      id: payment.id,
      date: payment.date,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      note: payment.note,
    });
    paymentsByDebt.set(payment.debt_id, list);
  }
  return debts.map((debt) => normalizeDebtFromSupabase(debt, paymentsByDebt.get(debt.id) || [])).filter(Boolean);
};

export const fetchSupabaseConfig = async () => {
  const client = requireClient();
  const { data, error } = await client.from("shop_config").select("*").order("updated_at", { ascending: false }).limit(1);
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    shopName: row.shop_name || row.store_name,
    tagline: row.tagline,
    ownerName: row.owner_name,
    phone: row.phone,
    address: row.address || row.location,
    currency: row.currency,
    calendarSystem: row.calendar_system,
    calendarStyle: row.calendar_style,
    receiptFooter: row.receipt_footer,
    taxRate: Number(row.tax_rate ?? row.vat_percent) || 0,
  };
};

export const recordSaleInSupabase = async (sale) => {
  const totalAmount = Number(sale.total ?? sale.total_amount) || 0;
  const { error } = await requireClient().rpc("record_sale", {
    p_sale: {
      id: sale.id,
      invoice_number: sale.id?.replace("REC-", "INV-") || sale.id,
      date: sale.date,
      customer_name: sale.customerName,
      customer_phone: sale.customerPhone,
      payment_method: sale.paymentMethod,
      items: sale.items || [],
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: totalAmount,
      total_liters: sale.totalLiters,
      total_cost: sale.items?.reduce((total, item) => total + (Number(item.totalCost) || 0), 0) || 0,
      profit: sale.profit,
      cash_tendered: sale.cashTendered,
      change_due: sale.changeDue,
      note: sale.note,
      credit_due_date: sale.creditDueDate,
      debt_id: sale.paymentMethod === "Credit" ? `debt-${sale.id.replace("REC-", "")}` : null,
      status: sale.status,
    },
  });
  if (error) throw error;
};

export const voidSaleInSupabase = async (saleId) => {
  const { error } = await requireClient().rpc("void_sale", { p_sale_id: saleId });
  if (error) throw error;
};

export const clearShopSalesInSupabase = async () => {
  const { error } = await requireClient().rpc("clear_shop_sales");
  if (error) throw error;
};

export const upsertProductInSupabase = async (product) => {
  const payload = {
    id: product.id,
    name: product.name,
    local_name: product.localName || "",
    category: product.category,
    scent: product.scent,
    color: product.color,
    icon_emoji: product.iconEmoji || "",
    price_per_liter: product.pricePerLiter,
    cost_per_liter: product.costPerLiter,
    stock_liters: product.stockLiters,
    min_stock_alert: product.minStockAlert,
    sold_liters: product.soldLiters || 0,
    description: product.description || "",
  };
  const { error } = await requireClient().from("products").upsert(payload, { onConflict: "shop_id,id" });
  if (error) throw error;
};

export const updateProductStockInSupabase = async (productId, newStockLiters) => {
  const { data, error } = await requireClient()
    .from("products")
    .update({ stock_liters: Number(newStockLiters) })
    .eq("id", productId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Product ${productId} was not found in the cloud shop.`);
};

export const deleteProductFromSupabase = async (productId) => {
  const { error } = await requireClient().from("products").delete().eq("id", productId);
  if (error) throw error;
};

export const recordExpenseInSupabase = async (expense) => {
  const payload = {
    id: expense.id,
    title: expense.title,
    category: expense.category || "Supplies",
    amount: Number(expense.amount) || 0,
    payment_method: expense.paymentMethod || "Cash",
    date: expense.date || new Date().toISOString(),
    note: expense.notes || "",
    notes: expense.notes || "",
  };
  const { error } = await requireClient().from("expenses").upsert(payload);
  if (error) throw error;
};

export const deleteExpenseFromSupabase = async (expenseId) => {
  const { error } = await requireClient().from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
};

export const recordDebtInSupabase = async (debt) => {
  const payload = {
    id: debt.id,
    customer_name: debt.customerName,
    customer_phone: debt.customerPhone || "N/A",
    sale_id: debt.saleId || null,
    date: debt.date || new Date().toISOString(),
    total_amount: Number(debt.totalAmount) || 0,
    paid_amount: Number(debt.paidAmount) || 0,
    remaining_balance: Number(debt.remainingBalance) || 0,
    due_date: debt.dueDate || null,
    status: debt.status || "Unpaid",
    notes: debt.notes || "",
  };
  const { error } = await requireClient().from("debts").upsert(payload);
  if (error) throw error;
};

export const deleteDebtFromSupabase = async (debtId) => {
  const { error } = await requireClient().from("debts").delete().eq("id", debtId);
  if (error) throw error;
};

export const recordDebtPaymentInSupabase = async (debtId, payment) => {
  const { error } = await requireClient().rpc("record_debt_payment", {
    p_payment: {
      id: payment.id,
      debt_id: debtId,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      note: payment.note,
      date: payment.date,
    },
  });
  if (error) throw error;
};

export const addInitialProductsInSupabase = async (products) => {
  if (!products.length) return;
  const { error } = await requireClient().from("products").upsert(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      local_name: product.localName || "",
      category: product.category,
      scent: product.scent,
      color: product.color,
      icon_emoji: product.iconEmoji || "",
      price_per_liter: product.pricePerLiter,
      cost_per_liter: product.costPerLiter,
      stock_liters: product.stockLiters,
      min_stock_alert: product.minStockAlert,
      sold_liters: product.soldLiters || 0,
      description: product.description || "",
    })),
    { onConflict: "shop_id,id", ignoreDuplicates: true }
  );
  if (error) throw error;
};

export const updateShopConfigInSupabase = async (config, shopId) => {
  const payload = {
    id: shopId,
    shop_id: shopId,
    shop_name: config.shopName,
    store_name: config.shopName,
    tagline: config.tagline,
    owner_name: config.ownerName,
    phone: config.phone,
    address: config.address,
    location: config.address,
    currency: config.currency,
    calendar_system: config.calendarSystem,
    calendar_style: config.calendarStyle,
    receipt_footer: config.receiptFooter,
    tax_rate: config.taxRate || 0,
    vat_percent: config.taxRate || 0,
    updated_at: new Date().toISOString(),
  };
  const { error } = await requireClient().from("shop_config").upsert(payload);
  if (error) throw error;
};

export const runCloudOperation = async (operation) => {
  switch (operation.type) {
    case "sale":
      return recordSaleInSupabase(operation.payload);
    case "void_sale":
      return voidSaleInSupabase(operation.payload.saleId);
    case "clear_sales":
      return clearShopSalesInSupabase();
    case "stock_update":
      return updateProductStockInSupabase(operation.payload.productId, operation.payload.stockLiters);
    case "product_upsert":
      return upsertProductInSupabase(operation.payload);
    case "product_delete":
      return deleteProductFromSupabase(operation.payload.productId);
    case "expense_upsert":
      return recordExpenseInSupabase(operation.payload);
    case "expense_delete":
      return deleteExpenseFromSupabase(operation.payload.expenseId);
    case "debt_upsert":
      return recordDebtInSupabase(operation.payload);
    case "debt_delete":
      return deleteDebtFromSupabase(operation.payload.debtId);
    case "debt_payment":
      return recordDebtPaymentInSupabase(operation.payload.debtId, operation.payload.payment);
    case "config_upsert":
      return updateShopConfigInSupabase(operation.payload.config, operation.payload.shopId);
    case "initial_products":
      return addInitialProductsInSupabase(operation.payload.products);
    default:
      throw new Error(`Unknown pending cloud operation: ${operation.type}`);
  }
};

export const subscribeToRealtimeChanges = (onProductsChange, onSalesChange, onExpensesChange, onDebtsChange, onConfigChange) => {
  if (!supabase) return () => {};
  const channel = supabase
    .channel("supabase-realtime-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, onProductsChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, onSalesChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, onExpensesChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "debts" }, onDebtsChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "debt_payments" }, onDebtsChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "shop_config" }, onConfigChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
