sap.ui.define([
  "sap/ui/core/UIComponent",
  "./model/models"
], function (UIComponent, models) {
  "use strict";

  return UIComponent.extend("playerorders.orders.Component", {
    metadata: { manifest: "json" },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      this.setModel(models.createUIModel(), "ui");

      this.getRouter().initialize();
      this._loadCapabilities();
    },

    _loadCapabilities: async function () {
      try {
        const oCapabilities = await this.getModel()
          .bindContext("/Configuration")
          .requestObject();
        this.getModel("ui").setProperty("/capabilities", oCapabilities);
      } catch {
        this.getModel("ui").setProperty("/capabilitiesLoadFailed", true);
      }
    }
  });
});
