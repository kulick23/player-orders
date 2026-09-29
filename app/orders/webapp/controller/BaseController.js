sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/m/MessageBox"
], function (Controller, UIComponent, MessageBox) {
  "use strict";

  return Controller.extend("playerorders.orders.controller.BaseController", {
    getRouter: function () {
      return UIComponent.getRouterFor(this);
    },

    getModel: function (sName) {
      return this.getView().getModel(sName);
    },

    getUIModel: function () {
      return this.getModel("ui");
    },

    setBusy: function (bBusy) {
      this.getUIModel().setProperty("/busy", bBusy);
    },

    showError: function (oError) {
      const sMessage = oError?.cause?.error?.message ||
        oError?.error?.message || oError?.message || "Unexpected error";
      MessageBox.error(sMessage);
    },

    executeAction: async function (sAction, oContext, mParameters) {
      const oAction = this.getModel().bindContext(
        `PlayerOrderService.${sAction}(...)`,
        oContext
      );
      Object.entries(mParameters || {}).forEach(([sName, vValue]) => {
        oAction.setParameter(sName, vValue);
      });
      await oAction.execute();
      return oAction.getBoundContext();
    }
  });
});
