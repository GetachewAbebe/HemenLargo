import React from "react";
import { User, Phone } from "lucide-react";
import { soundFX } from "../../utils/audio";

export default function CustomerSection({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  recentCustomers = [],
}) {
  const applyPreset = (name, phone) => {
    soundFX.playPop();
    setCustomerName(name);
    setCustomerPhone(phone || "");
  };

  return (
    <>
      {/* Quick Repeat Customer Chips */}
      <div className="quick-chips-row">
        <span className="chips-label">Quick Client:</span>
        <button
          type="button"
          className="chip-preset-btn"
          onClick={() => applyPreset("Walk-in Customer", "")}
        >
          Walk-in
        </button>
        {recentCustomers.length > 0 ? (
          recentCustomers.map(([name, phone]) => (
            <button
              key={name}
              type="button"
              className="chip-preset-btn"
              onClick={() => applyPreset(name, phone)}
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
              onClick={() => applyPreset("Local Cafe & Restaurant", "0911223344")}
            >
              Cafe / Hotel
            </button>
            <button
              type="button"
              className="chip-preset-btn"
              onClick={() => applyPreset("Car Wash Station", "0912987654")}
            >
              Car Wash
            </button>
          </>
        )}
      </div>

      {/* Customer Name & Phone Fields */}
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
    </>
  );
}
