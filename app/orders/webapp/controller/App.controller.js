sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/base/i18n/Localization"
], function (Controller, Localization) {
  "use strict";

  return Controller.extend("playerorders.orders.controller.App", {
    onInit: function () {
      const bIsEnglish = Localization.getLanguage().toLowerCase().startsWith("en");
      this.getOwnerComponent().getModel("ui").setProperty("/isEnglish", bIsEnglish);
      this.getOwnerComponent().getRouter().attachRouteMatched(
        this.onRouteMatched,
        this
      );
    },

    onRouteMatched: function (oEvent) {
      const sRouteName = oEvent.getParameter("name");
      this.getOwnerComponent().getModel("ui").setProperty(
        "/selectedNavigation",
        sRouteName === "products" ? "products" : "orders"
      );
    },

    onLanguageChange: function (oEvent) {
      Localization.setLanguage(oEvent.getParameter("state") ? "en" : "ru");
    },

    onItemSelect: function (oEvent) {
      const sKey = oEvent.getParameter("item").getKey();
      if (["orders", "products"].includes(sKey)) {
        this.getOwnerComponent().getRouter().navTo(sKey);
      }
    }
  });
});
