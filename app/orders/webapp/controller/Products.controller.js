sap.ui.define([
  "./BaseController",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageToast) {
  "use strict";

  return BaseController.extend("playerorders.orders.controller.Products", {
    onInit: function () {
      this.getRouter().getRoute("products").attachPatternMatched(
        this.onRouteMatched,
        this
      );
    },

    onRouteMatched: function () {
      const oBinding = this.byId("productsTable").getBinding("items");
      if (oBinding) {
        oBinding.refresh();
      }
    },

    onSearch: function () {
      const sQuery = this.getUIModel().getProperty("/productSearch").trim();
      const oBinding = this.byId("productsTable").getBinding("items");
      const aFilters = sQuery ? [new Filter({
        filters: [
          new Filter("name", FilterOperator.Contains, sQuery),
          new Filter("description", FilterOperator.Contains, sQuery),
          new Filter("type", FilterOperator.Contains, sQuery)
        ],
        and: false
      })] : [];

      oBinding.filter(aFilters);
    },

    onRefresh: function () {
      this.byId("productsTable").getBinding("items").refresh();
      MessageToast.show(this.getResourceBundle().getText("productsRefreshed"));
    },

    onOpenCreate: async function () {
      this.getUIModel().setProperty("/newProduct", {
        name: "",
        description: "",
        type: "",
        price: 0,
        active: true,
        stockRelevant: true,
        stockQuantity: 0
      });

      if (!this.createProductDialog) {
        this.createProductDialog = await this.loadFragment({
          name: "playerorders.orders.fragment.CreateProductDialog"
        });
      }
      this.createProductDialog.open();
    },

    onCreateProduct: async function () {
      const oProduct = this.getUIModel().getProperty("/newProduct");
      const sName = String(oProduct.name || "").trim();
      const nPrice = Number(oProduct.price);

      if (!sName || !Number.isFinite(nPrice) || nPrice < 0) {
        this.showError(new Error(
          this.getResourceBundle().getText("completeProductFields")
        ));
        return;
      }

      this.setBusy(true);
      try {
        const oContext = this.getModel().bindList("/GameProducts").create({
          name: sName,
          description: String(oProduct.description || "").trim(),
          type: String(oProduct.type || "").trim(),
          price: nPrice,
          active: Boolean(oProduct.active),
          stockRelevant: Boolean(oProduct.stockRelevant),
          stockQuantity: oProduct.stockRelevant
            ? Number(oProduct.stockQuantity || 0)
            : 0
        });

        await oContext.created();
        this.createProductDialog.close();
        this.byId("productsTable").getBinding("items").refresh();
        MessageToast.show(this.getResourceBundle().getText("productCreated"));
      } catch (oError) {
        this.showError(oError);
      } finally {
        this.setBusy(false);
      }
    },

    onCancelCreate: function () {
      this.createProductDialog.close();
    },

    onOpenReplenish: async function (oEvent) {
      this.replenishContext = oEvent.getSource().getBindingContext();
      this.getUIModel().setProperty("/stockReplenishment", {
        productName: this.replenishContext.getProperty("name"),
        currentQuantity: this.replenishContext.getProperty("stockQuantity"),
        quantity: 1
      });

      if (!this.replenishDialog) {
        this.replenishDialog = await this.loadFragment({
          name: "playerorders.orders.fragment.ReplenishStockDialog"
        });
      }
      this.replenishDialog.open();
    },

    onReplenishStock: async function () {
      const nQuantity = Number(
        this.getUIModel().getProperty("/stockReplenishment/quantity")
      );

      if (!Number.isInteger(nQuantity) || nQuantity <= 0) {
        this.showError(new Error(
          this.getResourceBundle().getText("positiveStockRequired")
        ));
        return;
      }

      this.setBusy(true);
      try {
        await this.executeAction(
          "replenishStock",
          this.replenishContext,
          { quantity: nQuantity }
        );
        this.replenishDialog.close();
        this.byId("productsTable").getBinding("items").refresh();
        MessageToast.show(this.getResourceBundle().getText("stockReplenished"));
      } catch (oError) {
        this.showError(oError);
      } finally {
        this.setBusy(false);
      }
    },

    onCancelReplenish: function () {
      this.replenishDialog.close();
    },

    getResourceBundle: function () {
      return this.getModel("i18n").getResourceBundle();
    }
  });
});
