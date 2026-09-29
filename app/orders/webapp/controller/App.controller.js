sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/base/i18n/Localization"
], function (Controller, Localization) {
  "use strict";

  return Controller.extend("playerorders.orders.controller.App", {
    onInit: function () {
      const bIsEnglish = Localization.getLanguage().toLowerCase().startsWith("en");
      this.getOwnerComponent().getModel("ui").setProperty("/isEnglish", bIsEnglish);
    },

    onLanguageChange: function (oEvent) {
      Localization.setLanguage(oEvent.getParameter("state") ? "en" : "ru");
    },

    onItemSelect: function (oEvent) {
      if (oEvent.getParameter("item").getKey() === "orders") {
        this.getOwnerComponent().getRouter().navTo("orders");
      }
    }
  });
});
