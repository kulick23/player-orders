import cds, { Request } from "@sap/cds";
import {
  CANCELLABLE_ORDER_STATUSES,
  OrderStatus,
} from "../constants/order-status.js";
import { findFirstOrderItem } from "../repositories/sales-orders.js";
import {
  requireSalesOrder,
  updateAndReadSalesOrder,
} from "../services/order-access.js";

export async function submitOrder(req: Request) {
  const { ID } = req.params[0];
  const tx = cds.tx(req);
  const order = await requireSalesOrder(req, tx, ID);

  if (order.status_code !== OrderStatus.New) {
    return req.reject(
      400,
      `Only NEW orders can be submitted. Current status: ${order.status_code}`,
    );
  }

  if (!(await findFirstOrderItem(tx, ID))) {
    return req.reject(400, "Cannot submit an order without items");
  }
  if (Number(order.totalAmount) <= 0) {
    return req.reject(400, "Order total must be greater than zero");
  }

  return updateAndReadSalesOrder(tx, ID, {
    status_code: OrderStatus.Submitted,
  });
}

export async function cancelOrder(req: Request) {
  const { ID } = req.params[0];
  const reason = String(req.data.reason ?? "").trim();
  const tx = cds.tx(req);

  if (!reason) {
    return req.reject(400, "Cancellation reason is required");
  }

  const order = await requireSalesOrder(req, tx, ID);
  if (!CANCELLABLE_ORDER_STATUSES.includes(order.status_code ?? "")) {
    return req.reject(
      400,
      `Order with status ${order.status_code} cannot be cancelled`,
    );
  }

  const cancellationNote = order.note
    ? `${order.note}\nCancellation reason: ${reason}`
    : `Cancellation reason: ${reason}`;

  return updateAndReadSalesOrder(tx, ID, {
    status_code: OrderStatus.Cancelled,
    note: cancellationNote,
  });
}
