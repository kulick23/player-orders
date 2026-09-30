export const OrderStatus = {
  New: "NEW",
  Submitted: "SUBMITTED",
  Paid: "PAID",
  Fulfilled: "FULFILLED",
  Cancelled: "CANCELLED",
} as const;

export const CANCELLABLE_ORDER_STATUSES: readonly string[] = [
  OrderStatus.New,
  OrderStatus.Submitted,
] as const;
