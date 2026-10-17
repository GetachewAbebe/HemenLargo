import React, { useState, useMemo } from "react";
import {
  Plus,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  Tag,
  Zap,
  Percent,
} from "lucide-react";
import { soundFX } from "../utils/audio";
import { useApp } from "../context";
import DispenserStation from "./pos/DispenserStation";
import CartItemList from "./pos/CartItemList";
import CustomerSection from "./pos/CustomerSection";
import CashTenderCard from "./pos/CashTenderCard";
import QuickRefillModal from "./pos/QuickRefillModal";

export default function POSView(props) {
  const context = useApp();
  const products = props.products ?? context.products;
  const sales = props.sales ?? context.sales;
  const debts = props.debts ?? context.debts;
  const currency = props.currency ?? context.currency;
  const onCompleteSale = props.onCompleteSale ?? context.handleCompleteSale;
  const onRestockLiters = props.onRestockLiters ?? context.handleRestockLiters;

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

  // Inline Quick Refill Modal
  const [refillModalProduct, setRefillModalProduct] = useState(null);
  const [refillAmount, setRefillAmount] = useState(100);

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
    const largo = products.find(
      (p) =>
        p.id === "prod-largo" ||
        p.id === "prod-1" ||
        p.name.includes("Largo") ||
        p.name.includes("ላርጎ")
    );
    const barikina = products.find(
      (p) =>
        p.id === "prod-berekina" ||
        p.id === "prod-2" ||
        p.name.includes("Barikina") ||
        p.name.includes("Berekina") ||
        p.name.includes("በረኪና")
    );

    if (largo && barikina) {
      addToCart(largo, 5);
      addToCart(barikina, 2);
    }
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
          <button type="button" className="btn-add-combo" onClick={handleAddCombo}>
            <Plus size={15} />
            <span>+ Add Combo to Bill</span>
          </button>
        </div>

        {/* The Two Dedicated Product Dispenser Stations */}
        <div className="stations-grid">
          {products.map((prod) => (
            <DispenserStation
              key={prod.id}
              product={prod}
              currency={currency}
              customLiterVal={customLiters[prod.id] || ""}
              onCustomLiterChange={(val) => setCustomLiters({ ...customLiters, [prod.id]: val })}
              onAddToCart={addToCart}
              onOpenRefillModal={(p) => {
                setRefillModalProduct(p);
                setRefillAmount(100);
              }}
            />
          ))}
        </div>
      </section>

      {/* RIGHT COLUMN: The Sticky Counter Register Cart */}
      <section className="pos-cart-col">
        <div className="cart-card-v2">
          {/* Cart Header */}
          <div className="cart-header-v2">
            <div>
              <h3 className="cart-title-v2">Current Refill Bill</h3>
              <span className="cart-subtitle-v2">
                {cart.length} {cart.length === 1 ? "Soap item" : "Soap items"} • {totalLiters.toFixed(1)} Liters
              </span>
            </div>
            {cart.length > 0 && (
              <button type="button" className="btn-clear-cart" onClick={clearCart} title="Clear cart">
                Reset
              </button>
            )}
          </div>

          {/* Validation Alert */}
          {errorMessage && (
            <div className="pos-error-banner animate-pop">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="cart-items-scroll">
            <CartItemList
              cart={cart}
              currency={currency}
              onUpdateLiters={updateCartLiters}
              onRemoveItem={removeFromCart}
            />
          </div>

          {/* Customer & Checkout Form */}
          <form className="cart-checkout-form" onSubmit={handleCheckout}>
            <CustomerSection
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              recentCustomers={recentCustomers}
            />

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

            {/* Cash Tendered & Change Due Calculator */}
            {paymentMethod === "Cash" && (
              <CashTenderCard
                finalTotal={finalTotal}
                cashTendered={cashTendered}
                setCashTendered={setCashTendered}
                changeDue={changeDue}
                currency={currency}
              />
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
      <QuickRefillModal
        product={refillModalProduct}
        refillAmount={refillAmount}
        setRefillAmount={setRefillAmount}
        onConfirm={handleConfirmStationRefill}
        onClose={() => setRefillModalProduct(null)}
      />
    </div>
  );
}
