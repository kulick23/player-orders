import { Request } from "@sap/cds";
import { Role } from "../constants/roles.js";

export function readConfiguration(req: Request) {
  const isCustomer = req.user.is(Role.Customer);
  const isSalesAdmin = req.user.is(Role.SalesAdmin);
  const isWarehouseManager = req.user.is(Role.WarehouseManager);
  const roleCode = isSalesAdmin
    ? Role.SalesAdmin
    : isWarehouseManager
      ? Role.WarehouseManager
      : isCustomer
        ? Role.Customer
        : "User";

  return {
    ID: "current",
    roleCode,
    canCreateOrder: isCustomer || isSalesAdmin,
    canUpdateOrder: isCustomer || isSalesAdmin,
    canDeleteOrder: isCustomer || isSalesAdmin,
    canSubmitOrder: isCustomer || isSalesAdmin,
    canMarkAsPaid: isSalesAdmin,
    canFulfillOrder: isWarehouseManager,
    canCancelOrder: isCustomer || isSalesAdmin,
    canReportIssue: isCustomer || isSalesAdmin,
    canCreateProduct: isSalesAdmin || isWarehouseManager,
    canReplenishStock: isSalesAdmin || isWarehouseManager,
    canManageProductImage: isSalesAdmin || isWarehouseManager,
  };
}
