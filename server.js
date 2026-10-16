
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Sample inventory data for the prototype
let products = [
  { id: 1, name: "Wireless Mouse", category: "Electronics", price: 1500, stock: 25 },
  { id: 2, name: "Mechanical Keyboard", category: "Electronics", price: 4500, stock: 12 },
  { id: 3, name: "Notebook Set", category: "Stationery", price: 500, stock: 40 },
  { id: 4, name: "USB-C Hub", category: "Accessories", price: 3200, stock: 4 }
];

let nextId = 5;

function sendSuccess(res, data, message = "Success", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
    data: null
  });
}

// Health check
app.get("/api/health", (req, res) => {
  sendSuccess(res, { status: "running" }, "API is healthy");
});

// Get all products, optionally filter by search term
app.get("/api/products", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();

  const result = search
    ? products.filter(product =>
        `${product.name} ${product.category}`
          .toLowerCase()
          .includes(search)
      )
    : products;

  res.set("Cache-Control", "no-store");
  sendSuccess(res, result, "Products retrieved successfully");
});

// Add a product
app.post("/api/products", (req, res) => {
  const { name, category, price, stock } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof category !== "string" ||
    !category.trim()
  ) {
    return sendError(res, 400, "Name and category are required.");
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (
    price === "" || price === null || price === undefined ||
    !Number.isFinite(parsedPrice) || parsedPrice < 0
  ) {
    return sendError(res, 400, "Price must be a valid non-negative number.");
  }

  if (
    stock === "" || stock === null || stock === undefined ||
    !Number.isInteger(parsedStock) || parsedStock < 0
  ) {
    return sendError(res, 400, "Stock must be a non-negative whole number.");
  }

  const product = {
    id: nextId++,
    name: name.trim(),
    category: category.trim(),
    price: parsedPrice,
    stock: parsedStock
  };

  products.push(product);

  sendSuccess(res, product, "Product created successfully", 201);
});

// Update a product
app.put("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find(item => item.id === id);

  if (!product) {
    return sendError(res, 404, "Product not found.");
  }

  const { name, category, price, stock } = req.body || {};

  if (
    typeof name !== "string" || !name.trim() ||
    typeof category !== "string" || !category.trim()
  ) {
    return sendError(res, 400, "Name and category are required.");
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (
    price === "" || price === null || price === undefined ||
    !Number.isFinite(parsedPrice) || parsedPrice < 0
  ) {
    return sendError(res, 400, "Price must be non-negative.");
  }

  if (
    stock === "" || stock === null || stock === undefined ||
    !Number.isInteger(parsedStock) || parsedStock < 0
  ) {
    return sendError(res, 400, "Stock must be a non-negative whole number.");
  }

  Object.assign(product, {
    name: name.trim(),
    category: category.trim(),
    price: parsedPrice,
    stock: parsedStock
  });

  sendSuccess(res, product, "Product updated successfully");
});

// Delete a product
app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex(item => item.id === id);

  if (index === -1) {
    return sendError(res, 404, "Product not found.");
  }

  const deleted = products.splice(index, 1)[0];

  sendSuccess(res, deleted, "Product deleted successfully");
});

// JSON response for unknown API routes
app.use("/api", (req, res) => {
  sendError(res, 404, "API endpoint not found.");
});

// Keep API failures in the same JSON envelope without exposing internals.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (req.path !== "/api" && !req.path.startsWith("/api/")) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return sendError(res, 400, "Invalid JSON request body.");
  }

  if (err.type === "entity.too.large") {
    return sendError(res, 413, "Request body is too large.");
  }

  if (err.type === "encoding.unsupported" || err.type === "charset.unsupported") {
    return sendError(res, 415, "Unsupported request encoding.");
  }

  return sendError(res, 500, "An unexpected server error occurred.");
});

app.listen(PORT, () => {
  console.log(`InventoryHub running at http://localhost:${PORT}`);
});
