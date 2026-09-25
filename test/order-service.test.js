const cds = require("@sap/cds");

const { GET, POST, PATCH, expect, data } = cds.test(__dirname + "/..");

const CUSTOMER = { username: "customer", password: "customer" };
const SALES = { username: "sales", password: "sales" };
const WAREHOUSE = { username: "warehouse", password: "warehouse" };

const IGOR_ORDER_ID = "aaaaaaaa-4444-4444-8444-444444444444";
const DANIEL_ORDER_ID = "aaaaaaaa-1111-4111-8111-111111111111";
const IGOR_CUSTOMER_ID = "cccccccc-4444-4444-8444-444444444444";
const DANIEL_CUSTOMER_ID = "cccccccc-1111-4111-8111-111111111111";
const SHIRT_PRODUCT_ID = "88888888-8888-4888-8888-888888888888";

const orderPath = (id) =>
  `/orders/SalesOrders(ID=${id},IsActiveEntity=true)`;

const actionPath = (id, action) =>
  `${orderPath(id)}/PlayerOrderService.${action}`;

const options = (auth, allowError = false) => ({
  auth,
  ...(allowError ? { validateStatus: () => true } : {}),
});

describe("PlayerOrderService", () => {
  beforeEach(data.reset);

  describe("authentication and role access", () => {
    it("rejects anonymous requests", async () => {
      const response = await GET("/orders/SalesOrders", {
        validateStatus: () => true,
      });

      expect(response.status).to.equal(401);
    });

    it("allows a customer to read only their own orders", async () => {
      const response = await GET(
        "/orders/SalesOrders?$select=ID,customer_ID,status_code",
        options(CUSTOMER),
      );

      expect(response.status).to.equal(200);
      expect(response.data.value).to.have.length(1);
      expect(response.data.value[0]).to.include({
        ID: IGOR_ORDER_ID,
        customer_ID: IGOR_CUSTOMER_ID,
        status_code: "NEW",
      });
    });

    it("allows a customer to read only their own customer profile", async () => {
      const response = await GET(
        "/orders/Customers?$select=ID,displayName,playerId",
        options(CUSTOMER),
      );

      expect(response.data.value).to.have.length(1);
      expect(response.data.value[0]).to.include({
        ID: IGOR_CUSTOMER_ID,
        displayName: "Igor",
      });
    });

    it("hides another customer's order from a customer", async () => {
      const response = await GET(
        orderPath(DANIEL_ORDER_ID),
        options(CUSTOMER, true),
      );

      expect(response.status).to.equal(404);
    });

    it("allows a sales administrator to read all orders", async () => {
      const response = await GET(
        "/orders/SalesOrders?$select=ID",
        options(SALES),
      );

      expect(response.data.value).to.have.length(4);
    });

    it("allows a warehouse manager to read all orders", async () => {
      const response = await GET(
        "/orders/SalesOrders?$select=ID",
        options(WAREHOUSE),
      );

      expect(response.data.value).to.have.length(4);
    });

    it("returns customer UI capabilities", async () => {
      const response = await GET(
        "/orders/Configuration",
        options(CUSTOMER),
      );

      expect(response.data).to.include({
        canCreateOrder: true,
        canUpdateOrder: true,
        canDeleteOrder: true,
        canSubmitOrder: true,
        canMarkAsPaid: false,
        canFulfillOrder: false,
        canCancelOrder: true,
      });
    });

    it("returns sales administrator UI capabilities", async () => {
      const response = await GET(
        "/orders/Configuration",
        options(SALES),
      );

      expect(response.data).to.include({
        canCreateOrder: true,
        canUpdateOrder: true,
        canDeleteOrder: true,
        canSubmitOrder: true,
        canMarkAsPaid: true,
        canFulfillOrder: false,
        canCancelOrder: true,
      });
    });

    it("returns warehouse manager UI capabilities", async () => {
      const response = await GET(
        "/orders/Configuration",
        options(WAREHOUSE),
      );

      expect(response.data).to.include({
        canCreateOrder: false,
        canUpdateOrder: false,
        canDeleteOrder: false,
        canSubmitOrder: false,
        canMarkAsPaid: false,
        canFulfillOrder: true,
        canCancelOrder: false,
      });
    });

    it("forbids a warehouse manager from creating orders", async () => {
      const response = await POST(
        "/orders/SalesOrders",
        { note: "This order must not be created" },
        options(WAREHOUSE, true),
      );

      expect(response.status).to.equal(403);
    });

    it("forbids a customer from marking an order as paid", async () => {
      const response = await POST(
        actionPath(IGOR_ORDER_ID, "markAsPaid"),
        { paymentProvider: "STRIPE" },
        options(CUSTOMER, true),
      );

      expect(response.status).to.equal(403);
    });

    it("forbids a warehouse manager from marking an order as paid", async () => {
      const response = await POST(
        actionPath(IGOR_ORDER_ID, "markAsPaid"),
        { paymentProvider: "STRIPE" },
        options(WAREHOUSE, true),
      );

      expect(response.status).to.equal(403);
    });

    it("forbids a customer from changing product stock", async () => {
      const response = await PATCH(
        `/orders/GameProducts(ID=${SHIRT_PRODUCT_ID})`,
        { stockQuantity: 45 },
        options(CUSTOMER, true),
      );

      expect(response.status).to.equal(403);
    });

    it("allows a warehouse manager to change product stock", async () => {
      const updated = await PATCH(
        `/orders/GameProducts(ID=${SHIRT_PRODUCT_ID})`,
        { stockQuantity: 45 },
        options(WAREHOUSE),
      );
      const product = await GET(
        `/orders/GameProducts(ID=${SHIRT_PRODUCT_ID})?$select=stockQuantity`,
        options(WAREHOUSE),
      );

      expect(updated.status).to.equal(200);
      expect(product.data.stockQuantity).to.equal(45);
    });

    it("prevents direct writes to payment history", async () => {
      const response = await POST(
        "/orders/Payments",
        {
          order_ID: DANIEL_ORDER_ID,
          provider: "MANUAL",
          amount: 1,
          status: "SUCCESS",
        },
        options(SALES, true),
      );
      const payments = await GET(
        "/orders/Payments?$select=ID",
        options(SALES),
      );

      expect(response.status).to.equal(422);
      expect(response.data.error.code).to.equal(
        "DRAFT_MODIFICATION_ONLY_VIA_ROOT",
      );
      expect(payments.data.value).to.have.length(0);
    });
  });

  describe("order lifecycle", () => {
    it("allows a customer to submit their new order", async () => {
      const response = await POST(
        actionPath(IGOR_ORDER_ID, "submitOrder"),
        {},
        options(CUSTOMER),
      );

      expect(response.status).to.equal(200);
      expect(response.data.status_code).to.equal("SUBMITTED");
    });

    it("rejects submitting an order that is not new", async () => {
      const response = await POST(
        actionPath(DANIEL_ORDER_ID, "submitOrder"),
        {},
        options(SALES, true),
      );

      expect(response.status).to.equal(400);
      expect(response.data.error.message).to.contain("Only NEW orders");
    });

    it("requires a payment provider", async () => {
      await POST(
        actionPath(IGOR_ORDER_ID, "submitOrder"),
        {},
        options(CUSTOMER),
      );

      const response = await POST(
        actionPath(IGOR_ORDER_ID, "markAsPaid"),
        {},
        options(SALES, true),
      );

      expect(response.status).to.equal(400);
      expect(response.data.error.message).to.equal(
        "Payment provider is required",
      );
    });

    it("rejects payment for an order that is not submitted", async () => {
      const response = await POST(
        actionPath(IGOR_ORDER_ID, "markAsPaid"),
        { paymentProvider: "STRIPE" },
        options(SALES, true),
      );

      expect(response.status).to.equal(400);
      expect(response.data.error.message).to.contain(
        "Only SUBMITTED orders",
      );
    });

    it("submits and pays an order and records the payment", async () => {
      await POST(
        actionPath(IGOR_ORDER_ID, "submitOrder"),
        {},
        options(CUSTOMER),
      );

      const paid = await POST(
        actionPath(IGOR_ORDER_ID, "markAsPaid"),
        { paymentProvider: "STRIPE" },
        options(SALES),
      );
      const payments = await GET(
        "/orders/Payments?$select=order_ID,provider,amount,status,message",
        options(CUSTOMER),
      );

      expect(paid.data).to.include({
        status_code: "PAID",
        paymentMethod: "STRIPE",
      });
      expect(payments.data.value).to.have.length(1);
      expect(payments.data.value[0]).to.include({
        order_ID: IGOR_ORDER_ID,
        provider: "STRIPE",
        status: "SUCCESS",
        message: "Payment completed",
      });
      expect(Number(payments.data.value[0].amount)).to.equal(4.99);
    });

    it("forbids a customer from fulfilling their paid order", async () => {
      await POST(
        actionPath(IGOR_ORDER_ID, "submitOrder"),
        {},
        options(CUSTOMER),
      );
      await POST(
        actionPath(IGOR_ORDER_ID, "markAsPaid"),
        { paymentProvider: "STRIPE" },
        options(SALES),
      );

      const response = await POST(
        actionPath(IGOR_ORDER_ID, "fulfillOrder"),
        {},
        options(CUSTOMER, true),
      );

      expect(response.status).to.equal(403);
    });

    it("forbids a sales administrator from fulfilling a paid order", async () => {
      const response = await POST(
        actionPath(DANIEL_ORDER_ID, "fulfillOrder"),
        {},
        options(SALES, true),
      );

      expect(response.status).to.equal(403);
    });

    it("allows a warehouse manager to fulfill a paid order", async () => {
      const fulfilled = await POST(
        actionPath(DANIEL_ORDER_ID, "fulfillOrder"),
        {},
        options(WAREHOUSE),
      );
      const logs = await GET(
        "/orders/FulfillmentLogs?$select=order_ID,result,message",
        options(WAREHOUSE),
      );

      expect(fulfilled.data.status_code).to.equal("FULFILLED");
      expect(logs.data.value).to.have.length(2);
      expect(
        logs.data.value.every(
          (entry) =>
            entry.order_ID === DANIEL_ORDER_ID && entry.result === "SUCCESS",
        ),
      ).to.equal(true);
    });

    it("rejects fulfillment for an order that is not paid", async () => {
      const response = await POST(
        actionPath(IGOR_ORDER_ID, "fulfillOrder"),
        {},
        options(WAREHOUSE, true),
      );

      expect(response.status).to.equal(400);
      expect(response.data.error.message).to.contain("Only PAID orders");
    });

    it("allows a customer to cancel their new order with a reason", async () => {
      const response = await POST(
        actionPath(IGOR_ORDER_ID, "cancelOrder"),
        { reason: "Changed my mind" },
        options(CUSTOMER),
      );

      expect(response.data.status_code).to.equal("CANCELLED");
      expect(response.data.note).to.contain(
        "Cancellation reason: Changed my mind",
      );
    });

    it("requires a cancellation reason", async () => {
      const response = await POST(
        actionPath(IGOR_ORDER_ID, "cancelOrder"),
        { reason: "   " },
        options(CUSTOMER, true),
      );

      expect(response.status).to.equal(400);
      expect(response.data.error.message).to.equal(
        "Cancellation reason is required",
      );
    });

    it("rejects cancellation of a paid order", async () => {
      const response = await POST(
        actionPath(DANIEL_ORDER_ID, "cancelOrder"),
        { reason: "Too late" },
        options(SALES, true),
      );

      expect(response.status).to.equal(400);
      expect(response.data.error.message).to.contain("cannot be cancelled");
    });
  });
});
