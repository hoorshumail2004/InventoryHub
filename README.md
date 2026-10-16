# InventoryHub – Full-Stack Inventory Management Application

## Project Overview

InventoryHub is a web-based inventory management application developed as part of a full-stack development assignment. It allows users to view, search, add, edit, and delete products through a responsive dashboard connected to a REST API.

## Features

- Dashboard displaying total products, stock units, inventory value, and low-stock products.
- Product search by name or category.
- Add, edit, and delete inventory products.
- REST API integration between the frontend and backend.
- Consistent JSON responses and meaningful API error messages.
- Input validation and responsive user interface.
- Improved search behavior and error handling with assistance from Microsoft Copilot.

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **API:** REST API with JSON responses
- **Development tools:** Visual Studio Code, Git, GitHub, Microsoft Copilot

## Project Structure

```text
InventoryHub/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites

Install [Node.js](https://nodejs.org/) and Git.

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/hoorshumail2004/InventoryHub.git
   ```

2. Open the project folder:

   ```bash
   cd InventoryHub
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the application:

   ```bash
   npm run dev
   ```

5. Open the application in your browser:

   `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Checks API status |
| GET | `/api/products` | Retrieves all products |
| GET | `/api/products?search=Electronics` | Searches products by name or category |
| POST | `/api/products` | Adds a product |
| PUT | `/api/products/:id` | Updates a product |
| DELETE | `/api/products/:id` | Deletes a product |

### JSON Response Format

Successful API responses use the following structure:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": []
}
```

Error responses follow the same structure with `success` set to `false`, a descriptive `message`, and `data` set to `null`.

## Testing and Optimization

The application was tested through its browser interface and API endpoints. Testing covered product retrieval, search, CRUD operations, and error handling. Code syntax checks and VS Code diagnostics were also used.

With Microsoft Copilot's assistance, the project was improved to maintain inventory-wide dashboard statistics during searches, reduce unnecessary search requests, handle superseded requests, and return consistent JSON errors for common API failures.

## Learning Outcomes

This project provided practical experience with frontend-backend integration, REST APIs, JSON data structures, error handling, debugging, performance improvements, and GitHub version control.

## Note

The current application uses in-memory sample data. Product changes are not permanently stored and reset when the server restarts.

## Author

**Hoor Shumail**

GitHub: [hoorshumail2004](https://github.com/hoorshumail2004)
