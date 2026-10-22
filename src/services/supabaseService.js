import { supabase, isSupabaseConfigured } from "./supabaseClient";

export { isSupabaseConfigured };

export const normalizeProductFromSupabase = (p) => {
  if (!p) return null;
  const isLargo = p.id === "prod-largo" || p.name?.includes("Largo") || p.name?.includes("ላርጎ");
  const isBerekina = p.id === "prod-berekina" || p.name?.includes("Berekina") || p.name?.includes("በረኪና");

  return {
    id: p.id,
    name: p.name,
    localName:
      p.local_name ||
      (isLargo ? "ላርጎ ፈሳሽ ሳሙና" : isBerekina ? "በረኪና ማጽጃ" : p.name),
    category: p.category || (isBerekina ? "በረኪና" : "ላርጎ"),
    scent:
      p.scent ||
      p.fragrance_or_color ||
      (isBerekina ? "Clear / Chlorine" : "Lemon"),
    color: p.color || (isBerekina ? "#06b6d4" : "#0d9488"),
    iconEmoji: p.icon_emoji || (isBerekina ? "✨" : "🧴"),
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

  const totalLiters = items.reduce(
    (acc, it) => acc + (Number(it.liters) || 0),
    0
  );

  const totalAmount = Number(s.total_amount ?? s.total) || 0;
  const noteStr = s.notes || s.note || "";

  return {
    id: s.invoice_number || s.id,
    date: s.date || s.created_at || new Date().toISOString(),
    customerName: s.customer_name || "Walk-in Customer",
    customerPhone: s.customer_phone || "N/A",
    paymentMethod: s.payment_method || "Cash",
    items,
    subtotal: Number(s.subtotal) || totalAmount,
    discount: Number(s.discount) || 0,
    total: totalAmount,
    profit: Number(s.profit) || 0,
    totalLiters: totalLiters || Number(s.total_liters) || 0,
    cashTendered: s.cash_tendered ? Number(s.cash_tendered) : null,
    changeDue: s.change_due ? Number(s.change_due) : null,
    note: noteStr,
    status: s.status || s.payment_status || "Completed",
    creditDueDate: s.credit_due_date || null,
  };
};

export const normalizeExpenseFromSupabase = (e) => {
  if (!e) return null;
  return {
    id: e.id,
    title: e.title || "Shop Expense",
    category: e.category || "Supplies",
    amount: Number(e.amount) || 0,
    paymentMethod: e.payment_method || "Cash",
    date: e.date || e.created_at || new Date().toISOString(),
    notes: e.notes || e.note || "",
  };
};

export const fetchSupabaseProducts = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.warn("Could not fetch products from Supabase:", error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(normalizeProductFromSupabase).filter(Boolean);
    }
    return null;
  } catch (err) {
    console.warn("fetchSupabaseProducts error:", err);
    return null;
  }
};

export const fetchSupabaseSales = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch sales from Supabase:", error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(normalizeSaleFromSupabase).filter(Boolean);
    }
    return null;
  } catch (err) {
    console.warn("fetchSupabaseSales error:", err);
    return null;
  }
};

export const fetchSupabaseExpenses = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch expenses from Supabase:", error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(normalizeExpenseFromSupabase).filter(Boolean);
    }
    return null;
  } catch (err) {
    console.warn("fetchSupabaseExpenses error:", err);
    return null;
  }
};

export const recordSaleInSupabase = async (sale) => {
  if (!supabase) return;
  try {
    const totalAmount = Number(sale.total ?? sale.total_amount) || 0;
    const noteText = sale.note || sale.notes || "";

    const payload = {
      id: sale.id,
      invoice_number: sale.id?.replace("REC-", "INV-") || sale.id,
      date: sale.date || new Date().toISOString(),
      customer_name: sale.customerName || "Walk-in Customer",
      customer_phone: sale.customerPhone || "N/A",
      items: (sale.items || []).map((it) => ({
        productId: it.productId,
        productName: it.name,
        quantity: it.liters,
        unitPrice: it.pricePerLiter,
        subtotal: it.totalPrice,
      })),
      subtotal: Number(sale.subtotal) || totalAmount,
      discount: Number(sale.discount) || 0,
      total: totalAmount,
      total_amount: totalAmount,
      total_cost: sale.items?.reduce((acc, it) => acc + (it.totalCost || 0), 0) || 0,
      profit: Number(sale.profit) || 0,
      total_liters: Number(sale.totalLiters) || 0,
      payment_method: sale.paymentMethod || "Cash",
      cash_tendered: sale.cashTendered || null,
      change_due: sale.changeDue || null,
      note: noteText,
      notes: noteText,
      credit_due_date: sale.creditDueDate || null,
      status: sale.status || (sale.paymentMethod === "Credit" ? "Credit" : "Completed"),
      payment_status: sale.paymentMethod === "Credit" ? "pending" : "paid",
      pricing_tier: "retail",
    };

    const { error } = await supabase.from("sales").insert([payload]);
    if (error) {
      console.warn("Supabase recordSale error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase recordSale failed:", err);
  }
};

export const updateProductStockInSupabase = async (productId, newStockLiters) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("products")
      .update({
        stock_liters: Number(newStockLiters),
      })
      .eq("id", productId);

    if (error) {
      console.warn("Supabase updateProductStock error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase updateProductStock failed:", err);
  }
};

export const recordExpenseInSupabase = async (expense) => {
  if (!supabase) return;
  try {
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

    const { error } = await supabase.from("expenses").insert([payload]);
    if (error) {
      console.warn("Supabase recordExpense error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase recordExpense failed:", err);
  }
};

export const deleteExpenseFromSupabase = async (expenseId) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) {
      console.warn("Supabase deleteExpense error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase deleteExpense failed:", err);
  }
};

export const subscribeToRealtimeChanges = (onProductsChange, onSalesChange, onExpensesChange) => {
  if (!supabase) return () => {};
  try {
    const channel = supabase
      .channel("supabase-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          if (onProductsChange) onProductsChange();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => {
          if (onSalesChange) onSalesChange();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          if (onExpensesChange) onExpensesChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Realtime subscription error:", err);
    return () => {};
  }
};
