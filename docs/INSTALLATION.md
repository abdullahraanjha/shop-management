# Installation Guide

## 1. Prerequisites

- **Node.js ≥ 20** and npm ≥ 10
- **PostgreSQL ≥ 14** (local install, Docker, or a hosted URL)

Verify:

```bash
node -v
npm -v
psql --version
```

## 2. Clone & install

```bash
git clone <your-repo-url> shop-management-system
cd shop-management-system
npm install          # installs both workspaces (client + server)
```

## 3. Create the database

Using a local PostgreSQL:

```bash
createdb shop_management
```

Or with Docker:

```bash
docker run --name shop-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=shop_management -p 5432:5432 -d postgres:16
```

## 4. Environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shop_management?schema=public"
JWT_SECRET="a-long-random-secret"
```

## 5. Migrate & seed

```bash
npm run prisma:migrate     # applies schema, creates tables
npm run db:seed            # seeds admin user + shop settings
```

## 6. Run

```bash
npm run dev
```

- API → <http://localhost:5000/api/health>
- Web → <http://localhost:5173>

## Troubleshooting

- **`DATABASE_URL is required`** — you didn't create `server/.env`.
- **Prisma can't connect** — confirm PostgreSQL is running and the credentials
  in `DATABASE_URL` are correct.
- **Port already in use** — change `PORT` in `server/.env` or the Vite port in
  `client/vite.config.ts`.
