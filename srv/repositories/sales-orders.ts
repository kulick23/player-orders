import cds, { Transaction } from "@sap/cds";
import type {
  FulfillmentLog,
  PaymentTransaction,
  SalesOrder,
  SalesOrderItem,
} from "#cds-models/playerorders";

const { SELECT, UPDATE, INSERT } = cds.ql;
const SALES_ORDER = "playerorders.SalesOrder";
const SALES_ORDER_ITEM = "playerorders.SalesOrderItem";
const PAYMENT_TRANSACTION = "playerorders.PaymentTransaction";
const FULFILLMENT_LOG = "playerorders.FulfillmentLog";

export function findSalesOrder(tx: Transaction, ID: string) {
  return tx.run(
    SELECT.one.from(SALES_ORDER).where({ ID }),
  ) as Promise<SalesOrder | undefined>;
}

export function findFirstOrderItem(tx: Transaction, orderID: string) {
  return tx.run(
    SELECT.one.from(SALES_ORDER_ITEM).columns("ID").where({ order_ID: orderID }),
  ) as Promise<Pick<SalesOrderItem, "ID"> | undefined>;
}

export function findOrderItems(tx: Transaction, orderID: string) {
  return tx.run(
    SELECT.from(SALES_ORDER_ITEM).where({ order_ID: orderID }),
  ) as Promise<SalesOrderItem[]>;
}

export async function updateSalesOrder(
  tx: Transaction,
  ID: string,
  data: Partial<SalesOrder>,
) {
  await tx.run(UPDATE.entity(SALES_ORDER).set(data).where({ ID }));
}

export function createPayment(
  tx: Transaction,
  data: Partial<PaymentTransaction>,
) {
  return tx.run(INSERT.into(PAYMENT_TRANSACTION).entries(data));
}

export function createFulfillmentLog(
  tx: Transaction,
  data: Partial<FulfillmentLog>,
) {
  return tx.run(INSERT.into(FULFILLMENT_LOG).entries(data));
}
