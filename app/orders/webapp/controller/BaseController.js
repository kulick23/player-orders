sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (Controller, UIComponent, MessageBox, MessageToast) {
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

    getText: function (sKey, aParameters) {
      return this.getModel("i18n").getResourceBundle().getText(
        sKey,
        aParameters
      );
    },

    showToast: function (sTextKey) {
      MessageToast.show(this.getText(sTextKey));
    },

    getOrLoadDialog: async function (sPropertyName, sFragmentName) {
      if (!this[sPropertyName]) {
        this[sPropertyName] = await this.loadFragment({ name: sFragmentName });
      }
      return this[sPropertyName];
    },

    closeDialog: function (sPropertyName) {
      this[sPropertyName]?.close();
    },

    refreshItems: function (sTableID) {
      this.byId(sTableID).getBinding("items")?.refresh();
    },

    runBusy: async function (fnTask) {
      this.setBusy(true);
      try {
        return await fnTask();
      } catch (oError) {
        this.showError(oError);
        return null;
      } finally {
        this.setBusy(false);
      }
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
