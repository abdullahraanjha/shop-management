# Project Structure

A monorepo using npm workspaces. The backend follows a **layered / clean
architecture**: each feature is a self-contained module split into route →
controller → service → (Prisma) data access, with validation and types beside
them.

```
shop-management-system/
├── package.json                 # workspaces + combined dev/build scripts
├── README.md
├── docs/                        # documentation
│
├── server/                      # ── Backend (Express + Prisma) ──
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma         # database schema (all tables)
│   │   └── seed.ts               # initial admin user + defaults
│   └── src/
│       ├── config/
│       │   └── env.ts            # validated environment variables (Zod)
│       ├── lib/
│       │   └── prisma.ts         # shared PrismaClient singleton
│       ├── middlewares/
│       │   ├── error.middleware.ts     # centralized error → JSON
│       │   ├── notFound.middleware.ts  # 404 handler
│       │   └── validate.middleware.ts  # Zod request validation
│       ├── utils/
│       │   ├── ApiError.ts       # typed HTTP errors
│       │   ├── ApiResponse.ts    # standard success envelope
│       │   ├── asyncHandler.ts   # async route error forwarding
│       │   └── pagination.ts     # list query parsing + meta
│       ├── modules/              # feature modules (added per step)
│       │   └── <feature>/
│       │       ├── <feature>.routes.ts
│       │       ├── <feature>.controller.ts
│       │       ├── <feature>.service.ts
│       │       └── <feature>.schema.ts   # Zod schemas + types
│       ├── routes.ts             # aggregates all module routers
│       ├── app.ts                # Express app factory (middleware wiring)
│       └── server.ts             # entry point + graceful shutdown
│
└── client/                      # ── Frontend (React + Vite) ──
    ├── package.json
    ├── vite.config.ts            # @ alias + /api dev proxy
    ├── tailwind.config.js        # shadcn theme tokens + dark mode
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css             # Tailwind + light/dark CSS variables
        ├── lib/
        │   └── utils.ts          # cn(), formatCurrency()
        ├── components/           # reusable + shadcn/ui components (per step)
        ├── features/             # feature pages & hooks (per step)
        ├── hooks/                # shared React hooks
        └── api/                  # axios client + API layer
```

## Layering rationale

- **Routes** declare endpoints and attach validation/auth middleware only.
- **Controllers** translate HTTP ⇄ service calls; no business logic.
- **Services** hold business rules and own database transactions.
- **Schemas** (Zod) are the single source of truth for validation and types.

This separation keeps each layer independently testable and makes the profit /
stock rules live in exactly one place (the service layer).
