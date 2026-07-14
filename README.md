# 🏪 Shop Management System

A full-stack, portfolio-quality **Shop Management System** with **automatic inventory** and **automatic profit tracking**. Purchases increase stock, sales decrease it, and profit is computed automatically from a snapshotted cost price — the operator never re-enters cost during a sale.

> **Status:** ✅ Feature-complete. All modules are implemented end-to-end — authentication, dashboard, products, categories, purchases, sales, customers, suppliers, expenses, reports, and settings — with automatic inventory and profit.

---
## 🌐 Live Demo

🔗 **Live Website**

https://shop-management-client-eta.vercel.app/

---

## 💻 Source Code

🔗 GitHub Repository

https://github.com/abdullahraanjha/shop-management


## ✨ Key Features

- **Automatic inventory** — stock rises on purchase, falls on sale, always accurate.
- **Automatic profit** — profit = (selling price − stored cost price) × quantity, computed at sale time.
- **Cost price is never entered during a sale** — it is stored on purchase and snapshotted onto each sale line for correct historical reporting.
- **Full audit trail** — every stock change is recorded in a `StockMovement` ledger.
- Products, categories, suppliers, customers, purchases, sales, expenses, reports, settings.
- JWT authentication, search, pagination, sorting, validation, error handling.
- Responsive UI with **dark mode**.

## 🧱 Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React, TypeScript, Tailwind CSS, shadcn/ui, React Query |
| Backend    | Node.js, Express, TypeScript                            |
| Database   | PostgreSQL, Prisma ORM                                   |
| Auth       | JWT (bcrypt password hashing)                           |
| Validation | Zod (shared on client and server)                       |

## 📦 Monorepo Layout

```
shop-management-system/
├── client/            # React + Vite + TypeScript frontend
├── server/            # Express + Prisma backend
├── docs/              # Architecture, database, and API documentation
├── package.json       # npm workspaces (runs client + server together)
└── README.md
```

See [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) for the full tree and
[`docs/DATABASE.md`](docs/DATABASE.md) for the schema.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 running locally (or a connection string to a hosted instance)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env → set DATABASE_URL and JWT_SECRET
```

### 3. Set up the database

```bash
npm run prisma:migrate      # create tables
npm run db:seed             # create admin user + defaults
```

Default admin login after seeding:

```
email:    admin@shop.com
password: Admin@123
```

### 4. Run in development

```bash
npm run dev                 # starts API (:5000) and web app (:5173) together
```

Open <http://localhost:5173>.

## 📚 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API Documentation](docs/API.md)
- [Feature List](docs/FEATURES.md)
- [Future Improvements](docs/FUTURE_IMPROVEMENTS.md)

## 🗺️ Build Roadmap

| #  | Module                                   | Status         |
| -- | ---------------------------------------- | -------------- |
| 0  | Foundation (scaffolding + schema)        | ✅ Done         |
| 1  | Authentication (JWT)                      | ✅ Done         |
| 2  | Dashboard (KPIs + charts)                | ✅ Done         |
| 3  | Product Management                       | ✅ Done         |
| 4  | Purchases (auto stock increase)          | ✅ Done         |
| 5  | Sales (auto stock decrease + profit)     | ✅ Done         |
| 6  | Customers                                | ✅ Done         |
| 7  | Suppliers                                | ✅ Done         |
| 8  | Expenses                                 | ✅ Done         |
| 9  | Reports                                  | ✅ Done         |
| 10 | Settings                                 | ✅ Done         |

## 📄 License

MIT — free to use for learning and portfolio purposes.
<img width="1440" height="900" alt="v2products" src="https://github.com/user-attachments/assets/dfffd315-87dc-4621-9d27-99ae508fba06" />
