const { data } = require("./support/order-service");

describe("PlayerOrderService", () => {
  beforeEach(data.reset);

  require("./suites/authorization");
  require("./suites/product-management");
  require("./suites/order-lifecycle");
});
