import { Request } from "@sap/cds";

export function readConfiguration(req: Request) {
  const isCustomer = req.user.is("Customer");
  const isSalesAdmin = req.user.is("SalesAdmin");
  const isWarehouseManager = req.user.is("WarehouseManager");

  return {
    ID: "current",
    canCreateOrder: isCustomer || isSalesAdmin,
    canUpdateOrder: isCustomer || isSalesAdmin,
    canDeleteOrder: isCustomer || isSalesAdmin,
    canSubmitOrder: isCustomer || isSalesAdmin,
    canMarkAsPaid: isSalesAdmin,
    canFulfillOrder: isWarehouseManager,
    canCancelOrder: isCustomer || isSalesAdmin,
    canCreateProduct: isSalesAdmin || isWarehouseManager,
    canReplenishStock: isSalesAdmin || isWarehouseManager,
    canManageProductImage: isSalesAdmin || isWarehouseManager,
  };
}
