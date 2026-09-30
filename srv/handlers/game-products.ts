import cds, { Request } from "@sap/cds";

const { SELECT, UPDATE } = cds.ql;

const MAX_PRODUCT_IMAGE_SIZE = 2 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateGameProduct(req: Request) {
  if (Object.prototype.hasOwnProperty.call(req.data, "price")) {
    const price = Number(req.data.price);
    if (!Number.isFinite(price) || price < 0) {
      return req.reject(400, "Product price cannot be negative");
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.data, "stockQuantity")) {
    const stockQuantity = Number(req.data.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return req.reject(400, "Stock quantity must be a non-negative integer");
    }
  }
}

export async function replenishStock(req: Request) {
  const { ID } = req.params[0];
  const quantity = Number(req.data.quantity);
  const tx = cds.tx(req);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return req.reject(400, "Replenishment quantity must be a positive integer");
  }

  const product = await tx.run(
    SELECT.one.from("playerorders.GameProduct").where({ ID }),
  );

  if (!product) {
    return req.reject(404, "Product not found");
  }

  if (!product.stockRelevant) {
    return req.reject(400, "Stock is not tracked for this product");
  }

  await tx.run(
    UPDATE.entity("playerorders.GameProduct")
      .set({ stockQuantity: Number(product.stockQuantity) + quantity })
      .where({ ID }),
  );

  return tx.run(SELECT.one.from("playerorders.GameProduct").where({ ID }));
}

export async function setProductImage(req: Request) {
  const { ID } = req.params[0];
  const imageType = String(req.data.imageType || "").toLowerCase();
  const imageName = String(req.data.imageName || "").trim();
  const image = Buffer.isBuffer(req.data.image)
    ? req.data.image
    : Buffer.from(String(req.data.image || ""), "base64");
  const tx = cds.tx(req);

  if (!PRODUCT_IMAGE_TYPES.has(imageType)) {
    return req.reject(400, "Only JPEG, PNG, and WebP images are supported");
  }

  if (!image.length || image.length > MAX_PRODUCT_IMAGE_SIZE) {
    return req.reject(400, "Product image must be between 1 byte and 2 MB");
  }

  const product = await tx.run(
    SELECT.one.from("playerorders.GameProduct").columns("ID").where({ ID }),
  );

  if (!product) {
    return req.reject(404, "Product not found");
  }

  await tx.run(
    UPDATE.entity("playerorders.GameProduct")
      .set({ image, imageType, imageName })
      .where({ ID }),
  );

  return tx.run(SELECT.one.from("playerorders.GameProduct").where({ ID }));
}
