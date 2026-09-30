sap.ui.define([
  "./BaseController",
  "../model/models",
  "../model/productImage",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (BaseController, models, productImage, Filter, FilterOperator) {
  "use strict";

  return BaseController.extend("playerorders.orders.controller.Products", {
    onInit: function () {
      this.getRouter().getRoute("products").attachPatternMatched(
        this.onRouteMatched,
        this
      );
    },

    onRouteMatched: function () {
      this.refreshItems("productsTable");
    },

    onSearch: function () {
      const sQuery = this.getUIModel().getProperty("/productSearch").trim();
      const aFilters = sQuery ? [new Filter({
        filters: [
          new Filter("name", FilterOperator.Contains, sQuery),
          new Filter("description", FilterOperator.Contains, sQuery),
          new Filter("type", FilterOperator.Contains, sQuery)
        ],
        and: false
      })] : [];

      this.byId("productsTable").getBinding("items").filter(aFilters);
    },

    onRefresh: function () {
      this.refreshItems("productsTable");
      this.showToast("productsRefreshed");
    },

    onOpenCreate: async function () {
      this.getUIModel().setProperty("/newProduct", models.createNewProduct());
      this.newProductImageFile = null;

      const oDialog = await this.getOrLoadDialog(
        "createProductDialog",
        "playerorders.orders.fragment.CreateProductDialog"
      );
      this.byId("createProductImageUploader").clear();
      oDialog.open();
    },

    onCreateImageSelected: function (oEvent) {
      this.newProductImageFile = oEvent.getParameter("files")[0] || null;
      this.getUIModel().setProperty(
        "/newProduct/imageName",
        this.newProductImageFile?.name || ""
      );
    },

    onCreateProduct: async function () {
      const oProduct = this.getUIModel().getProperty("/newProduct");
      const sName = String(oProduct.name || "").trim();
      const nPrice = Number(oProduct.price);

      if (!sName || !Number.isFinite(nPrice) || nPrice < 0) {
        this.showError(new Error(this.getText("completeProductFields")));
        return;
      }

      await this.runBusy(async () => {
        const oImage = this.newProductImageFile
          ? await productImage.read(this.newProductImageFile, this.getText.bind(this))
          : null;
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
        if (oImage) {
          await this.executeAction("setImage", oContext, oImage);
        }
        this.closeDialog("createProductDialog");
        this.refreshItems("productsTable");
        this.showToast("productCreated");
      });
    },

    onCancelCreate: function () {
      this.closeDialog("createProductDialog");
    },

    onOpenImageUpload: async function (oEvent) {
      this.imageProductContext = oEvent.getSource().getBindingContext();
      this.productImageFile = null;
      this.getUIModel().setProperty("/productImageUpload", {
        productName: this.imageProductContext.getProperty("name"),
        imageName: ""
      });

      const oDialog = await this.getOrLoadDialog(
        "productImageDialog",
        "playerorders.orders.fragment.UploadProductImageDialog"
      );
      this.byId("productImageUploader").clear();
      oDialog.open();
    },

    onProductImageSelected: function (oEvent) {
      this.productImageFile = oEvent.getParameter("files")[0] || null;
      this.getUIModel().setProperty(
        "/productImageUpload/imageName",
        this.productImageFile?.name || ""
      );
    },

    onUploadProductImage: async function () {
      if (!this.productImageFile) {
        this.showError(new Error(this.getText("selectProductImage")));
        return;
      }

      await this.runBusy(async () => {
        const oImage = await productImage.read(
          this.productImageFile,
          this.getText.bind(this)
        );
        await this.executeAction("setImage", this.imageProductContext, oImage);
        this.closeDialog("productImageDialog");
        this.refreshItems("productsTable");
        this.showToast("productImageUploaded");
      });
    },

    onCancelImageUpload: function () {
      this.closeDialog("productImageDialog");
    },

    onImageTypeMismatch: function () {
      this.showError(new Error(this.getText("invalidImageType")));
    },

    onImageSizeExceeded: function () {
      this.showError(new Error(this.getText("imageTooLarge")));
    },

    formatProductImageUrl: function (sID, sImageType, sModifiedAt) {
      return productImage.formatUrl(sID, sImageType, sModifiedAt);
    },

    onOpenReplenish: async function (oEvent) {
      this.replenishContext = oEvent.getSource().getBindingContext();
      this.getUIModel().setProperty("/stockReplenishment", {
        productName: this.replenishContext.getProperty("name"),
        currentQuantity: this.replenishContext.getProperty("stockQuantity"),
        quantity: 1
      });

      const oDialog = await this.getOrLoadDialog(
        "replenishDialog",
        "playerorders.orders.fragment.ReplenishStockDialog"
      );
      oDialog.open();
    },

    onReplenishStock: async function () {
      const nQuantity = Number(
        this.getUIModel().getProperty("/stockReplenishment/quantity")
      );

      if (!Number.isInteger(nQuantity) || nQuantity <= 0) {
        this.showError(new Error(this.getText("positiveStockRequired")));
        return;
      }

      await this.runBusy(async () => {
        await this.executeAction(
          "replenishStock",
          this.replenishContext,
          { quantity: nQuantity }
        );
        this.closeDialog("replenishDialog");
        this.refreshItems("productsTable");
        this.showToast("stockReplenished");
      });
    },

    onCancelReplenish: function () {
      this.closeDialog("replenishDialog");
    }
  });
});
