const {
  GET,
  expect,
  options,
} = require("../support/order-service");

const INTEGRATION = { username: "integration", password: "integration" };
const DANIEL_PLAYER_ID = "bbbbbbbb-1111-1111-1111-111111111111";

describe("order integration API", () => {
  it("rejects a regular business user", async () => {
    const response = await GET(
      `/integration/orders/getPlayerOrderSummary(playerID='${DANIEL_PLAYER_ID}')`,
      options({ username: "sales", password: "sales" }, true),
    );

    expect(response.status).to.equal(403);
  });

  it("returns aggregated order data to a system user", async () => {
    const response = await GET(
      `/integration/orders/getPlayerOrderSummary(playerID='${DANIEL_PLAYER_ID}')`,
      options(INTEGRATION),
    );

    expect(response.status).to.equal(200);
    expect(response.data).to.deep.include({
      orderCount: 1,
      paidOrderCount: 1,
      totalSpent: 29.98,
      lastOrderDate: "2026-09-10T10:30:00Z",
    });
  });
});
