# Tracker setup (Phase 1)

The widget posts three events to the admin's `/api/track` endpoint:
`widget_loaded`, `widget_opened`, `book_clicked`. Events are inserted
into a BigQuery table for later reporting (Phase 2 will add the UI).

If GCP env vars are not set, the endpoint logs to stdout and returns
204 — useful for local dev without GCP.

---

## 1. Create the BigQuery dataset and table

In the GCP Console (any project you own):

1. **Enable BigQuery API** for the project.
2. **Create dataset**: BigQuery → *Create dataset*
   - Dataset ID: `hotel_widget` (or anything; pass via `BQ_DATASET`)
   - Location: pick the multi-region closest to your hosting (`EU` for Europe).
3. **Create table** in that dataset: *Create table*
   - Table name: `events` (or anything; pass via `BQ_TABLE`)
   - Schema (paste in the *Edit as text* box):

```
uid:STRING:REQUIRED,
hotel_id:STRING:REQUIRED,
event:STRING:REQUIRED,
ts:TIMESTAMP:REQUIRED,
client_ts:TIMESTAMP:NULLABLE,
user_agent:STRING:NULLABLE,
page_url:STRING:NULLABLE,
referrer:STRING:NULLABLE,
payload:STRING:NULLABLE,
ip_hash:STRING:NULLABLE
```

   - Partitioning: *partition by ingestion time* on `ts`, daily.
   - Clustering (optional but recommended): `hotel_id, event`.

## 2. Create a service account

