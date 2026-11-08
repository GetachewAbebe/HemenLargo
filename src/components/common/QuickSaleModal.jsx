import React from "react";
import Modal from "./Modal";
import SimpleSaleRegister from "../pos/SimpleSaleRegister";
import { Zap } from "lucide-react";

export default function QuickSaleModal({
  isOpen,
  onClose,
  products = [],
  sales = [],
  currency = "ETB",
  onCompleteSale,
  preselectedProductId = null,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Instant Sales Counter (ቀላል ሽያጭ)"
      subtitle="Register customer sale in seconds without leaving your current screen"
      icon={Zap}
      maxWidth="680px"
      className="quick-sale-modal-box"
    >
      <div className="quick-sale-modal-content">
        <SimpleSaleRegister
          products={products}
          currency={currency}
          sales={sales}
          onCompleteSale={onCompleteSale}
          onClose={onClose}
          isModal={true}
          preselectedProductId={preselectedProductId}
        />
      </div>
    </Modal>
  );
}

