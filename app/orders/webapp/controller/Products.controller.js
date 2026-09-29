sap.ui.define([
  "./BaseController",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageToast) {
  "use strict";

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
        stockQuantity: 0,
        imageName: ""
      });
      this.newProductImageFile = null;

      if (!this.createProductDialog) {
        this.createProductDialog = await this.loadFragment({
          name: "playerorders.orders.fragment.CreateProductDialog"
        });
      }
      this.byId("createProductImageUploader").clear();
      this.createProductDialog.open();
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
        this.showError(new Error(
          this.getResourceBundle().getText("completeProductFields")
        ));
        return;
      }

      this.setBusy(true);
      try {
        const oImage = this.newProductImageFile
          ? await this.readProductImage(this.newProductImageFile)
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

    onOpenImageUpload: async function (oEvent) {
      this.imageProductContext = oEvent.getSource().getBindingContext();
      this.productImageFile = null;
      this.getUIModel().setProperty("/productImageUpload", {
        productName: this.imageProductContext.getProperty("name"),
        imageName: ""
      });

      if (!this.productImageDialog) {
        this.productImageDialog = await this.loadFragment({
          name: "playerorders.orders.fragment.UploadProductImageDialog"
        });
      }
      this.byId("productImageUploader").clear();
      this.productImageDialog.open();
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
        this.showError(new Error(
          this.getResourceBundle().getText("selectProductImage")
        ));
        return;
      }

      this.setBusy(true);
      try {
        const oImage = await this.readProductImage(this.productImageFile);
        await this.executeAction("setImage", this.imageProductContext, oImage);
        this.productImageDialog.close();
        this.byId("productsTable").getBinding("items").refresh();
        MessageToast.show(this.getResourceBundle().getText("productImageUploaded"));
      } catch (oError) {
        this.showError(oError);
      } finally {
        this.setBusy(false);
      }
    },

    onCancelImageUpload: function () {
      this.productImageDialog.close();
    },

    onImageTypeMismatch: function () {
      this.showError(new Error(
        this.getResourceBundle().getText("invalidImageType")
      ));
    },

    onImageSizeExceeded: function () {
      this.showError(new Error(
        this.getResourceBundle().getText("imageTooLarge")
      ));
    },

    readProductImage: function (oFile) {
      if (!IMAGE_TYPES.includes(oFile.type)) {
        return Promise.reject(new Error(
          this.getResourceBundle().getText("invalidImageType")
        ));
      }

      if (oFile.size > MAX_IMAGE_SIZE) {
        return Promise.reject(new Error(
          this.getResourceBundle().getText("imageTooLarge")
        ));
      }

      return new Promise((resolve, reject) => {
        const oReader = new FileReader();
        oReader.onload = () => resolve({
          image: String(oReader.result).split(",")[1],
          imageType: oFile.type,
          imageName: oFile.name
        });
        oReader.onerror = () => reject(new Error(
          this.getResourceBundle().getText("imageReadFailed")
        ));
        oReader.readAsDataURL(oFile);
      });
    },

    formatProductImageUrl: function (sID, sImageType, sModifiedAt) {
      if (!sID || !sImageType) {
        return "";
      }

      const sVersion = encodeURIComponent(sModifiedAt || "");
      return `/orders/GameProducts(ID=${sID})/image?v=${sVersion}`;
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
