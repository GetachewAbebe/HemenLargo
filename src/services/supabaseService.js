import { supabase } from "./supabaseClient";

export const normalizeProductFromSupabase = (p) => {
  const isLargo = p.id === "prod-largo" || p.name.includes("Largo") || p.name.includes("ላርጎ");
  const isBerekina = p.id === "prod-berekina" || p.name.includes("Berekina") || p.name.includes("በረኪና");

  return {
    id: p.id,
    name: p.name,
    localName:
      p.local_name ||
      (isLargo ? "ላርጎ ፈሳሽ ሳሙና" : isBerekina ? "በረኪና ማጽጃ" : p.name),
    category: p.category || (isBerekina ? "በረኪና" : "ላርጎ"),
    scent:
      p.fragrance_or_color ||
      p.scent ||
      (isBerekina ? "Clear / Chlorine" : "Lemon"),
    color: p.color || (isBerekina ? "#06b6d4" : "#0d9488"),
    iconEmoji: p.icon_emoji || (isBerekina ? "✨" : "🧴"),
    pricePerLiter: Number(p.selling_price ?? p.price_per_liter) || (isLargo ? 110 : 75),
    costPerLiter: Number(p.cost_price ?? p.cost_per_liter) || (isLargo ? 65 : 45),
    stockLiters: Number(p.current_stock ?? p.stock_liters) || 0,
    minStockAlert: Number(p.min_stock_alert) || 20,
    soldLiters: Number(p.sold_liters) || 0,
    description: p.description || "",
  };
};

export const normalizeSaleFromSupabase = (s) => {
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

  return {
    id: s.invoice_number || s.id,
    date: s.date || s.created_at || new Date().toISOString(),
    customerName: s.customer_name || "Walk-in Customer",
    customerPhone: s.customer_phone || "N/A",
    paymentMethod: s.payment_method || "Cash",
    items,
    subtotal: Number(s.subtotal) || 0,
    discount: Number(s.discount) || 0,
    total: Number(s.total_amount ?? s.total) || 0,
    profit: Number(s.profit) || 0,
    totalLiters: totalLiters || Number(s.total_liters) || 0,
    note: s.notes || s.note || "",
    status: s.payment_status || "Completed",
    creditDueDate: s.credit_due_date || null,
  };
};

export const fetchSupabaseProducts = async () => {
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
      return data.map(normalizeProductFromSupabase);
    }
    return null;
  } catch (err) {
    console.warn("fetchSupabaseProducts error:", err);
    return null;
  }
};

export const fetchSupabaseSales = async () => {
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
      return data.map(normalizeSaleFromSupabase);
    }
    return null;
  } catch (err) {
    console.warn("fetchSupabaseSales error:", err);
    return null;
  }
};

export const recordSaleInSupabase = async (sale) => {
  try {
    const payload = {
      id: sale.id,
      invoice_number: sale.id.replace("REC-", "INV-"),
      date: sale.date,
      customer_name: sale.customerName,
      customer_phone: sale.customerPhone,
      items: sale.items.map((it) => ({
        productId: it.productId,
        productName: it.name,
        quantity: it.liters,
        unitPrice: it.pricePerLiter,
        subtotal: it.totalPrice,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      total_amount: sale.total,
      total_cost: sale.items?.reduce((acc, it) => acc + (it.totalCost || 0), 0) || 0,
      profit: sale.profit,
      payment_method: sale.paymentMethod,
      amount_paid: sale.paymentMethod === "Credit" ? 0 : sale.total,
      debt_amount: sale.paymentMethod === "Credit" ? sale.total : 0,
      payment_status: sale.paymentMethod === "Credit" ? "unpaid" : "paid",
      pricing_tier: "retail",
      notes: sale.note,
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
  try {
    const { error } = await supabase
      .from("products")
      .update({ current_stock: Number(newStockLiters) })
      .eq("id", productId);

    if (error) {
      console.warn("Supabase updateProductStock error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase updateProductStock failed:", err);
  }
};

export const subscribeToRealtimeChanges = (onProductsChange, onSalesChange) => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Realtime subscription error:", err);
    return () => {};
  }
};
