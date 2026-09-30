import cds, { Request } from "@sap/cds";
import type { SalesOrderItem } from "#cds-models/playerorders";
import { calculateLineAmount } from "../domain/order-totals.js";

const { SELECT } = cds.ql;

export function createCalculateItemAmountsHandler(
  GameProducts: cds.entity,
  SalesOrderItemDrafts: cds.entity,
) {
  return async function calculateItemAmounts(req: Request) {
    const tx = cds.tx(req);
    let currentItem: Partial<SalesOrderItem> = {};
    const itemKey = req.params?.[req.params.length - 1];
    const itemID = req.data.ID ?? itemKey?.ID;

    if (itemID) {
      currentItem = ((await tx.run(
          SELECT.one.from(SalesOrderItemDrafts).where({ ID: itemID }),
        )) ?? {}) as Partial<SalesOrderItem>;
    }

    const productID = req.data.product_ID ?? currentItem.product_ID;
    const quantity = Number(req.data.quantity ?? currentItem.quantity ?? 1);

    // A new draft item exists before the user chooses a product.
    if (!productID) {
      return;
    }

    const product = await tx.run(
      SELECT.one
        .from(GameProducts)
        .columns("price", "active")
        .where({ ID: productID }),
    );

    if (!product) {
      return req.reject(404, "Product not found");
    }

    if (!product.active) {
      return req.reject(400, "Inactive products cannot be ordered");
    }

    const unitPrice = Number(product.price);
    req.data.quantity = quantity;
    req.data.unitPrice = unitPrice;
    req.data.lineAmount = calculateLineAmount(unitPrice, quantity);
  };
}
