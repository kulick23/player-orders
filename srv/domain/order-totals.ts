type OrderItemAmount = { lineAmount?: number | null };

export function calculateLineAmount(price: number, quantity: number) {
  return Number((price * quantity).toFixed(2));
}

export function calculateSubtotal(items: OrderItemAmount[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.lineAmount ?? 0),
    0,
  );
}

export function calculateTotal(subtotal: number, discount: number) {
  return Number((subtotal - discount).toFixed(2));
}

export function isValidDiscount(discount: number, subtotal: number) {
  return Number.isFinite(discount) && discount >= 0 && discount <= subtotal;
}
