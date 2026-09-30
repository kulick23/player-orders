const cds = require("@sap/cds");

const { GET, POST, PATCH, expect, data } = cds.test(__dirname + "/../..");

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

const productActionPath = (id, action) =>
  `/orders/GameProducts(ID=${id})/PlayerOrderService.${action}`;

const options = (auth, allowError = false) => ({
  auth,
  ...(allowError ? { validateStatus: () => true } : {}),
});

module.exports = {
  GET,
  POST,
  PATCH,
  expect,
  data,
  CUSTOMER,
  SALES,
  WAREHOUSE,
  IGOR_ORDER_ID,
  DANIEL_ORDER_ID,
  IGOR_CUSTOMER_ID,
  DANIEL_CUSTOMER_ID,
  SHIRT_PRODUCT_ID,
  orderPath,
  actionPath,
  productActionPath,
  options,
};
