# Implementation Reasoning

## Schema design

The schema separates the business concepts that change at different rates:

- `users` stores owner/staff login credentials, with a unique email and a bcrypt password hash. The session stores only the public user identity.
- `customers` stores the person receiving meals. Phone is unique because it is the owner's practical lookup key.
- `plans` stores reusable plan definitions and prices.
- `subscriptions` connects one customer to one plan and owns the lifecycle status (`active`, `paused`, or `cancelled`) and start date.
- `pauses` records each pause interval separately. `paused_to = NULL` means the pause is still open, while a closed interval retains its history.

Foreign keys enforce customer, plan, and subscription relationships. Customer and subscription deletes cascade where the child record has no independent meaning; plans use `RESTRICT` so a plan cannot be deleted while historical subscriptions still reference it. Indexes cover phone, email, subscription customer/status, and pause lookup paths.

`schema.sql` is the source of truth and is executed idempotently by `db/database.js` on startup. Prices are stored as non-negative integer units, and the existing API returns the calculated bill rounded to two decimal places.

## Billing formula

For a requested month, the calculator first builds every Monday-Friday date in that calendar month:

```text
total_weekdays = count of all Monday-Friday dates in the month
days_delivered = weekdays on/after start_date and not covered by any pause
bill = round(plan.price * days_delivered / total_weekdays, 2)
```

Pause intervals are inclusive: a date is paused when `paused_from <= date` and either `paused_to` is open or `date <= paused_to`. The calculator tests each weekday against all intervals instead of summing pause lengths, so overlapping pauses cannot subtract the same weekday twice. Dates before a mid-month `start_date` are excluded from delivery but remain in the denominator, matching the requested month-based pro-ration.

All date arithmetic uses UTC date construction to avoid daylight-saving and local-time shifts. Month input is validated as `YYYY-MM`, and invalid subscription/month identifiers return client errors before calculation.

## Key trade-offs

- Signed `express-session` cookies were chosen over JWTs because this is a server-rendered assessment app and logout/session invalidation is straightforward. The default in-memory session store is suitable for the timed assessment but should be replaced for production deployment.
- EJS plus small vanilla JS files keeps the app build-free and makes the owner workflow usable quickly. The dashboard calls the REST APIs rather than duplicating data logic in templates.
- Customer status is derived from the latest subscription row, returning `none` for customers without a subscription. This keeps one row per customer for owner search, at the cost of treating the newest subscription as the current one.
- Sort columns are allowlisted before being interpolated into SQL; values remain parameterized. This permits useful sorting without exposing an arbitrary SQL identifier.
- Pause/resume writes run in SQLite transactions so the subscription status and pause interval cannot be updated independently.

## Billing test cases

These cases use plan price `3000` and `month=2026-09`. September 2026 contains 22 weekdays.

| Case | Total weekdays | Days delivered | Bill |
| --- | ---: | ---: | ---: |
| Full month, no pause | 22 | 22 | 3000.00 |
| Pause from Sep 10 through Sep 11 | 22 | 20 | 2727.27 |
| Start on Sep 15 | 22 | 12 | 1636.36 |
| Overlapping pauses Sep 8-12 and Sep 10-15 | 22 | 16 | 2181.82 |

The executable manual cases are documented in [tests/billing.manual.md](tests/billing.manual.md). HTTP smoke tests also verified the single-subscription endpoint, all-subscriptions endpoint, and invalid-month `400` response.

## Bugs found and fixed

- The initial pause/resume implementation created `db.transaction(...)` functions but did not invoke them. Pause returned an empty object and left the subscription active, causing resume to return `409`. Calling the transaction function fixed both state changes and response data.
- Customer status filtering initially used the `current_status` select alias in SQLite's `WHERE` clause. SQLite reported `no such column: current_status`; the filter now repeats the underlying `COALESCE(latest_subscription.status, 'none')` expression.
- Dashboard rows initially had status but no subscription ID, so action buttons could not target `/api/subscriptions/:id/pause` or `/resume`. The joined customer query now returns `subscription_id`, and the buttons call the existing subscription endpoints directly.
- A terminal harness cleanup once caused a native `better-sqlite3` abort while forcibly stopping a server. Billing verification was rerun in one process with explicit HTTP server and database shutdown; the application test then passed.