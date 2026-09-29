sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("playerorders.orders.Component", {
    metadata: { manifest: "json" },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      this.setModel(new JSONModel({
        busy: false,
        capabilities: {
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
        },
        filters: {
          search: "",
          status: "",
          paymentMethod: "",
          minimumAmount: "",
          fromDate: null
        },
        sorting: { path: "orderDate", descending: true },
        newOrder: {
          customerID: "",
          discountAmount: 0,
          note: "",
          items: []
        },
        editOrder: { customerID: "", discountAmount: 0, note: "" },
        paymentProvider: "STRIPE",
        cancellationReason: "",
        selectedNavigation: "orders",
        productSearch: "",
        newProduct: {
          name: "",
          description: "",
          type: "",
          price: 0,
          active: true,
          stockRelevant: true,
          stockQuantity: 0,
          imageName: ""
        },
        productImageUpload: {
          productName: "",
          imageName: ""
        },
        stockReplenishment: {
          productName: "",
          currentQuantity: 0,
          quantity: 1
        }
      }), "ui");

      this.getRouter().initialize();
      this._loadCapabilities();
    },

    _loadCapabilities: async function () {
      try {
        const oCapabilities = await this.getModel()
          .bindContext("/Configuration")
          .requestObject();
        this.getModel("ui").setProperty("/capabilities", oCapabilities);
      } catch (oError) {
        console.error("Could not load UI capabilities", oError);
      }
    }
  });
});
