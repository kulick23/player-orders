import cds, { Request } from "@sap/cds";

import {
  ORDER_ISSUE_CATEGORIES,
  REPORTABLE_ORDER_STATUSES,
} from "../constants/order-issues.js";
import { findCustomer } from "../repositories/customers.js";
import { findSalesOrder } from "../repositories/sales-orders.js";

const categoryCodes = new Set(ORDER_ISSUE_CATEGORIES.map(({ code }) => code));

export function readOrderIssueCategories(req: Request) {
  if (req.locale?.toLowerCase().startsWith("ru")) {
    return [
      { code: "PRODUCT_NOT_RECEIVED", label: "Товар не получен" },
      { code: "PRODUCT_NOT_WORKING", label: "Товар не работает" },
      { code: "WRONG_PRODUCT", label: "Получен не тот товар" },
      { code: "PAYMENT_PROBLEM", label: "Проблема с оплатой" },
      { code: "OTHER", label: "Другая проблема" },
    ];
  }
  return ORDER_ISSUE_CATEGORIES;
}

export async function reportOrderIssue(req: Request) {
  const orderID = String(req.params[0]?.ID ?? "");
  const categoryCode = String(req.data.categoryCode ?? "");
  const description = String(req.data.description ?? "").trim();
  const rating = Number(req.data.rating);

  if (!categoryCodes.has(categoryCode as never)) {
    return req.reject(400, "Select a valid problem type");
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return req.reject(400, "Rating must be an integer from 1 to 5");
  }
  if (!description) return req.reject(400, "Problem description is required");

  const tx = cds.tx(req);
  const order = await findSalesOrder(tx, orderID);
  if (!order) return req.reject(404, `Order ${orderID} not found`);
  if (!REPORTABLE_ORDER_STATUSES.includes(String(order.status_code))) {
    return req.reject(400, "A problem can only be reported for a submitted order");
  }

  const customer = await findCustomer(tx, String(order.customer_ID ?? ""));
  if (!customer?.playerId) {
    return req.reject(400, "The order customer is not linked to a CRM player");
  }

  const crm = await cds.connect.to("PlayerIntegrationService");
  return crm.send("reportOrderIssue", {
    orderID,
    playerID: customer.playerId,
    categoryCode,
    rating,
    description,
    orderDate: order.orderDate,
    orderTotal: order.totalAmount,
  });
}
