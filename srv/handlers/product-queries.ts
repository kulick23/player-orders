import cds, { Request } from "@sap/cds";
import type { GameProduct } from "#cds-models/playerorders";
import {
  LOW_STOCK_THRESHOLD,
  ProductStockStatus,
} from "../constants/product-stock.js";
import { listGameProductStock } from "../repositories/game-products.js";

type ProductReadResult = GameProduct & { stockStatus?: string };

function stockStatusFor(product: GameProduct) {
  if (!product.active) {
    return ProductStockStatus.Inactive;
  }
  if (!product.stockRelevant) {
    return ProductStockStatus.NotTracked;
  }

  const stockQuantity = Number(product.stockQuantity ?? 0);
  if (stockQuantity === 0) {
    return ProductStockStatus.OutOfStock;
  }
  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return ProductStockStatus.LowStock;
  }
  return ProductStockStatus.InStock;
}

export function enrichProductStockStatus(
  result: ProductReadResult | ProductReadResult[] | null,
) {
  const products = Array.isArray(result) ? result : result ? [result] : [];
  for (const product of products) {
    product.stockStatus = stockStatusFor(product);
  }
}

export async function getInventorySummary(req: Request) {
  const products = await listGameProductStock(cds.tx(req));

  return products.reduce(
    (summary, product) => {
      const status = stockStatusFor(product);
      summary.totalProducts += 1;
      summary.activeProducts += product.active ? 1 : 0;
      summary.trackedProducts += product.stockRelevant ? 1 : 0;
      summary.outOfStockProducts +=
        status === ProductStockStatus.OutOfStock ? 1 : 0;
      summary.lowStockProducts +=
        status === ProductStockStatus.LowStock ? 1 : 0;
      summary.totalStockUnits += product.stockRelevant
        ? Number(product.stockQuantity ?? 0)
        : 0;
      return summary;
    },
    {
      totalProducts: 0,
      activeProducts: 0,
      trackedProducts: 0,
      outOfStockProducts: 0,
      lowStockProducts: 0,
      totalStockUnits: 0,
    },
  );
}
