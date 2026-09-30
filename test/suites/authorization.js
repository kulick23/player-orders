const {
  GET,
  POST,
  expect,
  CUSTOMER,
  SALES,
  WAREHOUSE,
  IGOR_ORDER_ID,
  DANIEL_ORDER_ID,
  IGOR_CUSTOMER_ID,
  orderPath,
  actionPath,
  options,
} = require("../support/order-service");

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
      canCreateProduct: false,
      canReplenishStock: false,
      canManageProductImage: false,
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
      canCreateProduct: true,
      canReplenishStock: true,
      canManageProductImage: true,
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
      canCreateProduct: true,
      canReplenishStock: true,
      canManageProductImage: true,
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
