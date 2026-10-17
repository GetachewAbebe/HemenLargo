import React, { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Droplets,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  User,
  Phone,
  Tag,
  Zap,
  RefreshCw,
  Percent,
  X,
} from "lucide-react";
import { soundFX } from "../utils/audio";

const CONTAINER_PRESETS = [
  { label: "0.5 L", liters: 0.5, name: "500ml Bottle", icon: "🧴" },
  { label: "1.0 L", liters: 1.0, name: "1 Liter Bottle", icon: "🧴" },
  { label: "2.0 L", liters: 2.0, name: "2 Liter Jug", icon: "🫙" },
  { label: "5.0 L", liters: 5.0, name: "5L Gallon Can", icon: "🪣", popular: true },
  { label: "10.0 L", liters: 10.0, name: "10L Can", icon: "🛢️" },
  { label: "20.0 L", liters: 20.0, name: "20L Jerrycan", icon: "🛢️" },
];

export default function POSView({
  products,
  sales = [],
  debts = [],
  currency = "ETB",
  onCompleteSale,
  onRestockLiters,
}) {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashTendered, setCashTendered] = useState("");
  const [creditDueDate, setCreditDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [byocDiscountActive, setByocDiscountActive] = useState(false);
  const [customLiters, setCustomLiters] = useState({});
  const [saleNotes, setSaleNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Quick repeat customer suggestions from past sales and debts
  const recentCustomers = useMemo(() => {
    const map = new Map();
    [...debts, ...sales].forEach((item) => {
      if (item.customerName && item.customerName !== "Walk-in Customer" && !map.has(item.customerName)) {
        map.set(item.customerName, item.customerPhone && item.customerPhone !== "N/A" ? item.customerPhone : "");
      }
    });
    return Array.from(map.entries()).slice(0, 5);
  }, [sales, debts]);

  // Inline Quick Refill Modal
  const [refillModalProduct, setRefillModalProduct] = useState(null);
  const [refillAmount, setRefillAmount] = useState(100);

  // Add items to cart
  const addToCart = (product, litersToAdd) => {
    setErrorMessage("");
    const qty = parseFloat(litersToAdd);
    if (!qty || qty <= 0) return;

    if (qty > product.stockLiters) {
      soundFX.playWarning();
      setErrorMessage(
        `Cannot add ${qty}L of "${product.name}". Only ${product.stockLiters.toFixed(1)}L available in tank.`
      );
      return;
    }

    soundFX.playPop();

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newTotalLiters = updated[existingIndex].liters + qty;
        if (newTotalLiters > product.stockLiters) {
          soundFX.playWarning();
          setErrorMessage(
            `Total requested (${newTotalLiters}L) exceeds tank stock (${product.stockLiters}L).`
          );
          return prevCart;
        }
        updated[existingIndex] = {
          ...updated[existingIndex],
          liters: Number(newTotalLiters.toFixed(2)),
          totalPrice: Number((newTotalLiters * product.pricePerLiter).toFixed(2)),
          totalCost: Number((newTotalLiters * product.costPerLiter).toFixed(2)),
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            localName: product.localName,
            pricePerLiter: product.pricePerLiter,
            costPerLiter: product.costPerLiter,
            liters: Number(qty.toFixed(2)),
            totalPrice: Number((qty * product.pricePerLiter).toFixed(2)),
            totalCost: Number((qty * product.costPerLiter).toFixed(2)),
            color: product.color,
            scent: product.scent,
          },
        ];
      }
    });
  };

  // Toggle BYOC (Bring Your Own Container) Discount (-5 ETB)
  const toggleByocDiscount = () => {
    soundFX.playPop();
    if (!byocDiscountActive) {
      setDiscountAmount((prev) => (Number(prev) || 0) + 5);
      setByocDiscountActive(true);
    } else {
      setDiscountAmount((prev) => Math.max(0, (Number(prev) || 0) - 5));
      setByocDiscountActive(false);
    }
  };

  // 1-Click Combo: 5L Largo + 2L Barikina
  const handleAddCombo = () => {
    soundFX.playPop();
    const largo = products.find((p) => p.name.includes("Largo") || p.id === "prod-1");
    const barikina = products.find((p) => p.name.includes("Barikina") || p.id === "prod-2");

    if (largo && barikina) {
      addToCart(largo, 5);
      addToCart(barikina, 2);
    }
  };

  // Quick Customer presets
  const applyCustomerPreset = (name, phone) => {
    soundFX.playPop();
    setCustomerName(name);
    setCustomerPhone(phone || "");
  };

  // Adjust liters in cart
  const updateCartLiters = (productId, delta) => {
    setErrorMessage("");
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    soundFX.playPop();

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newLiters = Number((item.liters + delta).toFixed(2));
            if (newLiters <= 0) return null;
            if (newLiters > product.stockLiters) {
              soundFX.playWarning();
              setErrorMessage(`Cannot exceed current stock of ${product.stockLiters}L.`);
              return item;
            }
            return {
              ...item,
              liters: newLiters,
              totalPrice: Number((newLiters * item.pricePerLiter).toFixed(2)),
              totalCost: Number((newLiters * item.costPerLiter).toFixed(2)),
            };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    soundFX.playTrash();
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    soundFX.playTrash();
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCashTendered("");
    setDiscountAmount(0);
    setByocDiscountActive(false);
    setSaleNotes("");
    setErrorMessage("");
  };

  // Quick Refill handler directly from station
  const handleConfirmStationRefill = (e) => {
    e.preventDefault();
    if (!refillModalProduct || !refillAmount || parseFloat(refillAmount) <= 0) return;
    if (onRestockLiters) {
      onRestockLiters(refillModalProduct.id, parseFloat(refillAmount), refillModalProduct.costPerLiter);
    }
    soundFX.playCheckoutChime();
    setRefillModalProduct(null);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalCost = cart.reduce((acc, item) => acc + item.totalCost, 0);
  const finalTotal = Math.max(0, subtotal - (Number(discountAmount) || 0));
  const estimatedProfit = Math.max(0, finalTotal - totalCost);
  const totalLiters = cart.reduce((acc, item) => acc + item.liters, 0);
  const tenderedVal = parseFloat(cashTendered) || 0;
  const changeDue = tenderedVal > 0 ? Math.max(0, Number((tenderedVal - finalTotal).toFixed(2))) : 0;

  // Complete Checkout
  const handleCheckout = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (cart.length === 0) {
      soundFX.playWarning();
      setErrorMessage("Please select at least one soap item to checkout.");
      return;
    }

    if (paymentMethod === "Credit" && !customerName.trim()) {
      soundFX.playWarning();
      setErrorMessage("Customer Name is required when selling on Credit (ዕዳ).");
      return;
    }

    soundFX.playCheckoutChime();

    const saleRecord = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim() || "N/A",
      paymentMethod,
      items: cart,
      subtotal,
      discount: Number(discountAmount) || 0,
      total: finalTotal,
      profit: estimatedProfit,
      totalLiters,
      cashTendered: paymentMethod === "Cash" && tenderedVal > 0 ? tenderedVal : null,
      changeDue: paymentMethod === "Cash" && tenderedVal > 0 ? changeDue : null,
      note: saleNotes || (paymentMethod === "Credit" ? "Sold on store credit" : "Standard counter refill"),
      creditDueDate: paymentMethod === "Credit" ? creditDueDate : null,
      status: paymentMethod === "Credit" ? "Credit / Unpaid" : "Completed",
    };

    onCompleteSale(saleRecord);
    clearCart();
  };

  return (
    <div className="pos-layout-v2 animate-fade">
      {/* LEFT COLUMN: The Dual Dispenser Stations */}
      <section className="pos-stations-col">
        {/* Quick Action & Combo Banner */}
        <div className="pos-top-action-banner">
          <div className="combo-banner-left">
            <span className="combo-tag-pill">
              <Zap size={14} className="text-amber" />
              <strong>Quick Combo Deal</strong>
            </span>
            <span className="combo-desc">
              <strong>5L Largo + 2L Barikina</strong> = {(5 * 60 + 2 * 50).toLocaleString()} {currency}
            </span>
          </div>
          <button className="btn-add-combo" onClick={handleAddCombo}>
            <Plus size={15} />
            <span>+ Add Combo to Bill</span>
          </button>
        </div>

        {/* The Two Dedicated Product Dispenser Stations */}
        <div className="stations-grid">
          {products.map((prod) => {
            const isLargo = prod.id === "prod-1" || prod.name.includes("Largo");
            const isLowStock = prod.stockLiters <= (prod.minStockAlert || 50);
            const customVal = customLiters[prod.id] || "";
            const tankCapacity = 600;
            const tankPercent = Math.min(100, Math.round((prod.stockLiters / tankCapacity) * 100));

            return (
              <div
                key={prod.id}
                className={`dispenser-station-card ${isLargo ? "station-largo" : "station-barikina"}`}
              >
                {/* Station Header */}
                <div className="station-header">
                  <div className="station-title-wrap">
                    <div className="station-icon-bubble">
                      <span className="station-emoji">{prod.iconEmoji || (isLargo ? "🧴" : "✨")}</span>
                    </div>
                    <div>
                      <div className="station-tag-row">
                        <span className="station-badge">
                          {isLargo ? "Station 1 • Multi-purpose" : "Station 2 • Disinfectant Bleach"}
                        </span>
                      </div>
                      <h2 className="station-name">{prod.name}</h2>
                      <span className="station-subname">{prod.localName}</span>
                    </div>
                  </div>

                  <div className="station-rate-pill">
                    <span className="rate-amount">{prod.pricePerLiter}</span>
                    <span className="rate-unit">{currency} / L</span>
                  </div>
                </div>

                {/* Tank Level Gauge */}
                <div className="station-tank-box">
                  <div className="tank-gauge-info">
                    <div className="tank-status-left">
                      <Droplets size={16} className={isLargo ? "text-teal" : "text-cyan"} />
                      <span>Tank:</span>
                      <strong className="tank-liters-bold">{prod.stockLiters.toFixed(1)} L</strong>
                      <span className="capacity-sub">/ 600L</span>
                    </div>
                    <div className="tank-actions-right">
                      <span className={`stock-status-pill ${isLowStock ? "pill-low" : "pill-ok"}`}>
                        {isLowStock ? "Low Stock" : `${tankPercent}% Full`}
                      </span>
                      <button
                        type="button"
                        className="btn-quick-refill-station"
                        title="Add liters directly to barrel"
                        onClick={() => {
                          setRefillModalProduct(prod);
                          setRefillAmount(100);
                        }}
                      >
                        <RefreshCw size={12} />
                        <span>Refill</span>
                      </button>
                    </div>
                  </div>
                  <div className="tank-liquid-track">
                    <div
                      className={`tank-liquid-fill ${isLargo ? "liquid-teal" : "liquid-cyan"}`}
                      style={{ width: `${tankPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Container Options Grid */}
                <div className="station-containers-section">
                  <span className="section-micro-label">TAP TO ADD CONTAINER:</span>
                  <div className="container-presets-grid">
                    {CONTAINER_PRESETS.map((preset) => {
                      const calculatedPrice = (preset.liters * prod.pricePerLiter).toFixed(0);
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          className={`btn-container-card ${preset.popular ? "popular-card" : ""}`}
                          onClick={() => addToCart(prod, preset.liters)}
                          disabled={prod.stockLiters < preset.liters}
                        >
                          {preset.popular && <span className="popular-badge">★ Best Seller</span>}
                          <div className="container-icon-row">
                            <span className="container-icon">{preset.icon}</span>
                            <span className="container-size-tag">{preset.label}</span>
                          </div>
                          <span className="container-title">{preset.name}</span>
                          <span className="container-price-tag">
                            {calculatedPrice} <span className="unit-small">{currency}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Liter Input & Quick Stepper */}
                <div className="station-custom-pump">
                  <div className="custom-pump-header">
                    <span className="section-micro-label">CUSTOM LITERS / REFILL:</span>
                    <div className="quick-chip-buttons">
                      {[0.5, 1, 2, 5].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="quick-chip-btn"
                          onClick={() => addToCart(prod, amt)}
                        >
                          +{amt}L
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="custom-pump-row">
                    <div className="pump-input-box">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="Liters (e.g. 2.5)"
                        className="pump-input"
                        value={customVal}
                        onChange={(e) =>
                          setCustomLiters({ ...customLiters, [prod.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customVal) {
                            addToCart(prod, customVal);
                            setCustomLiters({ ...customLiters, [prod.id]: "" });
                          }
                        }}
                      />
                      <span className="pump-unit">L</span>
                    </div>

                    <button
                      type="button"
                      disabled={!customVal || parseFloat(customVal) <= 0}
                      className="btn-pump-add"
                      onClick={() => {
                        if (customVal) {
                          addToCart(prod, customVal);
                          setCustomLiters({ ...customLiters, [prod.id]: "" });
                        }
                      }}
                    >
                      <Plus size={15} />
                      <span>
                        {customVal && parseFloat(customVal) > 0
                          ? `Add ${(parseFloat(customVal) * prod.pricePerLiter).toFixed(0)} ${currency}`
                          : "Add"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RIGHT COLUMN: The Interactive Cart & Cashier Checkout */}
      <section className="pos-cart-col">
        <div className="cart-card-v2">
          {/* Cart Header */}
          <div className="cart-header-v2">
            <div>
              <h2 className="cart-title-v2">Active Order</h2>
              <span className="cart-subtitle-v2">
                {cart.length === 0
                  ? "Ready to dispense"
                  : `${cart.length} item${cart.length > 1 ? "s" : ""} • ${totalLiters.toFixed(1)}L total`}
              </span>
            </div>
            {cart.length > 0 && (
              <button className="btn-clear-cart-v2" onClick={clearCart} title="Clear cart">
                Clear
              </button>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="cart-error-banner-v2 animate-fade">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="cart-items-scroll">
            {cart.length === 0 ? (
              <div className="cart-empty-state-v2">
                <div className="empty-soap-bubble">🫧</div>
                <strong className="empty-title-v2">Cashier Ready</strong>
                <p className="empty-desc-v2">
                  Tap any container size (0.5L to 20L Jerrycan) from Largo or Barikina on the left.
                </p>
              </div>
            ) : (
              <div className="cart-items-list-v2">
                {cart.map((item) => (
                  <div key={item.productId} className="cart-item-card-v2 animate-fade">
                    <div className="cart-item-top-row">
                      <div className="item-badge-dot" style={{ backgroundColor: item.color }}></div>
                      <div className="cart-item-title-col">
                        <strong className="cart-item-title">{item.name}</strong>
                        <span className="cart-item-rate">
                          {item.pricePerLiter} {currency} / L
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-trash-item"
                        onClick={() => removeFromCart(item.productId)}
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="cart-item-bottom-row">
                      <div className="cart-qty-stepper">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateCartLiters(item.productId, -0.5)}
                          title="Minus 0.5L"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="stepper-val">{item.liters.toFixed(1)} L</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => updateCartLiters(item.productId, 0.5)}
                          title="Add 0.5L"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="cart-item-price-tag">
                        <span className="item-price-number">
                          {item.totalPrice.toFixed(2)}
                        </span>
                        <span className="item-price-cur">{currency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer & Checkout Form */}
          <form className="cart-checkout-form" onSubmit={handleCheckout}>
            {/* Quick Customer Chips */}
            <div className="customer-preset-chips">
              <span className="preset-label">Quick:</span>
              <button
                type="button"
                className="chip-preset-btn"
                onClick={() => applyCustomerPreset("Walk-in Customer", "")}
              >
                Walk-in
              </button>
              {recentCustomers.length > 0 ? (
                recentCustomers.map(([name, phone]) => (
                  <button
                    key={name}
                    type="button"
                    className="chip-preset-btn"
                    onClick={() => applyCustomerPreset(name, phone)}
                    title={phone ? `Phone: ${phone}` : name}
                  >
                    {name.length > 14 ? `${name.slice(0, 12)}…` : name}
                  </button>
                ))
              ) : (
                <>
                  <button
                    type="button"
                    className="chip-preset-btn"
                    onClick={() => applyCustomerPreset("Local Cafe & Restaurant", "0911223344")}
                  >
                    Cafe / Hotel
                  </button>
                  <button
                    type="button"
                    className="chip-preset-btn"
                    onClick={() => applyCustomerPreset("Car Wash Station", "0912987654")}
                  >
                    Car Wash
                  </button>
                </>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="form-double-col">
              <div className="field-group">
                <label className="field-label">
                  <User size={13} />
                  <span>Customer Name</span>
                </label>
                <input
                  type="text"
                  list="pos-customer-datalist"
                  className="field-input"
                  placeholder="e.g. Almaz or Cafe X"
                  value={customerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerName(val);
                    const match = recentCustomers.find(([n]) => n.toLowerCase() === val.toLowerCase());
                    if (match && match[1] && !customerPhone) {
                      setCustomerPhone(match[1]);
                    }
                  }}
                />
                <datalist id="pos-customer-datalist">
                  {recentCustomers.map(([name]) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="field-group">
                <label className="field-label">
                  <Phone size={13} />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  className="field-input"
                  placeholder="09..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="field-group">
              <label className="field-label">
                <CreditCard size={13} />
                <span>Payment Channel</span>
              </label>
              <div className="payment-grid-v2">
                <button
                  type="button"
                  className={`payment-tab ${paymentMethod === "Cash" ? "tab-active tab-cash" : ""}`}
                  onClick={() => {
                    soundFX.playPop();
                    setPaymentMethod("Cash");
                  }}
                >
                  <Banknote size={18} />
                  <span>Cash (ጥሬ)</span>
                </button>

                <button
                  type="button"
                  className={`payment-tab ${paymentMethod === "Telebirr" ? "tab-active tab-telebirr" : ""}`}
                  onClick={() => {
                    soundFX.playPop();
                    setPaymentMethod("Telebirr");
                  }}
                >
                  <Smartphone size={18} />
                  <span>Telebirr</span>
                </button>

                <button
                  type="button"
                  className={`payment-tab ${paymentMethod === "CBE Birr" ? "tab-active tab-cbe" : ""}`}
                  onClick={() => {
                    soundFX.playPop();
                    setPaymentMethod("CBE Birr");
                  }}
                >
                  <CreditCard size={18} />
                  <span>CBE Birr</span>
                </button>

                <button
                  type="button"
                  className={`payment-tab ${paymentMethod === "Credit" ? "tab-active tab-credit" : ""}`}
                  onClick={() => {
                    soundFX.playPop();
                    setPaymentMethod("Credit");
                  }}
                >
                  <BookOpen size={18} />
                  <span>Credit (ዕዳ)</span>
                </button>
              </div>
            </div>

            {/* Cash Tendered & Change Due Calculator (When Cash is selected) */}
            {paymentMethod === "Cash" && (
              <div className="cash-tender-card animate-fade">
                <div className="cash-tender-header">
                  <Banknote size={14} className="text-emerald" />
                  <strong>Cash Tender & Change Due (ጥሬ ገንዘብ & መልስ)</strong>
                </div>
                <div className="cash-quick-denominations">
                  <button
                    type="button"
                    className="btn-quick-denom"
                    onClick={() => {
                      soundFX.playBeep();
                      setCashTendered(finalTotal > 0 ? finalTotal.toFixed(0) : "0");
                    }}
                  >
                    Exact ({finalTotal > 0 ? finalTotal.toFixed(0) : 0})
                  </button>
                  {[100, 200, 500, 1000].map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      className="btn-quick-denom"
                      onClick={() => {
                        soundFX.playBeep();
                        setCashTendered(denom.toString());
                      }}
                    >
                      {denom} {currency}
                    </button>
                  ))}
                </div>
                <div className="cash-input-and-change-row">
                  <div className="cash-tender-input-wrap">
                    <label className="cash-sublabel">Amount Received ({currency})</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder={`e.g. ${finalTotal > 0 ? Math.ceil(finalTotal / 100) * 100 : 500}`}
                      className="cash-received-input"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                    />
                  </div>
                  <div className={`change-due-box ${changeDue > 0 ? "change-positive" : ""}`}>
                    <span className="change-due-label">CHANGE TO RETURN</span>
                    <strong className="change-due-amount">
                      {changeDue.toFixed(2)} <span className="change-cur">{currency}</span>
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* If Credit selected: Due Date */}
            {paymentMethod === "Credit" && (
              <div className="credit-schedule-banner animate-pop">
                <div className="credit-banner-title">
                  <AlertCircle size={15} />
                  <strong>Customer Debt Entry (ዕዳ)</strong>
                </div>
                <p className="credit-banner-text">
                  This transaction will be recorded under Customer Debts tab.
                </p>
                <div className="field-group" style={{ marginTop: "6px" }}>
                  <label className="field-label">Repayment Due Date</label>
                  <input
                    type="date"
                    required
                    className="field-input"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Discount & BYOC Quick Toggle */}
            <div className="form-double-col">
              <div className="field-group">
                <div className="discount-label-row">
                  <label className="field-label">
                    <Percent size={13} />
                    <span>Discount ({currency})</span>
                  </label>
                  <button
                    type="button"
                    className={`btn-byoc-toggle ${byocDiscountActive ? "byoc-active" : ""}`}
                    onClick={toggleByocDiscount}
                    title="Toggle 5 ETB Bring Your Own Bottle discount"
                  >
                    🌿 Own Bottle (-5)
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="5"
                  className="field-input"
                  placeholder="0"
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <Tag size={13} />
                  <span>Receipt Note</span>
                </label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Optional memo..."
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Totals Summary Box */}
            <div className="cart-total-box-v2">
              <div className="total-row-v2">
                <span>Subtotal ({totalLiters.toFixed(1)} Liters)</span>
                <span>{subtotal.toFixed(2)} {currency}</span>
              </div>

              {Number(discountAmount) > 0 && (
                <div className="total-row-v2 text-emerald">
                  <span>Discount Given {byocDiscountActive && "(Own Bottle)"}</span>
                  <span>-{Number(discountAmount).toFixed(2)} {currency}</span>
                </div>
              )}

              <div className="total-grand-row-v2">
                <span className="grand-label">TOTAL PAYABLE</span>
                <span className="grand-number">
                  {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className="grand-cur"> {currency}</span>
                </span>
              </div>

              <div className="margin-indicator-v2">
                <span>Gross Margin:</span>
                <strong className="text-emerald">+{estimatedProfit.toFixed(2)} {currency}</strong>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              type="submit"
              disabled={cart.length === 0}
              className={`btn-checkout-v2 ${cart.length > 0 ? "btn-checkout-active" : ""} ${
                paymentMethod === "Credit" ? "btn-credit-active" : ""
              }`}
            >
              <CheckCircle size={20} />
              <span>
                {paymentMethod === "Credit"
                  ? `Save Credit Sale • ${finalTotal.toFixed(2)} ${currency}`
                  : `Complete Sale & Print Receipt • ${finalTotal.toFixed(2)} ${currency}`}
              </span>
            </button>
          </form>
        </div>
      </section>

      {/* Station Refill Quick Modal */}
      {refillModalProduct && (
        <div className="modal-backdrop animate-fade">
          <div className="modal-box animate-pop">
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="stat-icon-wrapper stat-cyan">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Refill {refillModalProduct.name}</h3>
                  <p className="modal-subtitle">Quick tank refill from newly brewed batch</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setRefillModalProduct(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmStationRefill} className="modal-form">
              <div className="tank-read-only">
                Current Tank: <strong>{refillModalProduct.stockLiters.toFixed(1)} Liters</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Liters to Add to Tank</label>
                <div className="quick-pay-buttons">
                  {[50, 100, 200].map((liters) => (
                    <button
                      key={liters}
                      type="button"
                      className="btn-quick-amount"
                      onClick={() => setRefillAmount(liters)}
                    >
                      +{liters}L Barrel
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="5"
                  min="1"
                  required
                  className="form-input"
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setRefillModalProduct(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <CheckCircle size={18} />
                  <span>Confirm Refill (+{refillAmount}L)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
