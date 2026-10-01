import cds, { Request } from "@sap/cds";

import { OrderStatus } from "./constants/order-status.js";
import { findCustomerByPlayerID } from "./repositories/customers.js";
import { findOrdersByCustomerID } from "./repositories/sales-orders.js";

const PAID_STATUSES = new Set<string>([
  OrderStatus.Paid,
  OrderStatus.Fulfilled,
]);

export default class OrderIntegrationService extends cds.ApplicationService {
  async init() {
    this.on("getPlayerOrderSummary", async (req: Request) => {
      const playerID = String(req.data.playerID ?? "").trim();
      if (!playerID) return req.reject(400, "Player ID is required");

      const tx = cds.tx(req);
      const customer = await findCustomerByPlayerID(tx, playerID);
      if (!customer?.ID) {
        return req.reject(404, `Customer for player ${playerID} not found`);
      }

      const orders = await findOrdersByCustomerID(tx, customer.ID);
      const paidOrders = orders.filter((order) =>
        PAID_STATUSES.has(order.status_code ?? ""),
      );
      const lastOrderDate = orders
        .map((order) => order.orderDate)
        .filter((date): date is string => Boolean(date))
        .sort()
        .at(-1);

      return {
        orderCount: orders.length,
        totalSpent: paidOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount ?? 0),
          0,
        ),
        paidOrderCount: paidOrders.length,
        lastOrderDate: lastOrderDate ?? null,
      };
    });

    return super.init();
  }
}
