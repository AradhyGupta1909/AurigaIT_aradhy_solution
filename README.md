# Tiffin Service

A full-stack weekday tiffin subscription service for owners managing customers, delivery pauses, and fair month-end billing. It uses Node.js, Express, SQLite via `better-sqlite3`, EJS, and vanilla browser JavaScript.

## Setup and run

Requirements: Node.js 18+ and npm.

```bash
npm install
npm start
```

Open `http://localhost:3000`. The public landing page is at `/`; owner/staff pages require login.

For development, use Node's built-in watcher:

```bash
npm run dev
```

The database is created automatically from `schema.sql` on first startup. By default it is `db/tiffin.sqlite`, which is ignored by git. Useful environment variables:

```bash
PORT=3000
DATABASE_PATH=/tmp/tiffin.sqlite
SESSION_SECRET=replace-this-in-development
```

For a clean local test database:

```bash
rm -f /tmp/tiffin.sqlite /tmp/tiffin.sqlite-shm /tmp/tiffin.sqlite-wal
DATABASE_PATH=/tmp/tiffin.sqlite npm start
```

## Debugging

- Server errors are printed to the terminal running `npm start`.
- Use `DATABASE_PATH` to isolate a reproducible test database without touching the normal local data.
- Register first with `POST /api/auth/register`; the signed session cookie returned by that request is required for protected API and owner page requests.
- `curl -i` shows response status, redirects, and the session cookie. Save cookies with `curl -c cookies.txt` and reuse them with `curl -b cookies.txt`.
- The schema is applied by [db/database.js](db/database.js) from [schema.sql](schema.sql).

## Pages

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Public landing page |
| `GET` | `/login` | Public login form |
| `GET` | `/register` | Public registration form |
| `GET` | `/dashboard` | Protected owner customer dashboard |
| `GET` | `/customers/new` | Protected add-customer and subscribe form |
| `GET` | `/bills?month=YYYY-MM` | Protected billing view |

## API endpoints

All API routes except `/api/auth/*` require the signed session cookie. Requests and responses use JSON unless noted otherwise.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register with `email` and a password of at least 8 characters; starts a session. |
| `POST` | `/api/auth/login` | Authenticate with `email` and `password`; starts a session. |
| `POST` | `/api/auth/logout` | Destroy the current session. |
| `POST` | `/api/customers` | Create a customer with `name` and unique `phone`. |
| `GET` | `/api/customers?search=&status=&page=&limit=&sort=&order=` | Search by partial name/phone, filter by latest subscription status, paginate, and sort. |
| `POST` | `/api/subscriptions` | Subscribe a customer using `customer_id`, `plan_id`, and optional `start_date`. |
| `GET` | `/api/subscriptions?limit=&offset=` | List subscriptions with customer name/phone and plan details. |
| `POST` | `/api/subscriptions/:id/pause` | Pause an active subscription; accepts optional `paused_from`. |
| `POST` | `/api/subscriptions/:id/resume` | Resume a paused subscription; accepts optional `paused_to`. |
| `GET` | `/api/subscriptions/:id/bill?month=YYYY-MM` | Calculate one subscription's pro-rated bill for a month. |
| `GET` | `/api/bills?month=YYYY-MM` | Calculate bills for every subscription in a month. |
| `GET` | `/health` | Return service health JSON; protected by the global auth middleware. |

Common response codes are `201` for creates, `200` for successful reads/updates, `400` for invalid input, `401` for unauthenticated API access or invalid credentials, `404` for missing records, and `409` for duplicate/conflicting state.

## Project layout

- `db/` - SQLite connection and schema initialization
- `models/` - parameterized database access modules
- `routes/` - API and page route modules
- `services/` - billing calculation logic
- `views/` - EJS templates
- `public/` - browser assets
- `tests/billing.manual.md` - manual billing cases and expected results