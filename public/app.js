
const API_URL = "/api/products";

const $ = (selector) => document.querySelector(selector);

const tableBody = $("#product-table-body");
const searchInput = $("#search-input");
const dialog = $("#product-dialog");
const form = $("#product-form");
const saveButton = $("#save-product-btn");

let products = [];
let searchTimer;
let noticeTimer;
let loadRequestId = 0;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatMoney(value) {
  return "PKR " + Number(value).toLocaleString("en-PK", {
    maximumFractionDigits: 2
  });
}

async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error("Unable to connect to the inventory API.");
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid JSON response.");
  }

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("The server returned an invalid JSON response.");
  }

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || `Request failed (${response.status}).`);
  }

  return result.data;
}

function showNotice(message, isError = false) {
  const notice = $("#notice");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;

  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.hidden = true;
  }, 4500);
}

function updateStats() {
  $("#total-products").textContent = products.length;

  const totalUnits = products.reduce(
    (sum, product) => sum + product.stock, 0
  );

  const totalValue = products.reduce(
    (sum, product) => sum + product.price * product.stock, 0
  );

  const lowStock = products.filter(
    product => product.stock < 5
  ).length;

  $("#total-units").textContent = totalUnits.toLocaleString("en-PK");
  $("#inventory-value").textContent = formatMoney(totalValue);
  $("#low-stock").textContent = lowStock;
}

function renderProducts(items) {
  $("#product-count").textContent =
    `${items.length} product${items.length === 1 ? "" : "s"}`;

  if (items.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-cell">
          No products found. Try another search or add a product.
        </td>
      </tr>`;
  } else {
    tableBody.innerHTML = items.map(product => {
      const low = product.stock < 5;
      const initials = product.name
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase();

      return `
        <tr>
          <td>
            <div class="product-cell">
              <span class="product-avatar">${escapeHTML(initials)}</span>
              <span>${escapeHTML(product.name)}</span>
            </div>
          </td>
          <td><span class="category-tag">${escapeHTML(product.category)}</span></td>
          <td>${formatMoney(product.price)}</td>
          <td>${product.stock.toLocaleString("en-PK")}</td>
          <td>
            <span class="stock-badge ${low ? "low" : ""}">
              ${low ? "Low stock" : "In stock"}
            </span>
          </td>
          <td>
            <div class="action-group">
              <button class="action-button" data-action="edit"
                data-id="${product.id}">Edit</button>
              <button class="action-button delete" data-action="delete"
                data-id="${product.id}">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join("");
  }

  $("#table-footer").textContent =
    `Showing ${items.length} of ${products.length} products`;
}

function filterProducts(search = "") {
  const term = search.trim().toLowerCase();
  const filteredProducts = term
    ? products.filter(product =>
        `${product.name} ${product.category}`.toLowerCase().includes(term)
      )
    : products;

  renderProducts(filteredProducts);
}

async function loadProducts() {
  const requestId = ++loadRequestId;
  tableBody.innerHTML = `
    <tr><td colspan="6" class="empty-cell">Loading inventory...</td></tr>`;

  try {
    const data = await apiRequest(API_URL);
    if (requestId !== loadRequestId) return;
    if (!Array.isArray(data)) {
      throw new Error("The server returned an invalid product list.");
    }

    products = data;
    updateStats();
    filterProducts(searchInput.value);
  } catch (error) {
    if (requestId !== loadRequestId) return;

    tableBody.innerHTML = `
      <tr><td colspan="6" class="empty-cell">
        Could not load inventory. Please try refreshing.
      </td></tr>`;

    $("#product-count").textContent = "Unavailable";
    $("#table-footer").textContent = "API request failed";
    showNotice(error.message, true);
  }
}

function openAddDialog() {
  form.reset();
  $("#product-id").value = "";
  $("#dialog-title").textContent = "Add product";
  $("#form-error").textContent = "";
  saveButton.textContent = "Save product";
  dialog.showModal();
  $("#product-name").focus();
}

function openEditDialog(id) {
  const product = products.find(item => item.id === id);

  if (!product) {
    showNotice("Product not found. Refresh the inventory.", true);
    return;
  }

  form.reset();
  $("#product-id").value = product.id;
  $("#product-name").value = product.name;
  $("#product-category").value = product.category;
  $("#product-price").value = product.price;
  $("#product-stock").value = product.stock;
  $("#dialog-title").textContent = "Edit product";
  $("#form-error").textContent = "";
  saveButton.textContent = "Update product";
  dialog.showModal();
}

$("#add-product-btn").addEventListener("click", openAddDialog);
$("#close-dialog").addEventListener("click", () => dialog.close());
$("#cancel-dialog").addEventListener("click", () => dialog.close());

$("#refresh-btn").addEventListener("click", () => {
  loadProducts();
});

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    filterProducts(searchInput.value);
  }, 250);
});

tableBody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "edit") {
    openEditDialog(id);
    return;
  }

  if (action === "delete") {
    const product = products.find(item => item.id === id);
    if (!product) return;

    const confirmed = window.confirm(
      `Delete "${product.name}" from the inventory?`
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
      await apiRequest(`${API_URL}/${id}`, { method: "DELETE" });
      showNotice("Product deleted successfully.");
      await loadProducts();
    } catch (error) {
      showNotice(error.message, true);
      button.disabled = false;
    }
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  $("#form-error").textContent = "";

  const id = $("#product-id").value;

  const product = {
    name: $("#product-name").value.trim(),
    category: $("#product-category").value.trim(),
    price: Number($("#product-price").value),
    stock: Number($("#product-stock").value)
  };

  if (
    !product.name ||
    !product.category ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    !Number.isInteger(product.stock) ||
    product.stock < 0
  ) {
    $("#form-error").textContent =
      "Enter a valid name, category, non-negative price, and whole-number stock.";
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    await apiRequest(
      id ? `${API_URL}/${id}` : API_URL,
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(product)
      }
    );

    dialog.close();
    showNotice(id
      ? "Product updated successfully."
      : "Product added successfully.");

    await loadProducts();
  } catch (error) {
    $("#form-error").textContent = error.message;
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = id ? "Update product" : "Save product";
  }
});

// Load inventory when the page opens.
loadProducts();
