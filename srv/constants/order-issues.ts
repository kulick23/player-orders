export const ORDER_ISSUE_CATEGORIES = [
  { code: "PRODUCT_NOT_RECEIVED", label: "Product not received" },
  { code: "PRODUCT_NOT_WORKING", label: "Product does not work" },
  { code: "WRONG_PRODUCT", label: "Wrong product" },
  { code: "PAYMENT_PROBLEM", label: "Payment problem" },
  { code: "OTHER", label: "Other problem" },
] as const;

export const REPORTABLE_ORDER_STATUSES: readonly string[] = [
  "SUBMITTED",
  "PAID",
  "FULFILLED",
] as const;
