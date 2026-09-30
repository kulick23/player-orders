export const LOW_STOCK_THRESHOLD = 10;

export const ProductStockStatus = {
  Inactive: "INACTIVE",
  NotTracked: "NOT_TRACKED",
  OutOfStock: "OUT_OF_STOCK",
  LowStock: "LOW_STOCK",
  InStock: "IN_STOCK",
} as const;
