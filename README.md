# 🏪 Shop Management System

A full-stack, portfolio-quality **Shop Management System** with **automatic inventory** and **automatic profit tracking**. Purchases increase stock, sales decrease it, and profit is computed automatically from a snapshotted cost price — the operator never re-enters cost during a sale.

> **Status:** Built module by module. This repository currently contains the **foundation** (monorepo scaffolding, full database schema, backend core, and frontend toolchain). Feature modules are added incrementally.

---

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
| 1  | Authentication (JWT)                      | ⬜ Next         |
| 2  | Dashboard (KPIs + charts)                | ⬜ Planned      |
| 3  | Product Management                       | ⬜ Planned      |
| 4  | Purchases (auto stock increase)          | ⬜ Planned      |
| 5  | Sales (auto stock decrease + profit)     | ⬜ Planned      |
| 6  | Customers                                | ⬜ Planned      |
| 7  | Suppliers                                | ⬜ Planned      |
| 8  | Expenses                                 | ⬜ Planned      |
| 9  | Reports                                  | ⬜ Planned      |
| 10 | Settings                                 | ⬜ Planned      |

## 📄 License

MIT — free to use for learning and portfolio purposes.
