import cds, { Request } from "@sap/cds";
import { OrderStatus } from "../constants/order-status.js";
import { createPayment } from "../repositories/sales-orders.js";
import {
  requireSalesOrder,
  updateAndReadSalesOrder,
} from "../services/order-access.js";

export async function markOrderAsPaid(req: Request) {
  const { ID } = req.params[0];
  const paymentProvider = String(req.data.paymentProvider ?? "").trim();
  const tx = cds.tx(req);

  if (!paymentProvider) {
    return req.reject(400, "Payment provider is required");
  }

  const order = await requireSalesOrder(req, tx, ID);
  if (order.status_code !== OrderStatus.Submitted) {
    return req.reject(
      400,
      `Only SUBMITTED orders can be paid. Current status: ${order.status_code}`,
    );
  }

  await createPayment(tx, {
    order_ID: ID,
    provider: paymentProvider,
    transactionDate: new Date().toISOString(),
    amount: order.totalAmount,
    status: "SUCCESS",
    message: "Payment completed",
  });

  return updateAndReadSalesOrder(tx, ID, {
    status_code: OrderStatus.Paid,
    paymentMethod: paymentProvider,
  });
}
