# 🔐 Announcement Board API — with JWT Auth

A RESTful API built on **Node.js · Express 5 · Prisma · SQLite · Celebrate · Swagger**.  
This version adds JWT-based authentication with access + refresh token rotation, HttpOnly cookies, and per-user ownership enforcement on mutations.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.2.1 | Web framework |
| Prisma | 7.2.0 | ORM / database access |
| Celebrate (Joi) | 15.0.3 | Request validation middleware |
| jsonwebtoken | — | JWT sign & verify |
| bcrypt | — | Password hashing |
| cookie-parser | — | HttpOnly cookie support |
| http-errors | — | Typed HTTP error creation |
| Swagger UI | 5.0.1 | Interactive API docs |
| swagger-jsdoc | 6.2.8 | OpenAPI spec from JSDoc |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create the database
npm run prisma:migrate

# 3. Start the dev server
npm run dev
```

| URL | What's there |
|---|---|
| `http://localhost:3000` | API root |
| `http://localhost:3000/api-docs` | Swagger UI — interactive docs & testing |

---

## Environment Variables

```env
# .env
DATABASE_URL="file:./prisma/dev.db"

JWT_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

PORT=3000
```

Use different secrets for access and refresh tokens — if both use the same secret, a refresh token could be accepted as an access token.

---

## How Authentication Works

The API uses a **dual-token** strategy:

| Token | Lifetime | Stored in |
|---|---|---|
| **Access token** | 15 minutes | Response body only — client keeps it in memory |
| **Refresh token** | 7 days | Database + HttpOnly cookie + response body |

### Typical flow

```
POST /auth/register  →  { user, accessToken, refreshToken }
        ↓
Use accessToken in Authorization: Bearer <token> header
        ↓
After 15 min — accessToken expires
        ↓
POST /auth/refresh  →  { accessToken, refreshToken }  (old refresh token deleted)
        ↓
POST /auth/logout   →  refresh token deleted from DB, cookie cleared
```

### Token rotation

Every time `/auth/refresh` is called, the **old refresh token is deleted** from the database and a brand-new pair is issued. If a stolen token is replayed after the real user refreshed, the server will reject it (token not in DB).

### Where to put the token

All protected endpoints require an `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Getting Tokens — Step by Step

### Step 1 — Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ivan_petrenko","password":"secret123","name":"Іван"}'
```

Response:

```json
{
  "user": { "id": 1, "username": "ivan_petrenko", "name": "Іван", "createdAt": "..." },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

Copy `accessToken` — you'll need it for protected routes.

### Step 2 — Use the token

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGci..."
```

### Step 3 — Refresh when access token expires

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGci..."}'
```

Returns a new `accessToken` + `refreshToken`. The old refresh token is immediately invalidated.

### Step 4 — Log out

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbGci..."
```

### Using requests.http (VS Code REST Client)

1. Install the **REST Client** extension
2. Open `requests.http`
3. Run `POST /auth/register` — copy the returned `accessToken`
4. Paste it into `@token = PASTE_ACCESS_TOKEN_HERE` at the top
5. Now click **Send Request** on any other block — the token is injected automatically

---

## API Reference

### Auth endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register, get token pair |
| `POST` | `/auth/login` | — | Log in, get token pair |
| `POST` | `/auth/refresh` | — | Refresh access token (cookie or body) |
| `POST` | `/auth/logout` | ✅ Bearer | Invalidate refresh token |
| `GET` | `/auth/me` | ✅ Bearer | Current user profile |

### Announcement endpoints

| Method | Path | Auth | Ownership | Description |
|---|---|---|---|---|
| `GET` | `/announcements` | — | — | List (search, sort, paginate) |
| `GET` | `/announcements/:id` | — | — | Single announcement |
| `POST` | `/announcements` | ✅ Bearer | — | Create (sets userId automatically) |
| `PATCH` | `/announcements/:id` | ✅ Bearer | ✅ Own only | Partial update |
| `DELETE` | `/announcements/:id` | ✅ Bearer | ✅ Own only | Delete |

---

## Validation Rules

### Registration `POST /auth/register`

| Field | Rule |
|---|---|
| `username` | Required string, 3–30 chars |
| `password` | Required string, min 6 chars |
| `name` | Required string, min 2 chars |

### Announcements `POST /announcements`

| Field | Rule |
|---|---|
| `title` | Required, 5–100 chars |
| `description` | Required, min 10 chars |
| `price` | Required number, > 0 |
| `category` | Required, one of: `sale` `service` `job` `other` |
| `contactInfo` | Required, min 5 chars |

`PATCH` accepts the same fields but all are **optional** — at least one must be present (empty `{}` → 400).

---

## Error Reference

```json
{ "error": "Human-readable message" }
```

| Status | When |
|---|---|
| `400` | Validation failed / empty PATCH body / invalid JSON |
| `401` | Missing or expired token / wrong credentials / invalid refresh token |
| `403` | Authenticated but trying to mutate someone else's announcement |
| `404` | Record not found |
| `409` | Username already taken |
| `500` | Unexpected server error |

Celebrate validation errors include field-level details:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "validation": {
    "body": {
      "source": "body",
      "keys": ["password"],
      "message": "\"password\" length must be at least 6 characters long"
    }
  }
}
```

---

## Database Schema

```prisma
model User {
  id            Int            @id @default(autoincrement())
  username      String         @unique
  password      String         // bcrypt hash — never returned in responses
  name          String
  createdAt     DateTime       @default(now())
  announcements Announcement[]
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model Announcement {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  price       Float
  category    String   // 'sale' | 'service' | 'job' | 'other'
  contactInfo String
  userId      Int      // owner
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

`@updatedAt` is managed by Prisma — it updates automatically on every `update()` call, you never set it manually.

---

## Prisma Commands

```bash
# Apply schema changes to the DB (creates the .db file on first run)
npm run prisma:migrate

# Regenerate the Prisma Client after schema changes
npm run prisma:generate

# Browse the database in a web UI (http://localhost:5555)
npx prisma studio
```

---

## Project Structure

```
hw4/
├── prisma/
│   ├── schema.prisma                    # DB models
│   └── client.js                        # Prisma client — always import from here
├── src/
│   ├── middleware/
│   │   └── auth.middleware.js           # JWT extraction + verification → req.user
│   ├── controllers/
│   │   ├── auth.controller.js           # register, login, refresh, logout, me
│   │   └── announcements.controller.js  # CRUD + ownership checks
│   ├── routes/
│   │   ├── auth.routes.js               # /auth/* + Swagger JSDoc
│   │   └── announcements.routes.js      # /announcements/* + Swagger JSDoc
│   └── validators/
│       ├── auth.validator.js            # Celebrate schemas for auth
│       └── announcements.validator.js   # Celebrate schemas for announcements
├── app.js                               # Express setup, middleware, error handler
├── requests.http                        # VS Code REST Client — 25 test scenarios
├── .env                                 # Secrets (not committed)
└── package.json
```

### Request lifecycle

```
Request
  → Express middleware (json, cookieParser)
  → Router
  → authenticate middleware (if protected)  ← 401 if token missing/invalid
  → celebrate validator                      ← 400 if body/query/params invalid
  → Controller                               ← 403 if wrong owner, 404 if not found
  → Prisma
  → Response

Any thrown error
  → celebrateErrors() handler (400 with details)
  → Generic error handler (maps P2025→404, P2002→409, http-errors status→that status)
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Production mode |
| `npm run dev` | Dev mode with auto-restart |
| `npm run prisma:migrate` | Create & apply DB migration |
| `npm run prisma:generate` | Regenerate Prisma Client |