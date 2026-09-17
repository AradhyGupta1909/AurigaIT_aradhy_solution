# Manual billing cases

Use a plan price of `3000` and request `month=2026-09`. September 2026 has 22 weekdays.

## 1. Full month, no pause

Create an active subscription with `start_date=2026-09-01` and no pauses.

Expected: `total_weekdays=22`, `days_delivered=22`, `bill=3000`.

```bash
curl -b cookies.txt 'http://localhost:3000/api/subscriptions/1/bill?month=2026-09'
```

## 2. One pause

Pause the subscription from `2026-09-10` through `2026-09-11`.

Expected: `total_weekdays=22`, `days_delivered=20`, `bill=2727.27`.

## 3. Mid-month start

Create a subscription with `start_date=2026-09-15` and no pauses.

Expected: `total_weekdays=22`, `days_delivered=12`, `bill=1636.36`.

## 4. Overlapping pauses

Use pauses `2026-09-08..2026-09-12` and `2026-09-10..2026-09-15`.

Expected: overlapping weekdays are counted once, giving `total_weekdays=22`, `days_delivered=16`, `bill=2181.82`.

The all-subscriptions endpoint should return the same calculation per subscription:

```bash
curl -b cookies.txt 'http://localhost:3000/api/bills?month=2026-09'
```
