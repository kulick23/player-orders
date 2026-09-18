import cds, { Request } from "@sap/cds";
const { SELECT, UPDATE, INSERT } = cds.ql;
export default class PlayerOrderService extends cds.ApplicationService {
  async init() {
    const { SalesOrders, SalesOrderItems, GameProducts } = this.entities;

    const customerIDFor = async (req: Request) => {
      const rawPlayerID = req.user.attr?.playerId as
        | string
        | string[]
        | undefined;
      const playerID = Array.isArray(rawPlayerID)
        ? rawPlayerID[0]
        : rawPlayerID;

      if (!playerID) {
        return req.reject(403, "The Customer role requires a playerId attribute");
      }

      const customer = await cds.tx(req).run(
        SELECT.one
          .from("playerorders.Customer")
          .columns("ID")
          .where({ playerId: playerID }),
      );

      if (!customer) {
        return req.reject(403, "No customer is linked to the current user");
      }

      return customer.ID as string;
    };

    this.before("CREATE", SalesOrders, async (req) => {
      req.data.orderDate ??= new Date().toISOString();
      req.data.status_code ??= "NEW";

      if (req.user.is("Customer") && !req.user.is("SalesAdmin")) {
        req.data.customer_ID = await customerIDFor(req);
      }

      const items = req.data.items ?? [];
      let subtotal = 0;

      for (const item of items) {
        const product = await SELECT.one
          .from(GameProducts)
          .columns("price", "active")
          .where({ ID: item.product_ID });

        if (!product) {
          return req.reject(404, "Product not found");
        }

        if (!product.active) {
          return req.reject(400, `Product ${item.product_ID} is inactive`);
        }

        const quantity = item.quantity ?? 1;
        const price = Number(product.price);

        item.quantity = quantity;
        item.unitPrice = price;
        item.lineAmount = Number((price * quantity).toFixed(2));

        subtotal += item.lineAmount;
      }

      const discount = Number(req.data.discountAmount ?? 0);

      req.data.totalAmount = Number(
        Math.max(0, subtotal - discount).toFixed(2),
      );
    });
    const calculateItemAmounts = async (req: Request) => {
      const tx = cds.tx(req);
      let currentItem: any = {};
      const itemKey = req.params?.[req.params.length - 1];
      const itemID = req.data.ID ?? itemKey?.ID;

      if (itemID) {
        currentItem =
          (await tx.run(
            SELECT.one
              .from(SalesOrderItems.drafts!)
              .where({ ID: itemID }),
          )) ?? {};
      }

      const productID = req.data.product_ID ?? currentItem.product_ID;
      const quantity = Number(
        req.data.quantity ?? currentItem.quantity ?? 1,
      );

      // A new draft item exists before the user chooses a product.
      if (!productID) {
        return;
      }

      const product = await tx.run(
        SELECT.one
          .from(GameProducts)
          .columns("price", "active")
          .where({ ID: productID }),
      );

      if (!product) {
        return req.reject(404, "Product not found");
      }

      if (!product.active) {
        return req.reject(400, "Inactive products cannot be ordered");
      }

      const unitPrice = Number(product.price);

      req.data.quantity = quantity;
      req.data.unitPrice = unitPrice;
      req.data.lineAmount = Number((unitPrice * quantity).toFixed(2));
    };

    this.before("CREATE", SalesOrderItems, calculateItemAmounts);
    this.before("PATCH", SalesOrderItems.drafts!, calculateItemAmounts);
    this.before("PATCH", SalesOrders.drafts!, async (req) => {
      if (req.user.is("Customer") && !req.user.is("SalesAdmin")) {
        const protectedFields = [
          "status_code",
          "totalAmount",
          "paymentMethod",
          "orderDate",
        ];
        const changedProtectedFields = protectedFields.filter((field) =>
          Object.prototype.hasOwnProperty.call(req.data, field),
        );

        if (changedProtectedFields.length > 0) {
          return req.reject(
            403,
            `Customers cannot change system fields: ${changedProtectedFields.join(", ")}`,
          );
        }

        const customerID = await customerIDFor(req);

        if (req.data.customer_ID && req.data.customer_ID !== customerID) {
          return req.reject(403, "Customers cannot assign orders to another player");
        }
      }
    });

    this.before("SAVE", SalesOrders.drafts!, async (req) => {
      if (req.user.is("Customer") && !req.user.is("SalesAdmin")) {
        req.data.customer_ID = await customerIDFor(req);
      }

      const subtotal = (req.data.items ?? []).reduce(
        (sum: number, item: { lineAmount?: number }) =>
          sum + Number(item.lineAmount ?? 0),
        0,
      );

      const discount = Number(req.data.discountAmount ?? 0);
      if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
        return req.reject(
          400,
          "Discount must be between 0 and the items subtotal",
        );
      }

      req.data.totalAmount = Number((subtotal - discount).toFixed(2));
    });
    this.on("submitOrder", SalesOrders, async (req) => {
      const { ID } = req.params[0];
      const tx = cds.tx(req);

      const order = await tx.run(
        SELECT.one.from("playerorders.SalesOrder").where({ ID }),
      );

      if (!order) {
        return req.reject(404, "Order not found");
      }

      if (order.status_code !== "NEW") {
        return req.reject(
          400,
          `Only NEW orders can be submitted. Current status: ${order.status_code}`,
        );
      }
      const item = await tx.run(
        SELECT.one
          .from("playerorders.SalesOrderItem")
          .columns("ID")
          .where({ order_ID: ID }),
      );

      if (!item) {
        return req.reject(400, "Cannot submit an order without items");
      }

      if (Number(order.totalAmount) <= 0) {
        return req.reject(400, "Order total must be greater than zero");
      }

      await tx.run(
        UPDATE.entity("playerorders.SalesOrder")
          .set({ status_code: "SUBMITTED" })
          .where({ ID }),
      );

      return tx.run(SELECT.one.from("playerorders.SalesOrder").where({ ID }));
    });
    this.on("markAsPaid", SalesOrders, async (req) => {
      const { ID } = req.params[0];
      const { paymentProvider } = req.data;
      const tx = cds.tx(req);

      if (!paymentProvider) {
        return req.reject(400, "Payment provider is required");
      }

      const order = await tx.run(
        SELECT.one.from("playerorders.SalesOrder").where({ ID }),
      );

      if (!order) {
        return req.reject(404, "Order not found");
      }

      if (order.status_code !== "SUBMITTED") {
        return req.reject(
          400,
          `Only SUBMITTED orders can be paid. Current status: ${order.status_code}`,
        );
      }

      await tx.run(
        INSERT.into("playerorders.PaymentTransaction").entries({
          order_ID: ID,
          provider: paymentProvider,
          transactionDate: new Date().toISOString(),
          amount: order.totalAmount,
          status: "SUCCESS",
          message: "Payment completed",
        }),
      );

      await tx.run(
        UPDATE.entity("playerorders.SalesOrder")
          .set({
            status_code: "PAID",
            paymentMethod: paymentProvider,
          })
          .where({ ID }),
      );

      return tx.run(SELECT.one.from("playerorders.SalesOrder").where({ ID }));
    });
    this.on("fulfillOrder", SalesOrders, async (req) => {
      const { ID } = req.params[0];
      const tx = cds.tx(req);

      const order = await tx.run(
        SELECT.one.from("playerorders.SalesOrder").where({ ID }),
      );

      if (!order) {
        return req.reject(404, "Order not found");
      }

      if (order.status_code !== "PAID") {
        return req.reject(
          400,
          `Only PAID orders can be fulfilled. Current status: ${order.status_code}`,
        );
      }

      const items = await tx.run(
        SELECT.from("playerorders.SalesOrderItem").where({ order_ID: ID }),
      );

      for (const item of items) {
        const product = await tx.run(
          SELECT.one
            .from("playerorders.GameProduct")
            .where({ ID: item.product_ID }),
        );

        if (product.stockRelevant) {
          if (product.stockQuantity < item.quantity) {
            return req.reject(409, `Not enough stock for ${product.name}`);
          }

          await tx.run(
            UPDATE.entity("playerorders.GameProduct")
              .set({
                stockQuantity: product.stockQuantity - item.quantity,
              })
              .where({ ID: product.ID }),
          );
        }

        await tx.run(
          INSERT.into("playerorders.FulfillmentLog").entries({
            order_ID: ID,
            product_ID: product.ID,
            fulfilledAt: new Date().toISOString(),
            result: "SUCCESS",
            message: `${product.name} fulfilled`,
          }),
        );
      }

      await tx.run(
        UPDATE.entity("playerorders.SalesOrder")
          .set({ status_code: "FULFILLED" })
          .where({ ID }),
      );

      return tx.run(SELECT.one.from("playerorders.SalesOrder").where({ ID }));
    });

    this.on("cancelOrder", SalesOrders, async (req) => {
      const { ID } = req.params[0];
      const reason = String(req.data.reason ?? "").trim();
      const tx = cds.tx(req);

      if (!reason) {
        return req.reject(400, "Cancellation reason is required");
      }

      const order = await tx.run(
        SELECT.one.from("playerorders.SalesOrder").where({ ID }),
      );

      if (!order) {
        return req.reject(404, "Order not found");
      }

      if (!["NEW", "SUBMITTED"].includes(order.status_code)) {
        return req.reject(
          400,
          `Order with status ${order.status_code} cannot be cancelled`,
        );
      }

      const cancellationNote = order.note
        ? `${order.note}\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;

      await tx.run(
        UPDATE.entity("playerorders.SalesOrder")
          .set({
            status_code: "CANCELLED",
            note: cancellationNote,
          })
          .where({ ID }),
      );

      return tx.run(SELECT.one.from("playerorders.SalesOrder").where({ ID }));
    });
    return super.init();
  }
}
