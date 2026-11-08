import React, { useState, useMemo } from "react";
import { soundFX } from "../../utils/audio";
import { formatEthiopianDate, formatEthiopianTime } from "../../utils/ethiopianDate";
import { createRecordId } from "../../utils/ids";

function generateReceiptId() {
  const d = new Date();
  const datePart = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return createRecordId(`REC-${datePart}`);
}

const COMMON_QUICK_LITERS = [1, 2, 3, 5, 10, 20];
const CASH_QUICK_AMOUNTS = [100, 200, 500, 1000];

export default function SimpleSaleRegister({
  products = [],
  currency = "ETB",
  sales = [],
  onCompleteSale,
  onClose,
  isModal = false,
  preselectedProductId = null,
}) {
  // Currently active product selection
  const [selectedProductId, setSelectedProductId] = useState(() => {
    if (preselectedProductId && products.some((p) => p.id === preselectedProductId)) {
      return preselectedProductId;
    }
    return products[0]?.id || "";
  });

  // Liters for current item
  const [liters, setLiters] = useState(5); // Default to popular 5L gallon
  const [customLitersInput, setCustomLitersInput] = useState("5");

  // Multi-item cart list (can hold 1 or more items)
  const [cartItems, setCartItems] = useState([]);

  // Customer info
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomerFields, setShowCustomerFields] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // 'Cash' | 'Telebirr' | 'CBE Birr' | 'Credit'
  const [cashTendered, setCashTendered] = useState("");

  // Notes and discounts
  const [discount, setDiscount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const [referenceDate] = useState(() => new Date());

  // Active product object
  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  // Quick repeat customer suggestions from past sales
  const recentCustomers = useMemo(() => {
    const map = new Map();
    sales.forEach((item) => {
      if (
        item.customerName &&
        item.customerName !== "Walk-in Customer" &&
        !map.has(item.customerName)
      ) {
        map.set(
          item.customerName,
          item.customerPhone && item.customerPhone !== "N/A" ? item.customerPhone : ""
        );
      }
    });
    return Array.from(map.entries()).slice(0, 4);
  }, [sales]);

  // Handle setting liters from quick buttons
  const handleSelectLiters = (val) => {
    soundFX.playPop();
    setErrorMessage("");
    setLiters(val);
    setCustomLitersInput(String(val));
  };

  // Stepper increment / decrement
  const handleStepLiters = (delta) => {
    soundFX.playPop();
    setErrorMessage("");
    const next = Math.max(0.5, Number((liters + delta).toFixed(2)));
    setLiters(next);
    setCustomLitersInput(String(next));
  };

  // Add current configured item into the cart
  const handleAddItemToCart = () => {
    if (!activeProduct) return;
    const qty = parseFloat(customLitersInput);
    if (!qty || qty <= 0) {
      setErrorMessage("Please enter a valid liter quantity.");
      return;
    }

    if (qty > activeProduct.stockLiters) {
      soundFX.playWarning();
      setErrorMessage(
        `Only ${activeProduct.stockLiters.toFixed(1)}L available in ${activeProduct.name} tank.`
      );
      return;
    }

    soundFX.playPop();
    setErrorMessage("");

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === activeProduct.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newTotalLiters = updated[existingIdx].liters + qty;
        if (newTotalLiters > activeProduct.stockLiters) {
          soundFX.playWarning();
          setErrorMessage(
            `Total (${newTotalLiters}L) exceeds tank stock (${activeProduct.stockLiters}L).`
          );
          return prev;
        }
        updated[existingIdx] = {
          ...updated[existingIdx],
          liters: Number(newTotalLiters.toFixed(2)),
          totalPrice: Number((newTotalLiters * activeProduct.pricePerLiter).toFixed(2)),
          totalCost: Number((newTotalLiters * (activeProduct.costPerLiter || 0)).toFixed(2)),
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: activeProduct.id,
          name: activeProduct.name,
          localName: activeProduct.localName || "",
          pricePerLiter: activeProduct.pricePerLiter,
          costPerLiter: activeProduct.costPerLiter || 0,
          liters: Number(qty.toFixed(2)),
          totalPrice: Number((qty * activeProduct.pricePerLiter).toFixed(2)),
          totalCost: Number((qty * (activeProduct.costPerLiter || 0)).toFixed(2)),
          color: activeProduct.color || "#0d9488",
          scent: activeProduct.scent || "",
        },
      ];
    });
  };

  // Remove item from cart
  const handleRemoveCartItem = (productId) => {
    soundFX.playTrash();
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Resolve active items: If cart has items, use cart. Otherwise, use current single item!
  const effectiveItems = useMemo(() => {
    if (cartItems.length > 0) return cartItems;
    if (!activeProduct) return [];
    const qty = parseFloat(customLitersInput) || liters;
    return [
      {
        productId: activeProduct.id,
        name: activeProduct.name,
        localName: activeProduct.localName || "",
        pricePerLiter: activeProduct.pricePerLiter,
        costPerLiter: activeProduct.costPerLiter || 0,
        liters: Number(qty.toFixed(2)),
        totalPrice: Number((qty * activeProduct.pricePerLiter).toFixed(2)),
        totalCost: Number((qty * (activeProduct.costPerLiter || 0)).toFixed(2)),
        color: activeProduct.color || "#0d9488",
        scent: activeProduct.scent || "",
      },
    ];
  }, [cartItems, activeProduct, customLitersInput, liters]);

  // Financial totals
  const subtotal = useMemo(() => {
    return effectiveItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
  }, [effectiveItems]);

  const totalCost = useMemo(() => {
    return effectiveItems.reduce((acc, i) => acc + (i.totalCost || 0), 0);
  }, [effectiveItems]);

  const totalLiters = useMemo(() => {
    return effectiveItems.reduce((acc, i) => acc + (i.liters || 0), 0);
  }, [effectiveItems]);

  const finalTotal = Math.max(0, subtotal - (Number(discount) || 0));
  const estimatedProfit = Math.max(0, finalTotal - totalCost);

  // Cash change due
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = cashNum > finalTotal ? Number((cashNum - finalTotal).toFixed(2)) : 0;

  // Complete & Submit Sale
  const handleRegisterSale = (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (effectiveItems.length === 0 || totalLiters <= 0) {
      soundFX.playWarning();
      setErrorMessage("Please enter liters to register sale.");
      return;
    }

    // Check stock for each item
    for (const item of effectiveItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && item.liters > prod.stockLiters) {
        soundFX.playWarning();
        setErrorMessage(
          `Insufficient stock for "${prod.name}". Available: ${prod.stockLiters.toFixed(1)}L, Requested: ${item.liters}L.`
        );
        return;
      }
    }

    soundFX.playCheckoutChime();

    const saleRecord = {
      id: generateReceiptId(),
      date: new Date().toISOString(),
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim() || "N/A",
      paymentMethod,
      items: effectiveItems,
      subtotal,
      discount: Number(discount) || 0,
      total: finalTotal,
      profit: estimatedProfit,
      totalLiters,
      cashTendered: paymentMethod === "Cash" && cashNum > 0 ? cashNum : null,
      changeDue: paymentMethod === "Cash" && cashNum > 0 ? changeDue : null,
      note: "Quick sale registration",
      status: paymentMethod === "Credit" ? "Credit" : "Completed",
    };

    if (onCompleteSale) {
      onCompleteSale(saleRecord);
    }

    // Reset fields for next fast registration
    setCartItems([]);
    setLiters(5);
    setCustomLitersInput("5");
    setCashTendered("");
    setDiscount(0);
    setCustomerName("Walk-in Customer");
    setCustomerPhone("");

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`simple-sale-register-card ${isModal ? "register-modal-inner" : ""}`}>
      {/* 1. Header Bar */}
      <div className="simple-sale-header">
        <div className="simple-sale-title-group">
          <div>
            <h3 className="simple-sale-title">Quick Sale Registration (ቀላል የሽያጭ መመዝገቢያ)</h3>
            <span className="simple-sale-subtitle">
              Register soap sales in seconds • ፈጣን የችርቻሮ ሽያጭ መመዝገቢያ
            </span>
          </div>
        </div>

        <div className="simple-sale-date-chip">
          <span className="pulse-dot-green"></span>
          <span>{formatEthiopianDate(referenceDate, "short")}</span>
          <span className="chip-time">{formatEthiopianTime(referenceDate)}</span>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="simple-sale-alert-error animate-pop">
          <span className="simple-alert-tag">[!]</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Step 1: Product Selection Tabs */}
      <div className="simple-sale-section">
        <label className="simple-step-label">
          <span className="step-num">1</span>
          <span>Select Soap Product (ፈሳሽ ይምረጡ):</span>
        </label>

        <div className="simple-products-pill-grid">
          {products.map((prod) => {
            const isSelected = prod.id === selectedProductId;
            const isLowStock = prod.stockLiters <= (prod.minStockAlert || 40);

            return (
              <button
                key={prod.id}
                type="button"
                className={`simple-product-card ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedProductId(prod.id);
                  setErrorMessage("");
                }}
                style={{
                  "--prod-color": prod.color || "#0d9488",
                }}
              >
                <div className="simple-prod-top">
                  <span
                    className="simple-prod-dot"
                    style={{ backgroundColor: prod.color || "#0d9488" }}
                  />
                  <span className="simple-prod-rate">
                    {prod.pricePerLiter} {currency}/L
                  </span>
                </div>

                <strong className="simple-prod-name">{prod.name}</strong>
                <span className="simple-prod-stock">
                  Stock: <strong>{prod.stockLiters.toFixed(1)}L</strong>
                  {isLowStock && <span className="simple-low-stock-dot" title="Low stock"></span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Step 2: Volume / Liters Selection */}
      <div className="simple-sale-section">
        <div className="section-title-with-stock">
          <label className="simple-step-label">
            <span className="step-num">2</span>
            <span>Quantity / Volume (የፈሳሽ መጠን በሊትር):</span>
          </label>
          {activeProduct && (
            <span className="available-stock-text">
              Available in tank: <strong>{activeProduct.stockLiters.toFixed(1)} Liters</strong>
            </span>
          )}
        </div>

        {/* Quick Liters Preset Buttons */}
        <div className="quick-liters-row">
          {COMMON_QUICK_LITERS.map((q) => {
            const isCurrent = Number(customLitersInput) === q && cartItems.length === 0;
            const priceForQ = activeProduct ? q * activeProduct.pricePerLiter : 0;
            return (
              <button
                key={q}
                type="button"
                className={`quick-liter-btn ${isCurrent ? "active-liter" : ""}`}
                onClick={() => handleSelectLiters(q)}
                disabled={activeProduct && q > activeProduct.stockLiters}
              >
                <span className="liter-val">{q}L</span>
                <span className="liter-cost">{priceForQ} {currency}</span>
              </button>
            );
          })}
        </div>

        {/* Stepper & Numeric Custom Input */}
        <div className="custom-liters-stepper-wrap">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleStepLiters(-1)}
            title="Minus 1 liter"
          >
            -
          </button>

          <div className="stepper-input-box">
            <input
              type="number"
              step="0.5"
              min="0.1"
              className="stepper-num-input"
              value={customLitersInput}
              onChange={(e) => {
                setCustomLitersInput(e.target.value);
                setLiters(parseFloat(e.target.value) || 0);
                setErrorMessage("");
              }}
              placeholder="Liters"
            />
            <span className="stepper-unit">Liters</span>
          </div>

          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleStepLiters(1)}
            title="Plus 1 liter"
          >
            +
          </button>

          <button
            type="button"
            className="btn-add-another-item"
            onClick={handleAddItemToCart}
            title="Add this item to an order with multiple products"
          >
            <span>+ Add to Order</span>
          </button>
        </div>

        {/* Multi-Item Order Cart Pill List (if multiple items queued) */}
        {cartItems.length > 0 && (
          <div className="simple-cart-chips-row animate-fade">
            <span className="cart-chips-title">Current Order Items:</span>
            {cartItems.map((item) => (
              <span key={item.productId} className="simple-order-item-chip">
                <span>
                  {item.liters}L {item.name} = <strong>{item.totalPrice} {currency}</strong>
                </span>
                <button
                  type="button"
                  className="btn-chip-remove"
                  onClick={() => handleRemoveCartItem(item.productId)}
                  title="Remove item"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Step 3: Payment Method */}
      <div className="simple-sale-section">
        <label className="simple-step-label">
          <span className="step-num">3</span>
          <span>Payment Method (የክፍያ ዘዴ):</span>
        </label>

        <div className="payment-methods-grid">
          <button
            type="button"
            className={`payment-method-card cash ${paymentMethod === "Cash" ? "selected" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setPaymentMethod("Cash");
            }}
          >
            <span>Cash (ጥሬ ገንዘብ)</span>
          </button>

          <button
            type="button"
            className={`payment-method-card telebirr ${paymentMethod === "Telebirr" ? "selected" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setPaymentMethod("Telebirr");
            }}
          >
            <span>Telebirr (ቴሌብር)</span>
          </button>

          <button
            type="button"
            className={`payment-method-card cbe ${paymentMethod === "CBE Birr" ? "selected" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setPaymentMethod("CBE Birr");
            }}
          >
            <span>CBE Birr (ሲቢኢ)</span>
          </button>

          <button
            type="button"
            className={`payment-method-card credit ${paymentMethod === "Credit" ? "selected" : ""}`}
            onClick={() => {
              soundFX.playPop();
              setPaymentMethod("Credit");
            }}
          >
            <span>Credit (በብድር)</span>
          </button>
        </div>

        {/* If Cash: Quick Tender & Change Calculator */}
        {paymentMethod === "Cash" && (
          <div className="cash-tender-simple-row animate-fade">
            <span className="tender-label">Cash Received:</span>
            <div className="cash-quick-chips">
              <button
                type="button"
                className={`tender-chip ${cashNum === finalTotal ? "active" : ""}`}
                onClick={() => setCashTendered(String(finalTotal))}
              >
                Exact ({finalTotal} {currency})
              </button>
              {CASH_QUICK_AMOUNTS.filter((amt) => amt >= finalTotal).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`tender-chip ${cashNum === amt ? "active" : ""}`}
                  onClick={() => setCashTendered(String(amt))}
                >
                  {amt} {currency}
                </button>
              ))}
            </div>

            <div className="cash-input-and-change">
              <input
                type="number"
                className="cash-input-field"
                placeholder="Other amount..."
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
              />
              {changeDue > 0 && (
                <span className="change-due-badge animate-pop">
                  Change: <strong>{changeDue.toFixed(2)} {currency}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Customer & Optional Details (Collapsible for speed) */}
      <div className="simple-sale-section simple-customer-section">
        <div className="customer-toggle-row">
          <div className="customer-chips-quick">
            <button
              type="button"
              className={`chip-customer ${customerName === "Walk-in Customer" ? "active" : ""}`}
              onClick={() => {
                setCustomerName("Walk-in Customer");
                setCustomerPhone("");
              }}
            >
              Walk-in (መደበኛ)
            </button>

            {recentCustomers.map(([name, phone]) => (
              <button
                key={name}
                type="button"
                className={`chip-customer ${customerName === name ? "active" : ""}`}
                onClick={() => {
                  setCustomerName(name);
                  setCustomerPhone(phone || "");
                }}
              >
                {name}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-toggle-extra"
            onClick={() => setShowCustomerFields(!showCustomerFields)}
          >
            {showCustomerFields ? "Hide Details" : "+ Name / Phone / Discount"}
          </button>
        </div>

        {showCustomerFields && (
          <div className="customer-expanded-fields animate-fade">
            <div className="customer-field-col">
              <label className="field-mini-label">Customer Name</label>
              <input
                type="text"
                className="simple-text-input"
                placeholder="e.g. Almaz Kebede"
                value={customerName === "Walk-in Customer" ? "" : customerName}
                onChange={(e) => setCustomerName(e.target.value || "Walk-in Customer")}
              />
            </div>

            <div className="customer-field-col">
              <label className="field-mini-label">Phone Number</label>
              <input
                type="tel"
                className="simple-text-input"
                placeholder="09..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="customer-field-col">
              <label className="field-mini-label">Discount ({currency})</label>
              <input
                type="number"
                min="0"
                className="simple-text-input"
                placeholder="0"
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Grand Total & Action Footer */}
      <div className="simple-sale-footer">
        <div className="sale-summary-pill-box">
          <div className="summary-left">
            <span className="summary-qty-text">
              Total Liters: <strong>{totalLiters.toFixed(1)} L</strong>
            </span>
            <span className="summary-items-count">
              {effectiveItems.length} {effectiveItems.length === 1 ? "Product" : "Products"}
            </span>
          </div>

          <div className="summary-right">
            <span className="summary-total-label">Grand Total:</span>
            <span className="summary-big-price">
              {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
              <span className="price-currency-unit">{currency}</span>
            </span>
          </div>
        </div>

        <div className="simple-sale-actions-row">
          {onClose && (
            <button
              type="button"
              className="btn-simple-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="btn-simple-submit"
            onClick={handleRegisterSale}
            disabled={totalLiters <= 0}
          >
            <span>
              Complete Sale • {finalTotal.toFixed(2)} {currency} (ሽያጩን አጠናቅቅ)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
