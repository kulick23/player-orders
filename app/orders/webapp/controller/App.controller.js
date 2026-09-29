sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("playerorders.orders.controller.App", {
    onToggleNavigation: function () {
      const oNavigation = this.byId("sideNavigation");
      oNavigation.setExpanded(!oNavigation.getExpanded());
    },

    onItemSelect: function (oEvent) {
      if (oEvent.getParameter("item").getKey() === "orders") {
        this.getOwnerComponent().getRouter().navTo("orders");
      }
    }
  });
});
