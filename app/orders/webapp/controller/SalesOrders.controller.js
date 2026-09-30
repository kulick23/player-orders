sap.ui.define([
  "./BaseController",
  "../model/formatter",
  "../model/models",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], function (
  BaseController,
  formatter,
  models,
  Filter,
  FilterOperator,
  Sorter
) {
  "use strict";

  return BaseController.extend("playerorders.orders.controller.SalesOrders", {
    formatter: formatter,

    onInit: function () {
      this.getRouter().getRoute("orders").attachPatternMatched(
        this.onRouteMatched,
        this
      );
    },

    onRouteMatched: function () {
      this.onApplyFilters();
    },

    onApplyFilters: function () {
      const oFilters = this.getUIModel().getProperty("/filters");
      const aFilters = [
        new Filter("IsActiveEntity", FilterOperator.EQ, true)
      ];

      if (oFilters.search) {
        aFilters.push(new Filter(
          "customer/displayName",
          FilterOperator.Contains,
          oFilters.search.trim()
        ));
      }
      if (oFilters.status) {
        aFilters.push(new Filter(
          "status_code",
          FilterOperator.EQ,
          oFilters.status
        ));
      }
      if (oFilters.paymentMethod) {
        aFilters.push(new Filter(
          "paymentMethod",
          FilterOperator.EQ,
          oFilters.paymentMethod
        ));
      }
      if (oFilters.minimumAmount !== "" && oFilters.minimumAmount !== null) {
        aFilters.push(new Filter(
          "totalAmount",
          FilterOperator.GE,
          Number(oFilters.minimumAmount)
        ));
      }
      if (oFilters.fromDate) {
        aFilters.push(new Filter(
          "orderDate",
          FilterOperator.GE,
          oFilters.fromDate.toISOString()
        ));
      }

      const oBinding = this.byId("ordersTable").getBinding("items");
      if (oBinding) {
        oBinding.filter(aFilters);
        this.onSortChange();
      }
    },

    onClearFilters: function () {
      this.getUIModel().setProperty("/filters", {
        search: "",
        status: "",
        paymentMethod: "",
        minimumAmount: "",
        fromDate: null
      });
      this.onApplyFilters();
    },

    onSortChange: function () {
      const oSorting = this.getUIModel().getProperty("/sorting");
      const oBinding = this.byId("ordersTable").getBinding("items");
      if (oBinding) {
        oBinding.sort(new Sorter(oSorting.path, oSorting.descending));
      }
    },

    onRefresh: function () {
      this.refreshItems("ordersTable");
      this.showToast("ordersRefreshed");
    },

    onItemPress: function (oEvent) {
      const sOrderID = oEvent.getParameter("listItem")
        .getBindingContext()
        .getProperty("ID");
      this.getRouter().navTo("orderDetails", { orderId: sOrderID });
    },

    onOpenCreate: async function () {
      this.getUIModel().setProperty("/newOrder", models.createNewOrder());
      const oDialog = await this.getOrLoadDialog(
        "createDialog",
        "playerorders.orders.fragment.CreateOrderDialog"
      );
      oDialog.open();
    },

    onAddOrderItem: function () {
      const aItems = this.getUIModel().getProperty("/newOrder/items");
      aItems.push({ productID: "", quantity: 1 });
      this.getUIModel().setProperty("/newOrder/items", [...aItems]);
    },

    onRemoveOrderItem: function (oEvent) {
      const sPath = oEvent.getSource().getBindingContext("ui").getPath();
      const iIndex = Number(sPath.split("/").pop());
      const aItems = this.getUIModel().getProperty("/newOrder/items");
      aItems.splice(iIndex, 1);
      if (aItems.length === 0) {
        aItems.push({ productID: "", quantity: 1 });
      }
      this.getUIModel().setProperty("/newOrder/items", [...aItems]);
    },

    onCreateOrder: async function () {
      const oNewOrder = this.getUIModel().getProperty("/newOrder");
      const sCustomerID = this.byId("createCustomerSelect").getSelectedKey();
      const bInvalidItems = oNewOrder.items.some(
        (oItem) => !oItem.productID || Number(oItem.quantity) < 1
      );

      if (!sCustomerID || bInvalidItems) {
        this.showError(new Error(this.getText("completeRequiredFields")));
        return;
      }

      await this.runBusy(async () => {
        const oListBinding = this.getModel().bindList("/SalesOrders");
        const oDraftContext = oListBinding.create({
          customer_ID: sCustomerID,
          discountAmount: Number(oNewOrder.discountAmount || 0),
          note: oNewOrder.note,
          items: oNewOrder.items.map((oItem) => ({
            product_ID: oItem.productID,
            quantity: Number(oItem.quantity)
          }))
        });

        await oDraftContext.created();
        const oActiveContext = await this.executeAction(
          "draftActivate",
          oDraftContext
        );

        this.closeDialog("createDialog");
        this.getModel().refresh();
        this.showToast("orderCreated");

        const sOrderID = oActiveContext?.getProperty("ID");
        if (sOrderID) {
          this.getRouter().navTo("orderDetails", { orderId: sOrderID });
        }
      });
    },

    onCancelCreate: function () {
      this.closeDialog("createDialog");
    }
  });
});
