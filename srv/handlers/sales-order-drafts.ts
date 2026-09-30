import cds, { Request } from "@sap/cds";
import { OrderStatus } from "../constants/order-status.js";
import { Role } from "../constants/roles.js";
import {
  calculateLineAmount,
  calculateSubtotal,
  calculateTotal,
  isValidDiscount,
} from "../domain/order-totals.js";
import { customerIDFor } from "../services/customer-access.js";

const { SELECT } = cds.ql;

export function createPrepareSalesOrderHandler(GameProducts: cds.entity) {
  return async function prepareSalesOrder(req: Request) {
    req.data.orderDate ??= new Date().toISOString();
    req.data.status_code ??= OrderStatus.New;

    if (req.user.is(Role.Customer) && !req.user.is(Role.SalesAdmin)) {
      req.data.customer_ID = await customerIDFor(req);
    }

    const items = req.data.items ?? [];
    let subtotal = 0;
    const tx = cds.tx(req);

    for (const item of items) {
      const product = await tx.run(
        SELECT.one
          .from(GameProducts)
          .columns("price", "active")
          .where({ ID: item.product_ID }),
      );

      if (!product) {
        return req.reject(404, "Product not found");
      }
      if (!product.active) {
        return req.reject(400, `Product ${item.product_ID} is inactive`);
      }

      const quantity = item.quantity ?? 1;
      const price = Number(product.price);
      item.quantity = quantity;
      item.unitPrice = price;
      item.lineAmount = calculateLineAmount(price, quantity);
      subtotal += item.lineAmount;
    }

    const discount = Number(req.data.discountAmount ?? 0);
    req.data.totalAmount = calculateTotal(subtotal, Math.min(discount, subtotal));
  };
}

export async function protectCustomerDraftFields(req: Request) {
  if (!req.user.is(Role.Customer) || req.user.is(Role.SalesAdmin)) {
    return;
  }

  const protectedFields = [
    "status_code",
    "totalAmount",
    "paymentMethod",
    "orderDate",
  ];
  const changedProtectedFields = protectedFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(req.data, field),
  );

  if (changedProtectedFields.length > 0) {
    return req.reject(
      403,
      `Customers cannot change system fields: ${changedProtectedFields.join(", ")}`,
    );
  }

  const customerID = await customerIDFor(req);
  if (req.data.customer_ID && req.data.customer_ID !== customerID) {
    return req.reject(403, "Customers cannot assign orders to another player");
  }
}

export async function prepareSalesOrderDraftSave(req: Request) {
  if (req.user.is(Role.Customer) && !req.user.is(Role.SalesAdmin)) {
    req.data.customer_ID = await customerIDFor(req);
  }

  const subtotal = calculateSubtotal(req.data.items ?? []);
  const discount = Number(req.data.discountAmount ?? 0);
  if (!isValidDiscount(discount, subtotal)) {
    return req.reject(400, "Discount must be between 0 and the items subtotal");
  }

  req.data.totalAmount = calculateTotal(subtotal, discount);
}
