import { Request, Transaction } from "@sap/cds";
import type { SalesOrder } from "#cds-models/playerorders";
import {
  findSalesOrder,
  updateSalesOrder,
} from "../repositories/sales-orders.js";

export async function requireSalesOrder(
  req: Request,
  tx: Transaction,
  ID: string,
) {
  const order = await findSalesOrder(tx, ID);
  if (!order) {
    return req.reject(404, "Order not found");
  }
  return order;
}

export async function updateAndReadSalesOrder(
  tx: Transaction,
  ID: string,
  data: Partial<SalesOrder>,
) {
  await updateSalesOrder(tx, ID, data);
  return findSalesOrder(tx, ID);
}
