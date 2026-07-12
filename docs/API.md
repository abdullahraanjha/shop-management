# API Documentation

Base URL: `http://localhost:5000/api`

## Conventions

**Success envelope**

```json
{
  "success": true,
  "message": "Success",
  "data": { },
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

`meta` is present only on paginated list endpoints.

**Error envelope**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": ["Invalid email"] }
}
```

**HTTP status codes**

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 200  | OK                                       |
| 201  | Created                                  |
| 400  | Validation error / bad request           |
| 401  | Missing or invalid token                 |
| 403  | Authenticated but not allowed            |
| 404  | Not found                                |
| 409  | Conflict (duplicate / constraint)        |
| 500  | Unexpected server error                  |

**List query parameters** (all list endpoints)

| Param       | Default     | Notes                              |
| ----------- | ----------- | ---------------------------------- |
| `page`      | `1`         | 1-based page number                |
| `limit`     | `10`        | max `100`                          |
| `search`    | —           | free-text search on key fields     |
| `sortBy`    | `createdAt` | column to sort by                  |
| `sortOrder` | `desc`      | `asc` or `desc`                    |

## Endpoints

### Health

```
GET /api/health → 200
```

> Feature endpoints (auth, products, purchases, sales, …) are documented here as
> each module is implemented. See the roadmap in the main README.
