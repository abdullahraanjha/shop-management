# Database Schema

PostgreSQL, modeled with Prisma. Money is stored as `Decimal(12,2)` (never
floats) to avoid rounding errors in financial calculations.

## Entity Relationship Overview

```
User ─┐ (creates)
      ├──< PurchaseInvoice ──< PurchaseItem >── Product >── Category
      ├──< SalesInvoice    ──< SalesItem    >── Product
      ├──< Expense                                │
      └──< StockMovement >────────────────────────┘

Supplier ──< PurchaseInvoice
Customer ──< SalesInvoice
Setting  (single-row shop config)
```

## Tables

### users
Auth + audit. Passwords stored as bcrypt hashes and never returned by the API.
Roles: `ADMIN`, `MANAGER`, `CASHIER`.

### categories
Groups products. `name` is unique and indexed.

### products
The heart of inventory. Notable columns:

| Column         | Purpose                                                        |
| -------------- | ------------------------------------------------------------- |
| `sku`          | Unique stock keeping unit (indexed)                           |
| `barcode`      | Optional, unique (indexed) — for barcode scanning             |
| `costPrice`    | Latest purchase cost, refreshed on each purchase              |
| `sellingPrice` | Default retail price                                          |
| `stock`        | Current quantity on hand                                      |
| `lowStockAt`   | Threshold that triggers low-stock alerts                     |

### suppliers / customers
Contact records linked to purchase and sales invoices respectively. Deleting a
contact uses `SetNull` on invoices so financial history is preserved.

### purchase_invoices / purchase_items
A purchase increases stock. Each `purchase_item` records `unitCost`; on save the
product's `costPrice` is refreshed and a `PURCHASE` stock movement is written.

### sales_invoices / sales_items
A sale decreases stock. **Cost price is never entered here.** Each `sales_item`
snapshots the product's current `costPrice` into `costPrice` and computes
`lineProfit = (unitPrice − costPrice) × quantity`. The invoice stores
`totalProfit` (sum of line profits) for fast dashboard reads.

### stock_movements
Append-only ledger of every stock change (`PURCHASE`, `SALE`, `ADJUSTMENT`) with
the resulting `balance`, giving a complete, auditable inventory history.

### expenses
Operating costs (rent, salaries, utilities…) for net-profit reporting.

### settings
Single-row shop configuration: shop name, currency, tax rate, logo, contact.

## Why snapshot the cost price on sales?

If we always read the *current* `Product.costPrice` when reporting profit, then
buying new stock at a different price would retroactively change the profit of
past sales. Snapshotting the cost onto each `sales_item` at the moment of sale
keeps historical profit correct and immutable.

## Indexes

Indexes are declared on every foreign key and on high-cardinality search/sort
columns (`name`, `sku`, `barcode`, `invoiceNo`, `createdAt`) to keep list,
search, and dashboard aggregation queries fast.

## Integrity & Transactions

- Purchases and sales run inside a single Prisma `$transaction`, so stock
  updates, line items, and the movement ledger either all commit or all roll
  back — stock can never drift out of sync with invoices.
- Products referenced by invoice lines use `onDelete: Restrict` so a product
  with transaction history cannot be hard-deleted (it is deactivated instead).
