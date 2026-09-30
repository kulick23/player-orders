import cds, { Request } from "@sap/cds";
import {
  MAX_PRODUCT_IMAGE_SIZE,
  PRODUCT_IMAGE_TYPES,
} from "../constants/product-image.js";
import {
  findGameProduct,
  findGameProductID,
  updateGameProduct,
} from "../repositories/game-products.js";

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

  const product = await findGameProduct(tx, ID);

  if (!product) {
    return req.reject(404, "Product not found");
  }

  if (!product.stockRelevant) {
    return req.reject(400, "Stock is not tracked for this product");
  }

  await updateGameProduct(tx, ID, {
    stockQuantity: Number(product.stockQuantity) + quantity,
  });
  return findGameProduct(tx, ID);
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

  const product = await findGameProductID(tx, ID);

  if (!product) {
    return req.reject(404, "Product not found");
  }

  await updateGameProduct(tx, ID, { image, imageType, imageName });
  return findGameProduct(tx, ID);
}
