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
      const oContext = this.getView().getBindingContext();
      this.getUIModel().setProperty("/editOrder", {
        customerID: oContext.getProperty("customer_ID"),
        discountAmount: Number(oContext.getProperty("discountAmount") || 0),
        note: oContext.getProperty("note") || ""
      });
      const oDialog = await this.getOrLoadDialog(
        "editDialog",
        "playerorders.orders.fragment.EditOrderDialog"
      );
      oDialog.open();
    },

    onSaveEdit: async function () {
      const oActiveContext = this.getView().getBindingContext();
      const oEditData = this.getUIModel().getProperty("/editOrder");
      await this.runBusy(async () => {
        const oDraftContext = await this.executeAction(
          "draftEdit",
          oActiveContext,
          { PreserveChanges: true }
        );

        await Promise.all([
          oDraftContext.setProperty("customer_ID", oEditData.customerID),
          oDraftContext.setProperty(
            "discountAmount",
            Number(oEditData.discountAmount || 0)
          ),
          oDraftContext.setProperty("note", oEditData.note)
        ]);

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
