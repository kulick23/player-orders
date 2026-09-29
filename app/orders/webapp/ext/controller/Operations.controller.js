sap.ui.define(
  [
    "sap/fe/core/PageController",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (PageController, MessageToast, Filter, FilterOperator) {
    "use strict";

    return PageController.extend(
      "playerorders.orders.ext.controller.Operations",
      {
        onInit: function () {
          // Called once when the view is initialized.
        },
        onSearch: function (oEvent) {
          const sQuery =
            oEvent.getParameter("newValue") ??
            oEvent.getParameter("query") ??
            "";

          const oTable = this.byId("ordersTable");
          const oBinding = oTable.getBinding("items");

          const aFilters = [];

          if (sQuery) {
            aFilters.push(
              new Filter(
                "customer/displayName",
                FilterOperator.Contains,
                sQuery,
              ),
            );
          }

          oBinding.filter(aFilters);
        },

        onRefresh: function () {
          const oTable = this.byId("ordersTable");
          const oBinding = oTable.getBinding("items");

          if (oBinding) {
            oBinding.refresh();
          }

          MessageToast.show("Orders refreshed");
        },
      },
    );
  },
);
