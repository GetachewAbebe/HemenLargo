import React, { useState, useMemo } from "react";
import { useApp } from "../context";
import InventoryStats from "./inventory/InventoryStats";
import ProductTable from "./inventory/ProductTable";
import RestockModal from "./inventory/RestockModal";
import AddProductModal from "./inventory/AddProductModal";
import EditProductModal from "./inventory/EditProductModal";
import SearchBar from "./common/SearchBar";
import { calculateInventoryMetrics } from "../services/inventoryService";
import { createRecordId } from "../utils/ids";

export default function InventoryView(props) {
  const context = useApp();
  const products = props.products ?? context.products;
  const currency = props.currency ?? context.currency;
  const onUpdateProduct = props.onUpdateProduct ?? context.handleUpdateProduct;
  const onAddProduct = props.onAddProduct ?? context.handleAddProduct;
  const onDeleteProduct = props.onDeleteProduct ?? context.handleDeleteProduct;
  const onRestockLiters = props.onRestockLiters ?? context.handleRestockLiters;

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal States
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Selected product for restock / edit
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockLiters, setRestockLiters] = useState("");
  const [restockCost, setRestockCost] = useState("");

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    category: "Largo",
    color: "#0d9488",
    pricePerLiter: "",
    pricePerHalfLiter: "",
    costPerLiter: "",
    stockLiters: "",
    minStockAlert: 40,
  });

  // Edit Product Form State
  const [editForm, setEditForm] = useState(null);

  // Metrics using inventoryService
  const {
    totalLitersInStock,
    totalStockCostValue,
    totalPotentialRetail,
    lowStockCount,
  } = useMemo(() => calculateInventoryMetrics(products), [products]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.localName && p.localName.toLowerCase().includes(q)) ||
        (p.scent && p.scent.toLowerCase().includes(q));

      const matchCat = categoryFilter === "All" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, categoryFilter]);

  // Restock Open
  const handleOpenRestock = (product) => {
    setSelectedProduct(product);
    setRestockLiters("");
    setRestockCost(product.costPerLiter || "");
    setIsRestockModalOpen(true);
  };

  // Submit Restock
  const handleSubmitRestock = (e) => {
    e.preventDefault();
    if (!selectedProduct || !restockLiters) return;
    onRestockLiters(
      selectedProduct.id,
      parseFloat(restockLiters),
      restockCost ? parseFloat(restockCost) : null
    );
    setIsRestockModalOpen(false);
  };

  // Open Edit
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setEditForm({ ...product });
    setIsEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm) return;
    onUpdateProduct(editForm);
    setIsEditModalOpen(false);
  };

  // Create Product
  const handleCreateProduct = (e) => {
    e.preventDefault();
    const id = createRecordId("soap");
    const isBerekina = newProduct.category === "Berekina";
    const created = {
      id,
      name: isBerekina ? "Berekina" : "Largo",
      localName: isBerekina ? "በረኪና" : "ላርጎ",
      category: isBerekina ? "Bleach & Sanitizer (በረኪና)" : "Liquid Soap (ላርጎ)",
      scent: "",
      color: isBerekina ? "#0284c7" : "#0d9488",
      pricePerLiter: parseFloat(newProduct.pricePerLiter) || 0,
      pricePerHalfLiter: parseFloat(newProduct.pricePerHalfLiter) || 0,
      costPerLiter: parseFloat(newProduct.costPerLiter) || 0,
      stockLiters: parseFloat(newProduct.stockLiters) || 0,
      minStockAlert: parseFloat(newProduct.minStockAlert) || 40,
      soldLiters: 0,
      description: "",
    };
    onAddProduct(created);
    setIsAddModalOpen(false);
    // Reset form
    setNewProduct({
      category: "Largo",
      color: "#0d9488",
      pricePerLiter: "",
      pricePerHalfLiter: "",
      costPerLiter: "",
      stockLiters: "",
      minStockAlert: 40,
    });
  };

  return (
    <div className="view-content-wrapper animate-fade">
      {/* 4 Top Metric Cards */}
      <InventoryStats
        totalLitersInStock={totalLitersInStock}
        totalStockCostValue={totalStockCostValue}
        totalPotentialRetail={totalPotentialRetail}
        lowStockCount={lowStockCount}
        currency={currency}
      />

      {/* Action Controls & Filters */}
      <div className="inventory-controls-bar">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search soaps by name, scent..."
          className="inventory-search-wrap"
        />

        <div className="category-select-wrap">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Soap Categories" : c}
              </option>
            ))}
          </select>
        </div>

        <div className="inventory-actions-right">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <span>+ Add Soap Variety</span>
          </button>
        </div>
      </div>

      {/* Soap Products Table */}
      <ProductTable
        products={filteredProducts}
        currency={currency}
        onOpenRestock={handleOpenRestock}
        onOpenEdit={handleOpenEdit}
        onDeleteProduct={onDeleteProduct}
      />

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        product={selectedProduct}
        restockLiters={restockLiters}
        setRestockLiters={setRestockLiters}
        restockCost={restockCost}
        setRestockCost={setRestockCost}
        onSubmit={handleSubmitRestock}
        currency={currency}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        onSubmit={handleCreateProduct}
        currency={currency}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleSaveEdit}
        currency={currency}
      />
    </div>
  );
}
