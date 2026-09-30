sap.ui.define([], function () {
  "use strict";

  const STATUS_STATE = Object.freeze({
    NEW: "None",
    SUBMITTED: "Warning",
    PAID: "Success",
    FULFILLED: "Success",
    PAYMENT_FAILED: "Error",
    CANCELLED: "Error"
  });

  const STATUS_ICON = Object.freeze({
    SUBMITTED: "sap-icon://pending",
    PAID: "sap-icon://accept",
    FULFILLED: "sap-icon://complete",
    PAYMENT_FAILED: "sap-icon://error",
    CANCELLED: "sap-icon://decline"
  });

  const CANCELLABLE_STATUSES = Object.freeze(["NEW", "SUBMITTED"]);

  return {
    statusState: function (sStatus) {
      return STATUS_STATE[sStatus] || "None";
    },

    statusIcon: function (sStatus) {
      return STATUS_ICON[sStatus] || "";
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
      return CANCELLABLE_STATUSES.includes(sStatus);
    },

    paymentMethod: function (sPaymentMethod) {
      return sPaymentMethod || "-";
    }
  };
});
