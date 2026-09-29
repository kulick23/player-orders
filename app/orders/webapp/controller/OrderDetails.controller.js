sap.ui.define([
  "./BaseController",
  "../model/formatter",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (BaseController, formatter, MessageBox, MessageToast) {
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
      if (!this.paymentDialog) {
        this.paymentDialog = await this.loadFragment({
          name: "playerorders.orders.fragment.PaymentDialog"
        });
      }
      this.paymentDialog.open();
    },

    onConfirmPayment: async function () {
      const sProvider = this.getUIModel().getProperty("/paymentProvider");
      await this.runAction(
        "markAsPaid",
        { paymentProvider: sProvider },
        "orderPaid"
      );
      this.paymentDialog.close();
    },

    onClosePayment: function () {
      this.paymentDialog.close();
    },

    onFulfillOrder: async function () {
      const bConfirmed = await this.confirm("confirmFulfillOrder");
      if (bConfirmed) {
        await this.runAction("fulfillOrder", {}, "orderFulfilled");
      }
    },

    onOpenCancel: async function () {
      this.getUIModel().setProperty("/cancellationReason", "");
      if (!this.cancelDialog) {
        this.cancelDialog = await this.loadFragment({
          name: "playerorders.orders.fragment.CancelOrderDialog"
        });
      }
      this.cancelDialog.open();
    },

    onConfirmCancel: async function () {
      const sReason = this.getUIModel()
        .getProperty("/cancellationReason")
        .trim();
      if (!sReason) {
        this.showError(new Error(this.getText("cancellationReasonRequired")));
        return;
      }
      await this.runAction(
        "cancelOrder",
        { reason: sReason },
        "orderCancelled"
      );
      this.cancelDialog.close();
    },

    onCloseCancel: function () {
      this.cancelDialog.close();
    },

    onOpenEdit: async function () {
      const oContext = this.getView().getBindingContext();
      this.getUIModel().setProperty("/editOrder", {
        customerID: oContext.getProperty("customer_ID"),
        discountAmount: Number(oContext.getProperty("discountAmount") || 0),
        note: oContext.getProperty("note") || ""
      });
      if (!this.editDialog) {
        this.editDialog = await this.loadFragment({
          name: "playerorders.orders.fragment.EditOrderDialog"
        });
      }
      this.editDialog.open();
    },

    onSaveEdit: async function () {
      const oActiveContext = this.getView().getBindingContext();
      const oEditData = this.getUIModel().getProperty("/editOrder");
      this.setBusy(true);

      try {
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
        this.editDialog.close();
        this.getModel().refresh();
        MessageToast.show(this.getText("orderUpdated"));
      } catch (oError) {
        this.showError(oError);
      } finally {
        this.setBusy(false);
      }
    },

    onCloseEdit: function () {
      this.editDialog.close();
    },

    onDeleteOrder: async function () {
      const bConfirmed = await this.confirm("confirmDeleteOrder");
      if (!bConfirmed) {
        return;
      }

      this.setBusy(true);
      try {
        await this.getView().getBindingContext().delete();
        MessageToast.show(this.getText("orderDeleted"));
        this.getRouter().navTo("orders", {}, true);
      } catch (oError) {
        this.showError(oError);
      } finally {
        this.setBusy(false);
      }
    },

    runAction: async function (sAction, mParameters, sSuccessText) {
      this.setBusy(true);
      try {
        await this.executeAction(
          sAction,
          this.getView().getBindingContext(),
          mParameters
        );
        this.getModel().refresh();
        MessageToast.show(this.getText(sSuccessText));
      } catch (oError) {
        this.showError(oError);
      } finally {
        this.setBusy(false);
      }
    },

    confirm: function (sTextKey) {
      return new Promise((resolve) => {
        MessageBox.confirm(this.getText(sTextKey), {
          onClose: (sAction) => resolve(sAction === MessageBox.Action.OK)
        });
      });
    },

    getText: function (sKey) {
      return this.getModel("i18n").getResourceBundle().getText(sKey);
    }
  });
});
