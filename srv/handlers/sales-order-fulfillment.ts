import cds, { Request } from "@sap/cds";
import { OrderStatus } from "../constants/order-status.js";
import {
  findGameProduct,
  updateGameProduct,
} from "../repositories/game-products.js";
import {
  createFulfillmentLog,
  findOrderItems,
} from "../repositories/sales-orders.js";
import {
  requireSalesOrder,
  updateAndReadSalesOrder,
} from "../services/order-access.js";

export async function fulfillOrder(req: Request) {
  const { ID } = req.params[0];
  const tx = cds.tx(req);
  const order = await requireSalesOrder(req, tx, ID);

  if (order.status_code !== OrderStatus.Paid) {
    return req.reject(
      400,
      `Only PAID orders can be fulfilled. Current status: ${order.status_code}`,
    );
  }

  const items = await findOrderItems(tx, ID);
  for (const item of items) {
    const product = await findGameProduct(tx, item.product_ID!);
    if (!product) {
      return req.reject(404, "Product not found");
    }

    if (product.stockRelevant) {
      const stockQuantity = Number(product.stockQuantity ?? 0);
      const itemQuantity = Number(item.quantity ?? 0);
      if (stockQuantity < itemQuantity) {
        return req.reject(409, `Not enough stock for ${product.name}`);
      }
      await updateGameProduct(tx, product.ID!, {
        stockQuantity: stockQuantity - itemQuantity,
      });
    }

    await createFulfillmentLog(tx, {
      order_ID: ID,
      product_ID: product.ID,
      fulfilledAt: new Date().toISOString(),
      result: "SUCCESS",
      message: `${product.name} fulfilled`,
    });
  }

  return updateAndReadSalesOrder(tx, ID, {
    status_code: OrderStatus.Fulfilled,
  });
}
