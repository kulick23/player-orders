sap.ui.define([], function () {
  "use strict";

  return {
    statusState: function (sStatus) {
      return {
        NEW: "None",
        SUBMITTED: "Warning",
        PAID: "Success",
        FULFILLED: "Success",
        PAYMENT_FAILED: "Error",
        CANCELLED: "Error"
      }[sStatus] || "None";
    },

    statusIcon: function (sStatus) {
      return {
        SUBMITTED: "sap-icon://pending",
        PAID: "sap-icon://accept",
        FULFILLED: "sap-icon://complete",
        PAYMENT_FAILED: "sap-icon://error",
        CANCELLED: "sap-icon://decline"
      }[sStatus] || "";
    },

    isNew: function (sStatus) {
      return sStatus === "NEW";
    },

    isSubmitted: function (sStatus) {
      return sStatus === "SUBMITTED";
    },

    isPaid: function (sStatus) {
      return sStatus === "PAID";
    },

    isCancellable: function (sStatus) {
      return sStatus === "NEW" || sStatus === "SUBMITTED";
    },

    paymentMethod: function (sPaymentMethod) {
      return sPaymentMethod || "-";
    }
  };
});
