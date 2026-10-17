import React from "react";
import { Package, Check } from "lucide-react";
import Modal from "../common/Modal";

export default function AddProductModal({
  isOpen,
  onClose,
  newProduct,
  setNewProduct,
  onSubmit,
  currency = "ETB",
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Soap Formula / Product"
      subtitle="Define a new liquid detergent or specialty cleanser"
      icon={Package}
      maxWidth="600px"
    >
      <form onSubmit={onSubmit} className="modal-form">
        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Soap Name (English) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ultra Foam Dish Cleaner"
              className="form-input"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Local / Amharic Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. የዕቃ ሳሙና (ሱፐር)"
              className="form-input"
              value={newProduct.localName}
              onChange={(e) => setNewProduct({ ...newProduct, localName: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            >
              <option value="General Cleanser">General Cleanser</option>
              <option value="Kitchen & Dishes">Kitchen & Dishes</option>
              <option value="Personal Hygiene">Personal Hygiene</option>
              <option value="Laundry">Laundry</option>
              <option value="Floors & Tiles">Floors & Tiles</option>
              <option value="Sanitizer">Sanitizer / Bleach</option>
              <option value="Automotive">Automotive / Car Wash</option>
              <option value="Glass & Surfaces">Glass & Surfaces</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fragrance / Scent</label>
            <input
              type="text"
              placeholder="e.g. Strawberry, Pine, Lemon, Lavender"
              className="form-input"
              value={newProduct.scent}
              onChange={(e) => setNewProduct({ ...newProduct, scent: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Selling Price per Liter ({currency}) *</label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="e.g. 70"
              className="form-input"
              value={newProduct.pricePerLiter}
              onChange={(e) => setNewProduct({ ...newProduct, pricePerLiter: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Production Cost per Liter ({currency}) *</label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="e.g. 38"
              className="form-input"
              value={newProduct.costPerLiter}
              onChange={(e) => setNewProduct({ ...newProduct, costPerLiter: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Initial Tank Stock (Liters) *</label>
            <input
              type="number"
              step="0.5"
              required
              placeholder="e.g. 150"
              className="form-input"
              value={newProduct.stockLiters}
              onChange={(e) => setNewProduct({ ...newProduct, stockLiters: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Low Stock Alert Threshold (Liters)</label>
            <input
              type="number"
              step="5"
              placeholder="e.g. 40"
              className="form-input"
              value={newProduct.minStockAlert}
              onChange={(e) => setNewProduct({ ...newProduct, minStockAlert: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label">Theme Color</label>
            <input
              type="color"
              className="form-color-picker"
              value={newProduct.color}
              onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Icon Emoji</label>
            <input
              type="text"
              className="form-input"
              value={newProduct.iconEmoji}
              onChange={(e) => setNewProduct({ ...newProduct, iconEmoji: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="btn-modal-submit">
            <Check size={18} />
            <span>Create Soap Product</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
