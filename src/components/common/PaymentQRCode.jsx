import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Smartphone } from "lucide-react";

export default function PaymentQRCode({
  receiptId,
  totalAmount,
  paymentMethod = "Telebirr",
  accountPhone = "+251911000000",
  shopName = "Sukie Soap",
  currency = "ETB",
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  const payload = useMemoQrPayload(receiptId, totalAmount, paymentMethod, accountPhone, shopName, currency);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => console.warn("Failed to generate QR code:", err));

    return () => {
      isMounted = false;
    };
  }, [payload]);

  const isDigital = paymentMethod === "Telebirr" || paymentMethod === "CBE Birr";

  return (
    <div className="receipt-qr-section">
      <div className="qr-badge-title">
        {isDigital ? (
          <>
            <Smartphone size={12} />
            <span>Scan to Pay with {paymentMethod} (በስልክ ይክፈሉ)</span>
          </>
        ) : (
          <>
            <QrCode size={12} />
            <span>Receipt Verification & Telebirr QR</span>
          </>
        )}
      </div>

      {qrDataUrl ? (
        <div className="qr-image-wrapper">
          <img
            src={qrDataUrl}
            alt={`${paymentMethod} Payment QR Code`}
            className="receipt-qr-img"
            width={120}
            height={120}
          />
        </div>
      ) : (
        <div className="qr-placeholder-loading">Generating QR...</div>
      )}

      <div className="qr-account-info">
        <span className="qr-channel-name">{paymentMethod}: <strong>{accountPhone}</strong></span>
        <span className="qr-amount-text">
          Amount: <strong>{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</strong>
        </span>
      </div>
    </div>
  );
}

function useMemoQrPayload(receiptId, totalAmount, paymentMethod, accountPhone, shopName, currency) {
  return React.useMemo(() => {
    // Standard structured payment URI / payload scanned by Ethiopian banking & camera apps
    if (paymentMethod === "Telebirr") {
      return `telebirr://pay?phone=${encodeURIComponent(accountPhone)}&amount=${totalAmount}&ref=${receiptId}&shop=${encodeURIComponent(shopName)}`;
    }
    if (paymentMethod === "CBE Birr") {
      return `cbebirr://pay?account=${encodeURIComponent(accountPhone)}&amount=${totalAmount}&ref=${receiptId}&shop=${encodeURIComponent(shopName)}`;
    }
    // Default verification payload for cash or receipts
    return `SUKIE-POS:${receiptId}|TOTAL:${totalAmount}${currency}|SHOP:${shopName}|PHONE:${accountPhone}`;
  }, [receiptId, totalAmount, paymentMethod, accountPhone, shopName, currency]);
}
