sap.ui.define([
  "./BaseController",
  "../model/formatter",
  "sap/m/MessageBox"
], function (BaseController, formatter, MessageBox) {
  "use strict";

  return BaseController.extend("playerorders.orders.controller.OrderDetails", {
    formatter: formatter,

    onInit: function () {
      this.getRouter().getRoute("orderDetails").attachPatternMatched(
        this.onRouteMatched,
        this
      );
    },

    onRouteMatched: function (oEvent) {
      const sOrderID = oEvent.getParameter("arguments").orderId;
      this.getView().bindElement({
        path: `/SalesOrders(ID=${sOrderID},IsActiveEntity=true)`,
        parameters: {
          $expand: "customer,status,items($expand=product),payments,fulfillments($expand=product)"
        },
        events: {
          dataRequested: () => this.setBusy(true),
          dataReceived: (oDataEvent) => {
            this.setBusy(false);
            if (oDataEvent.getParameter("error")) {
              this.showError(oDataEvent.getParameter("error"));
            }
          },
          change: () => {
            const oContext = this.getView().getBindingContext();
            if (!oContext) {
              this.getRouter().navTo("orders", {}, true);
            }
          }
        }
      });
    },

    onNavBack: function () {
      this.getRouter().navTo("orders");
    },

    onRefresh: function () {
      const oBinding = this.getView().getElementBinding();
      if (oBinding) {
        oBinding.refresh();
      }
    },

    onSubmitOrder: async function () {
      const bConfirmed = await this.confirm("confirmSubmitOrder");
      if (bConfirmed) {
        await this.runAction("submitOrder", {}, "orderSubmitted");
      }
    },

    onOpenPayment: async function () {
      this.getUIModel().setProperty("/paymentProvider", "STRIPE");
      const oDialog = await this.getOrLoadDialog(
        "paymentDialog",
        "playerorders.orders.fragment.PaymentDialog"
      );
      oDialog.open();
    },

    onConfirmPayment: async function () {
      const sProvider = this.getUIModel().getProperty("/paymentProvider");
      const bSucceeded = await this.runAction(
        "markAsPaid",
        { paymentProvider: sProvider },
        "orderPaid"
      );
      if (bSucceeded) {
        this.closeDialog("paymentDialog");
      }
    },

    onClosePayment: function () {
      this.closeDialog("paymentDialog");
    },

    onFulfillOrder: async function () {
      const bConfirmed = await this.confirm("confirmFulfillOrder");
      if (bConfirmed) {
        await this.runAction("fulfillOrder", {}, "orderFulfilled");
      }
    },

    onOpenCancel: async function () {
      this.getUIModel().setProperty("/cancellationReason", "");
      const oDialog = await this.getOrLoadDialog(
        "cancelDialog",
        "playerorders.orders.fragment.CancelOrderDialog"
      );
      oDialog.open();
    },

    onConfirmCancel: async function () {
      const sReason = this.getUIModel()
        .getProperty("/cancellationReason")
        .trim();
      if (!sReason) {
        this.showError(new Error(this.getText("cancellationReasonRequired")));
        return;
      }
      const bSucceeded = await this.runAction(
        "cancelOrder",
        { reason: sReason },
        "orderCancelled"
      );
      if (bSucceeded) {
        this.closeDialog("cancelDialog");
      }
    },

    onCloseCancel: function () {
      this.closeDialog("cancelDialog");
    },

    onOpenEdit: async function () {
      await this.runBusy(async () => {
        const oContext = this.getView().getBindingContext();
        const oItemsBinding = this.getModel().bindList(
          "items",
          oContext,
          null,
          null,
          { $select: "ID,product_ID,quantity" }
        );
        const aItemContexts = await oItemsBinding.requestContexts(0, 1000);
        const aItems = aItemContexts.map((oItemContext) => ({
          ID: oItemContext.getProperty("ID"),
          productID: oItemContext.getProperty("product_ID"),
          quantity: Number(oItemContext.getProperty("quantity") || 1)
        }));

        this.getUIModel().setProperty("/editOrder", {
          customerID: oContext.getProperty("customer_ID"),
          discountAmount: Number(oContext.getProperty("discountAmount") || 0),
          note: oContext.getProperty("note") || "",
          items: aItems.length > 0
            ? aItems
            : [{ productID: "", quantity: 1 }]
        });
        const oDialog = await this.getOrLoadDialog(
          "editDialog",
          "playerorders.orders.fragment.EditOrderDialog"
        );
        oDialog.open();
      });
    },

    onAddEditOrderItem: function () {
      const aItems = this.getUIModel().getProperty("/editOrder/items");
      aItems.push({ productID: "", quantity: 1 });
      this.getUIModel().setProperty("/editOrder/items", [...aItems]);
    },

    onRemoveEditOrderItem: function (oEvent) {
      const sPath = oEvent.getSource().getBindingContext("ui").getPath();
      const iIndex = Number(sPath.split("/").pop());
      const aItems = this.getUIModel().getProperty("/editOrder/items");
      aItems.splice(iIndex, 1);
      if (aItems.length === 0) {
        aItems.push({ productID: "", quantity: 1 });
      }
      this.getUIModel().setProperty("/editOrder/items", [...aItems]);
    },

    onSaveEdit: async function () {
      const oActiveContext = this.getView().getBindingContext();
      const oEditData = this.getUIModel().getProperty("/editOrder");
      const sRoleCode = this.getUIModel().getProperty("/capabilities/roleCode");
      const bInvalidItems = oEditData.items.some(
        (oItem) => !oItem.productID || Number(oItem.quantity) < 1
      );

      if ((sRoleCode === "SalesAdmin" && !oEditData.customerID) || bInvalidItems) {
        this.showError(new Error(this.getText("completeRequiredFields")));
        return;
      }

      await this.runBusy(async () => {
        const sOrderID = oActiveContext.getProperty("ID");
        const sActivePath = `/SalesOrders(ID=${sOrderID},IsActiveEntity=true)`;
        const sDraftPath = `/SalesOrders(ID=${sOrderID},IsActiveEntity=false)`;
        const oDraftStateBinding = this.getModel().bindContext(
          sActivePath,
          null,
          { $select: "HasDraftEntity" }
        );
        const oDraftState = await oDraftStateBinding.requestObject();

        if (!oDraftState.HasDraftEntity) {
          await this.executeAction(
            "draftEdit",
            oActiveContext,
            { PreserveChanges: true }
          );
        }

        const oDraftBinding = this.getModel().bindContext(sDraftPath);
        const oDraftContext = oDraftBinding.getBoundContext();
        await oDraftContext.requestObject();

        const aUpdates = [oDraftContext.setProperty("note", oEditData.note)];
        if (sRoleCode === "SalesAdmin") {
          aUpdates.push(oDraftContext.setProperty(
            "customer_ID",
            oEditData.customerID
          ));
          aUpdates.push(oDraftContext.setProperty(
            "discountAmount",
            Number(oEditData.discountAmount || 0)
          ));
        }
        await Promise.all(aUpdates);

        const oItemsBinding = this.getModel().bindList(
          "items",
          oDraftContext,
          null,
          null,
          { $select: "ID,product_ID,quantity" }
        );
        const aDraftItemContexts = await oItemsBinding.requestContexts(0, 1000);
        const mDraftItems = new Map(
          aDraftItemContexts.map((oItemContext) => [
            oItemContext.getProperty("ID"),
            oItemContext
          ])
        );
        const oDesiredItemIDs = new Set(
          oEditData.items.map((oItem) => oItem.ID).filter(Boolean)
        );

        await Promise.all(aDraftItemContexts
          .filter((oItemContext) =>
            !oDesiredItemIDs.has(oItemContext.getProperty("ID"))
          )
          .map((oItemContext) => oItemContext.delete()));

        const aItemUpdates = [];
        const aCreatedItems = [];
        oEditData.items.forEach((oItem) => {
          const oItemContext = oItem.ID && mDraftItems.get(oItem.ID);
          if (oItemContext) {
            aItemUpdates.push(
              oItemContext.setProperty("product_ID", oItem.productID),
              oItemContext.setProperty("quantity", Number(oItem.quantity))
            );
          } else {
            aCreatedItems.push(oItemsBinding.create({
              product_ID: oItem.productID,
              quantity: Number(oItem.quantity)
            }));
          }
        });
        await Promise.all(aItemUpdates);
        await Promise.all(aCreatedItems.map((oItemContext) =>
          oItemContext.created()
        ));

        await this.executeAction("draftActivate", oDraftContext);
        this.closeDialog("editDialog");
        this.getModel().refresh();
        this.showToast("orderUpdated");
      });
    },

    onCloseEdit: function () {
      this.closeDialog("editDialog");
    },

    onDeleteOrder: async function () {
      const bConfirmed = await this.confirm("confirmDeleteOrder");
      if (!bConfirmed) {
        return;
      }

      await this.runBusy(async () => {
        await this.getView().getBindingContext().delete();
        this.showToast("orderDeleted");
        this.getRouter().navTo("orders", {}, true);
      });
    },

    runAction: async function (sAction, mParameters, sSuccessText) {
      const bSucceeded = await this.runBusy(async () => {
        await this.executeAction(
          sAction,
          this.getView().getBindingContext(),
          mParameters
        );
        this.getModel().refresh();
        this.showToast(sSuccessText);
        return true;
      });
      return bSucceeded === true;
    },

    confirm: function (sTextKey) {
      return new Promise((resolve) => {
        MessageBox.confirm(this.getText(sTextKey), {
          onClose: (sAction) => resolve(sAction === MessageBox.Action.OK)
        });
      });
    }
  });
});
