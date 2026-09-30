const {
  GET,
  POST,
  PATCH,
  expect,
  CUSTOMER,
  WAREHOUSE,
  SHIRT_PRODUCT_ID,
  productActionPath,
  options,
} = require("../support/order-service");

describe("product management", () => {
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

  it("forbids a customer from creating products", async () => {
    const response = await POST(
      "/orders/GameProducts",
      {
        name: "Customer product",
        price: 1,
        active: true,
        stockRelevant: true,
        stockQuantity: 1,
      },
      options(CUSTOMER, true),
    );

    expect(response.status).to.equal(403);
  });

  it("allows a warehouse manager to create products", async () => {
    const response = await POST(
      "/orders/GameProducts",
      {
        name: "Collector Box",
        description: "Physical collector edition",
        type: "MERCHANDISE",
        price: 39.99,
        active: true,
        stockRelevant: true,
        stockQuantity: 12,
      },
      options(WAREHOUSE),
    );

    expect(response.status).to.equal(201);
    expect(response.data).to.include({
      name: "Collector Box",
      stockQuantity: 12,
    });
  });

  it("allows a warehouse manager to replenish product stock", async () => {
    const response = await POST(
      productActionPath(SHIRT_PRODUCT_ID, "replenishStock"),
      { quantity: 15 },
      options(WAREHOUSE),
    );

    expect(response.status).to.equal(200);
    expect(response.data.stockQuantity).to.equal(65);
  });

  it("allows a warehouse manager to upload a product image", async () => {
    const image = Buffer.from("small test image").toString("base64");
    const response = await POST(
      productActionPath(SHIRT_PRODUCT_ID, "setImage"),
      {
        image,
        imageType: "image/png",
        imageName: "shirt.png",
      },
      options(WAREHOUSE),
    );
    const product = await GET(
      `/orders/GameProducts(ID=${SHIRT_PRODUCT_ID})?$select=imageType,imageName`,
      options(WAREHOUSE),
    );
    const media = await GET(
      `/orders/GameProducts(ID=${SHIRT_PRODUCT_ID})/image`,
      { ...options(WAREHOUSE), responseType: "text" },
    );

    expect(response.status).to.equal(200);
    expect(product.data).to.include({
      imageType: "image/png",
      imageName: "shirt.png",
    });
    expect(media.status).to.equal(200);
    expect(media.headers["content-type"]).to.equal("image/png");
    expect(media.data).to.equal("small test image");
  });

  it("rejects an unsupported product image type", async () => {
    const response = await POST(
      productActionPath(SHIRT_PRODUCT_ID, "setImage"),
      {
        image: Buffer.from("not an image").toString("base64"),
        imageType: "image/svg+xml",
        imageName: "shirt.svg",
      },
      options(WAREHOUSE, true),
    );

    expect(response.status).to.equal(400);
    expect(response.data.error.message).to.equal(
      "Only JPEG, PNG, and WebP images are supported",
    );
  });

  it("rejects an invalid replenishment quantity", async () => {
    const response = await POST(
      productActionPath(SHIRT_PRODUCT_ID, "replenishStock"),
      { quantity: 0 },
      options(WAREHOUSE, true),
    );

    expect(response.status).to.equal(400);
    expect(response.data.error.message).to.equal(
      "Replenishment quantity must be a positive integer",
    );
  });
});
