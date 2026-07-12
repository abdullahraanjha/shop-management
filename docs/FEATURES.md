# Feature List

## Inventory & Profit (core)
- Automatic stock increase on every purchase.
- Automatic stock decrease on every sale.
- Cost price stored on purchase, snapshotted onto each sale line.
- Automatic profit per line and per invoice.
- Append-only stock movement ledger (full audit trail).
- Low-stock threshold and alerts per product.

## Modules
- **Authentication** — JWT login/logout, hashed passwords, role-based access.
- **Dashboard** — today's sales, monthly sales, revenue, profit, low stock,
  best-selling products.
- **Products** — categories, SKU, barcode, images, stock, cost & selling price.
- **Purchases** — purchase invoices, suppliers, automatic stock increase.
- **Sales** — customers, sales invoices, automatic stock decrease + profit,
  printable invoices.
- **Customers / Suppliers** — contact management with transaction history.
- **Expenses** — operating cost tracking for net-profit reporting.
- **Reports** — sales, purchases, profit, and inventory reports.
- **Settings** — shop name, currency, tax rate, logo.

## Cross-cutting
- Search, pagination, and sorting on all list views.
- Zod validation on every write endpoint.
- Centralized error handling with consistent JSON responses.
- Responsive UI with light/dark mode.
- Reusable UI components (shadcn/ui) and API/data-fetching layer (React Query).
