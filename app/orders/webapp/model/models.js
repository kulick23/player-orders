sap.ui.define([
  "sap/ui/model/json/JSONModel"
], function (JSONModel) {
  "use strict";

  function createCapabilities() {
    return {
      canCreateOrder: false,
      canUpdateOrder: false,
      canDeleteOrder: false,
      canSubmitOrder: false,
      canMarkAsPaid: false,
      canFulfillOrder: false,
      canCancelOrder: false,
      canCreateProduct: false,
      canReplenishStock: false,
      canManageProductImage: false
    };
  }

  function createNewOrder() {
    return {
      customerID: "",
      discountAmount: 0,
      note: "",
      items: [{ productID: "", quantity: 1 }]
    };
  }

  function createNewProduct() {
    return {
      name: "",
      description: "",
      type: "",
      price: 0,
      active: true,
      stockRelevant: true,
      stockQuantity: 0,
      imageName: ""
    };
  }

  function createUIModel() {
    return new JSONModel({
      busy: false,
      capabilitiesLoadFailed: false,
      capabilities: createCapabilities(),
      filters: {
        search: "",
        status: "",
        paymentMethod: "",
        minimumAmount: "",
        fromDate: null
      },
      sorting: { path: "orderDate", descending: true },
      newOrder: createNewOrder(),
      editOrder: { customerID: "", discountAmount: 0, note: "" },
      paymentProvider: "STRIPE",
      cancellationReason: "",
      selectedNavigation: "orders",
      productSearch: "",
      inventorySummary: {
        totalProducts: 0,
        activeProducts: 0,
        trackedProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
        totalStockUnits: 0
      },
      newProduct: createNewProduct(),
      productImageUpload: { productName: "", imageName: "" },
      stockReplenishment: {
        productName: "",
        currentQuantity: 0,
        quantity: 1
      }
    });
  }

  return {
    createNewOrder: createNewOrder,
    createNewProduct: createNewProduct,
    createUIModel: createUIModel
  };
});
