import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, X, Check, Copy, MapPin, Phone } from "lucide-react";
import {
  formatEthiopianDate,
  formatEthiopianTime,
} from "../utils/ethiopianDate";
import PaymentQRCode from "./common/PaymentQRCode";

export default function ReceiptModal({ receipt, config = {}, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!receipt) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [receipt, onClose]);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalLiters =
    receipt.items?.reduce((acc, item) => acc + (item.liters || 0), 0) || receipt.totalLiters || 0;

  const ethDateFormatted = `${formatEthiopianDate(receipt.date, "medium")} ${formatEthiopianTime(receipt.date, false)}`;
  const creditDueFormatted = receipt.creditDueDate
    ? formatEthiopianDate(receipt.creditDueDate, "medium") || receipt.creditDueDate
    : "Within 7 Days (በ7 ቀናት ውስጥ)";

  const handleCopyText = () => {
    const lines = [
      `🧾 ${config.shopName || "Sukie"} Receipt #${receipt.id}`,
      `Date (ቀን): ${ethDateFormatted} (${new Date(receipt.date).toLocaleDateString()})`,
      `Customer: ${receipt.customerName || "Customer"}`,
      `Items:`,
      ...(receipt.items?.map((i) => ` - ${i.liters}L ${i.name}: ${i.totalPrice} ${config.currency}`) || []),
      `Total: ${receipt.total} ${config.currency} (${receipt.paymentMethod})`,
      receipt.cashTendered ? `Cash Received: ${receipt.cashTendered} ${config.currency} | Change: ${receipt.changeDue || 0} ${config.currency}` : null,
      receipt.paymentMethod === "Credit" ? `⚠️ Store Credit Due: ${creditDueFormatted}` : null,
      config.receiptFooter || "Thank you!",
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const modalContent = (
    <div className="receipt-modal-backdrop animate-fade" onClick={onClose}>
      <div
        className="receipt-modal-dialog animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print receipt-modal-actions-bar">
          <button className="btn-print-receipt" onClick={handlePrint}>
            <Printer size={18} />
            <span>Print Receipt</span>
          </button>
          <button className="btn-secondary" onClick={handleCopyText} title="Copy Receipt for SMS/WhatsApp">
            {copied ? <Check size={16} className="text-emerald" /> : <Copy size={16} />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>
          <button className="btn-close-receipt" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>


        {/* Realistic POS Thermal Receipt Paper */}
        <div className="receipt-paper receipt-container">
          {/* Header */}
          <div className="receipt-header">
            <div className="receipt-logo-icon">🫧</div>
            <h2 className="receipt-shop-title">{config.shopName || "Sukie Liquid Soap"}</h2>
            <p className="receipt-tagline">{config.tagline || "Quality Detergents & Cleansers"}</p>
            <div className="receipt-contact-info">
              {config.address && (
                <div className="contact-line">
                  <MapPin size={12} /> {config.address}
                </div>
              )}
              {config.phone && (
                <div className="contact-line">
                  <Phone size={12} /> {config.phone}
                </div>
              )}
            </div>
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Receipt Info */}
          <div className="receipt-meta">
            <div className="meta-row">
              <span className="meta-label">Receipt #:</span>
              <strong className="meta-val">{receipt.id}</strong>
            </div>
            <div className="meta-row">
              <span className="meta-label">Date (ቀን):</span>
              <strong className="meta-val">{formatEthiopianDate(receipt.date, "medium")}</strong>
            </div>
            <div className="meta-row">
              <span className="meta-label">Time (ሰዓት):</span>
              <span className="meta-val">
                {formatEthiopianTime(receipt.date, false)}
                <span style={{ fontSize: "0.74rem", color: "#64748b", marginLeft: "6px" }}>
                  ({new Date(receipt.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })})
                </span>
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Cashier:</span>
              <span className="meta-val">{config.ownerName || "Staff"}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Customer:</span>
              <strong className="meta-val">{receipt.customerName || "Walk-in Customer"}</strong>
            </div>
            {receipt.customerPhone && receipt.customerPhone !== "N/A" && (
              <div className="meta-row">
                <span className="meta-label">Phone:</span>
                <span className="meta-val">{receipt.customerPhone}</span>
              </div>
            )}
            <div className="meta-row">
              <span className="meta-label">Payment:</span>
              <span className="receipt-badge-method">{receipt.paymentMethod}</span>
            </div>
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Items Table */}
          <div className="receipt-items-table">
            <div className="receipt-item-header">
              <span className="col-desc">Soap Item</span>
              <span className="col-qty">Liters</span>
              <span className="col-rate">Price</span>
              <span className="col-total">Total</span>
            </div>
            <div className="receipt-divider-solid"></div>

            {receipt.items?.map((item, index) => (
              <div key={index} className="receipt-item-row">
                <div className="item-name-block">
                  <span className="item-name">{item.name}</span>
                  {item.scent && <span className="item-scent-micro">({item.scent})</span>}
                </div>
                <span className="item-qty">{item.liters.toFixed(1)} L</span>
                <span className="item-rate">{item.pricePerLiter}</span>
                <span className="item-line-total">{item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="receipt-divider-solid"></div>

          {/* Totals */}
          <div className="receipt-totals">
            <div className="receipt-total-line">
              <span>Total Volume Dispensed:</span>
              <strong>{totalLiters.toFixed(1)} Liters</strong>
            </div>
            <div className="receipt-total-line">
              <span>Subtotal:</span>
              <span>
                {receipt.subtotal ? receipt.subtotal.toFixed(2) : receipt.total.toFixed(2)}{" "}
                {config.currency}
              </span>
            </div>
            {receipt.discount > 0 && (
              <div className="receipt-total-line text-emerald">
                <span>Discount:</span>
                <span>
                  -{receipt.discount.toFixed(2)} {config.currency}
                </span>
              </div>
            )}

            {/* Authentic Rubber Stamp Watermark */}
            <div className="receipt-stamp-container">
              {receipt.paymentMethod === "Credit" ? (
                <div className="receipt-stamp-watermark stamp-credit">
                  <span>STORE CREDIT • ዕዳ</span>
                </div>
              ) : (
                <div className="receipt-stamp-watermark stamp-paid">
                  <span>✓ PAID • ተከፍሏል</span>
                </div>
              )}
            </div>

            <div className="receipt-total-line grand-total">
              <span>TOTAL PAID / DUE:</span>
              <span>
                {receipt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                {config.currency}
              </span>
            </div>

            {receipt.cashTendered != null && (
              <>
                <div className="receipt-total-line text-subtle">
                  <span>Cash Received (ጥሬ ገንዘብ):</span>
                  <span>
                    {Number(receipt.cashTendered).toFixed(2)} {config.currency}
                  </span>
                </div>
                <div className="receipt-total-line text-emerald font-semibold">
                  <span>Change Given (መልስ):</span>
                  <span>
                    {Number(receipt.changeDue || 0).toFixed(2)} {config.currency}
                  </span>
                </div>
              </>
            )}

            {/* Credit Notice if unpaid */}
            {receipt.paymentMethod === "Credit" && (
              <div className="receipt-credit-alert">
                <strong>*** SOLD ON STORE CREDIT (ዕዳ) ***</strong>
                <p>
                  Promised Repayment Due: <strong>{creditDueFormatted}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Footer & Barcode */}
          <div className="receipt-footer">
            <p className="receipt-thanks">
              {config.receiptFooter || "Thank you for shopping with us! አመሰግናለሁ!"}
            </p>
            {/* Dynamic Scannable Payment & Verification QR Code */}
            <PaymentQRCode
              receiptId={receipt.id}
              totalAmount={receipt.total}
              paymentMethod={receipt.paymentMethod || "Telebirr"}
              accountPhone={config.phone || "+251911000000"}
              shopName={config.shopName || "Sukie"}
              currency={config.currency || "ETB"}
            />

            <span className="receipt-id-sub">TXN #{receipt.id}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
