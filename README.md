# Tiffin Service

A full-stack weekday tiffin subscription service built with Node.js, Express, SQLite, and EJS.

## Run locally

```bash
npm install
npm start
```

The app runs at `http://localhost:3000`. The health check is available at `GET /health`.

## Project layout

- `db/` - SQLite connection and schema initialization
- `routes/` - HTTP route modules
- `models/` - database access modules
- `views/` - EJS templates
- `public/` - browser assets

## Planned API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a customer account |
| `POST` | `/api/auth/login` | Start a customer or owner session |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/subscription` | View the signed-in customer's plan |
| `POST` | `/api/subscription/pause` | Pause delivery |
| `POST` | `/api/subscription/resume` | Resume delivery |
| `GET` | `/api/billing` | View month-to-date and final pro-rated billing |
| `GET` | `/api/customers` | Owner search with status, pagination, and sorting |