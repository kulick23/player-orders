const {
  GET,
  POST,
  expect,
  CUSTOMER,
  SALES,
  WAREHOUSE,
  IGOR_ORDER_ID,
  DANIEL_ORDER_ID,
  actionPath,
  options,
} = require("../support/order-service");

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
