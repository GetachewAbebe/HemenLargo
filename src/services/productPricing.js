export const getProductSalePrice = (product, liters) => {
  const quantity = Number(liters);
  const pricePerLiter = Number(product?.pricePerLiter) || 0;
  const pricePerHalfLiter =
    product?.pricePerHalfLiter == null
      ? Number.NaN
      : Number(product.pricePerHalfLiter);

  if (!Number.isFinite(quantity) || quantity <= 0) return 0;

  const halfLiterUnits = Math.round(quantity * 2);
  if (Math.abs(quantity * 2 - halfLiterUnits) < 1e-9) {
    const fullLiterUnits = Math.floor(halfLiterUnits / 2);
    const hasHalfLiter = halfLiterUnits % 2 === 1;
    const halfLiterPrice = Number.isFinite(pricePerHalfLiter)
      ? pricePerHalfLiter
      : pricePerLiter / 2;
    return Number(
      (fullLiterUnits * pricePerLiter + (hasHalfLiter ? halfLiterPrice : 0)).toFixed(2)
    );
  }

  return Number((quantity * pricePerLiter).toFixed(2));
};
