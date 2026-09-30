import cds from "@sap/cds";
import { readConfiguration } from "./handlers/configuration.js";
import {
  replenishStock,
  setProductImage,
  validateGameProduct,
} from "./handlers/game-products.js";
import {
  enrichProductStockStatus,
  getInventorySummary,
} from "./handlers/product-queries.js";
import { createCalculateItemAmountsHandler } from "./handlers/sales-order-items.js";
import {
  cancelOrder,
  submitOrder,
} from "./handlers/sales-order-lifecycle.js";
import {
  createPrepareSalesOrderHandler,
  prepareSalesOrderDraftSave,
  protectCustomerDraftFields,
} from "./handlers/sales-order-drafts.js";
import { fulfillOrder } from "./handlers/sales-order-fulfillment.js";
import { markOrderAsPaid } from "./handlers/sales-order-payment.js";

export default class PlayerOrderService extends cds.ApplicationService {
  async init() {
    const { Configuration, SalesOrders, SalesOrderItems, GameProducts } =
      this.entities;
    const calculateItemAmounts = createCalculateItemAmountsHandler(
      GameProducts,
      SalesOrderItems.drafts!,
    );

    this.on("READ", Configuration, readConfiguration);
    this.on("getInventorySummary", getInventorySummary);

    this.before(["CREATE", "UPDATE"], GameProducts, validateGameProduct);
    this.after("READ", GameProducts, enrichProductStockStatus);
    this.on("replenishStock", GameProducts, replenishStock);
    this.on("setImage", GameProducts, setProductImage);

    this.before(
      "CREATE",
      SalesOrders,
      createPrepareSalesOrderHandler(GameProducts),
    );
    this.before("PATCH", SalesOrders.drafts!, protectCustomerDraftFields);
    this.before("SAVE", SalesOrders.drafts!, prepareSalesOrderDraftSave);
    this.on("submitOrder", SalesOrders, submitOrder);
    this.on("markAsPaid", SalesOrders, markOrderAsPaid);
    this.on("fulfillOrder", SalesOrders, fulfillOrder);
    this.on("cancelOrder", SalesOrders, cancelOrder);

    this.before("CREATE", SalesOrderItems, calculateItemAmounts);
    this.before("PATCH", SalesOrderItems.drafts!, calculateItemAmounts);

    return super.init();
  }
}