IAM → Service accounts → Create. Grant role **BigQuery Data Editor**
on the dataset (recommended) or at project level. Add **BigQuery Job
User** at project level if you plan to query from the same account
(needed by phase 2's stats UI).

Note the service-account email — it looks like
`tracker-writer@my-hotel-prod.iam.gserviceaccount.com`. **Don't** create
a JSON key yet; it's only required for scenario B below.

## 3. Configure the admin server

Three env vars are mandatory regardless of how you authenticate:

| Variable | Example | Purpose |
|---|---|---|
| `BQ_PROJECT_ID` | `my-hotel-prod` | GCP project that owns the dataset |
| `BQ_DATASET` | `hotel_widget` | dataset name (default: `hotel_widget`) |
| `BQ_TABLE` | `events` | table name (default: `events`) |

The fourth piece — *how the server proves it's allowed to write to
BigQuery* — depends on where the server runs.

### A. Cloud Run with an attached service account *(recommended for prod)*

No JSON file, no `GOOGLE_APPLICATION_CREDENTIALS`. You attach the
service account to the Cloud Run service and the SDK reads credentials
from the metadata server automatically.

```bash
gcloud run services update hotel-widget-admin \
  --region=europe-west1 \
  --service-account=tracker-writer@my-hotel-prod.iam.gserviceaccount.com
```

Or in the Cloud Run console: *Edit & deploy new revision* → *Security*
tab → *Service account* → pick `tracker-writer@…`.

This is the most secure option: no key material is generated, stored,
or rotated. Permissions are revocable in one click via IAM.

### B. Anywhere else, with a JSON key file

Use this if the admin runs on a VM, in Docker outside GCP, on Vercel,
on your laptop in long-term dev mode, etc.

1. IAM → Service accounts → click your SA → *Keys* tab → *Add key* →
   *Create new key* → *JSON*. A `*.json` file downloads.
2. Put it on the server filesystem at a path **outside the repo**:
   - VM: `/etc/secrets/sa.json` (locked down to the service user).
   - Docker on Cloud Run with mounted secret: store the JSON in
     [Secret Manager](https://cloud.google.com/secret-manager), then
     mount it as `/secrets/sa.json` via Cloud Run's *Secrets* tab.
   - Docker locally: bind-mount your `~/keys/sa.json` to `/secrets/sa.json`.
3. Set `GOOGLE_APPLICATION_CREDENTIALS=/secrets/sa.json` (or wherever
   you put it) as an env var.

⚠️ Never commit the JSON. Add `*.json` to `.gitignore` if it would
otherwise live next to your code.

### C. Local development on your laptop

Skip the JSON key entirely. Run once:

```bash
gcloud auth application-default login
```

This caches your **user** credentials in `~/.config/gcloud/`. The SDK
finds them automatically — no `GOOGLE_APPLICATION_CREDENTIALS` to set.
The downside: every BigQuery call charges *your* GCP user, not the
service account, which is fine for dev and ugly for prod.

### Verifying

On startup the server logs:
- `[tracker] BigQuery client ready (project.dataset.table)` — works.
- `events will be logged to stdout only` — `BQ_PROJECT_ID` is missing,
  the endpoint accepts events but doesn't insert.
- A first `insert` failure with `Could not load the default
  credentials` — none of A/B/C is in place; pick one.

## 4. Bake the tracker endpoint into the widget bundle

The widget needs to know **where** to POST events. The endpoint is
fixed at the widget's build time (it's the same admin URL for every
hotel served by this admin), so it goes in a Vite env var:

```bash
# In the widget repo (best-price-widget), at build time:
VITE_TRACKER_ENDPOINT="https://your-admin.run.app/api/track" npm run build
```

The value is inlined into `widget.js`. Rebuild + redeploy widget.js
whenever your admin URL changes.

For local dev or to override per page without rebuilding, set
`window.HPW_TRACKER_ENDPOINT` on the host page before the widget
loads — the widget reads that as a higher-priority override.

## 5. Toggle per-hotel in the admin

Each hotel's config carries a boolean `trackerEnabled`. The admin UI's
**Analytics** tab → *First-party tracker* card has a toggle for it.
Hotels with `trackerEnabled: false` don't fire any events even on a
build that has the endpoint set.

## 6. Wire up consent on the host page

The widget never sets a cookie or fires a request until it sees
`window.HPW_TRACKER_CONSENT === true`. Standard wire-up: a GTM tag
that fires on the *Cookie Consent Granted* trigger:

```html
<script>window.HPW_TRACKER_CONSENT = true;</script>
```

Without this flag the tracker stays inert (no cookie, no requests).

## 7. Verify

1. Reload the hotel page → no `hpw_uid` cookie, no requests in
   DevTools → Network. Good.
2. In the console: `window.HPW_TRACKER_CONSENT = true; location.reload();`
3. After reload you should see:
   - A `hpw_uid` cookie set on the host domain.
   - A `POST /api/track` request to the admin (with body `event: widget_loaded`).
4. Open the widget → second request, `event: widget_opened`.
5. Click Book Now → third request, `event: book_clicked`.
6. In BigQuery: `SELECT event, COUNT(*) FROM hotel_widget.events GROUP BY event`.

If steps 4–5 work but no rows appear in BQ, check the admin server
logs for `[tracker] BigQuery insert failed` — almost always missing
permissions on the service account or wrong dataset/table name.

## Custom events with booking metadata (sale, refund, …)

The same `/api/track` endpoint also accepts arbitrary custom events
plus optional structured booking fields. Useful for attribution from
the booking-engine's confirmation page.

### 1. Extend the BigQuery schema (one-off)

In the BigQuery console, run on your `hotel_widget.events` table:

```sql
ALTER TABLE `<your-project>.hotel_widget.events`
  ADD COLUMN booking_id STRING,
  ADD COLUMN price NUMERIC,
  ADD COLUMN currency STRING;
```

These columns are nullable. Existing widget events (load / open /
book) keep working untouched — they only get filled in when an event
ships them.

### 2. Append `hpw_uid` to the Book URL

Already done by the widget when `trackerEnabled: true` and consent is
granted. The Book button decorates the reserve URL with
`&hpw_uid=<cookie>&hpw_hotel=<hotelId>` so the booking flow carries
the attribution forward.

### 3. Fire the sale event via `window.HPW.track`

When the widget bundle is loaded on a page (which is the case on the
hotel's own confirmation page after the booking-engine redirect), it
exposes a global helper:

```js
window.HPW.track(eventName, data)
```

It reuses the widget's cookie, endpoint, and consent gate — you don't
need to re-do any of that plumbing on the confirmation page. Pass any
event name matching `[a-z][a-z0-9_]{0,63}`. Three keys in `data` get
lifted into typed BigQuery columns; anything else stays in the JSON
payload column.

The recommended wiring is a GTM Custom HTML tag triggered on the
existing `purchase` dataLayer push (or whatever event your booking
flow pushes on confirmation):

```html
<script>
  // Reads the same fields GA4 / GTM e-commerce already populates.
  var ec = (window.dataLayer || [])
    .slice().reverse()
    .find(function (e) { return e && e.event === 'purchase' && e.ecommerce; })
    ?.ecommerce;

  if (window.HPW && ec) {
    window.HPW.track('sale', {
      bookingId: String(ec.transaction_id || ''),
      price:     parseFloat(ec.value),
      currency:  String(ec.currency || 'EUR').toUpperCase(),
      // any extra context you want goes here — it lands in the
      // payload JSON column
      items: ec.items?.length || null,
    });
  }
</script>
```

Or if you don't have a GTM purchase event yet, call it directly with
values you read from the DOM:

```html
<script>
  if (window.HPW) {
    window.HPW.track('sale', {
      bookingId: document.querySelector('[data-booking-ref]')?.textContent.trim(),
      price:     parseFloat(document.querySelector('[data-total]')?.textContent),
      currency:  'EUR',
    });
  }
</script>
```

Same API for `refund`, `cancellation`, or any other custom event —
just change the first argument.

If `window.HPW` is undefined the call is a no-op (the widget hasn't
loaded yet). Place the snippet AFTER the widget's `<script>` tag, or
gate it behind the widget's load event.

### 4. Verify

In BigQuery, after a real (or simulated) booking:

```sql
SELECT event, booking_id, price, currency, ts
FROM `<your-project>.hotel_widget.events`
WHERE event = 'sale'
ORDER BY ts DESC
LIMIT 10;
```

Same row will also appear in the per-hotel and global Stats tabs as a
fourth funnel step.
