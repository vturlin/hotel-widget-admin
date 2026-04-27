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
(restricted to the dataset) and **BigQuery Job User** at project level
if you plan to query later from the same account.

Create a JSON key. Save the file somewhere the admin server can read
it; do **not** commit it.

## 3. Configure the admin server

Set the four env vars (Cloud Run console / `.env` / wherever you keep
secrets):

| Variable | Example | Purpose |
|---|---|---|
| `BQ_PROJECT_ID` | `my-hotel-prod` | GCP project that owns the dataset |
| `BQ_DATASET` | `hotel_widget` | dataset name (default: `hotel_widget`) |
| `BQ_TABLE` | `events` | table name (default: `events`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | `/secrets/sa.json` | path to the service-account JSON |

On startup the server logs `[tracker] BigQuery client ready (...)` if
the connection works, or `events will be logged to stdout only` if any
of the env vars are missing.

## 4. Configure each hotel config

Add `trackerEndpoint` to the JSON config for hotels you want to track:

```json
{
  "hotelName": "Hôtel Demo",
  "...": "...",
  "trackerEndpoint": "https://your-admin.run.app/api/track"
}
```

Hotels without `trackerEndpoint` simply don't fire events. (The admin
UI doesn't yet expose this field — for Phase 1 add it manually, or
publish the existing config and edit on GitHub. Phase 2 will add it
to the Analytics tab.)

## 5. Wire up consent on the host page

The widget never sets a cookie or fires a request until it sees
`window.HPW_TRACKER_CONSENT === true`. Standard wire-up: a GTM tag
that fires on the *Cookie Consent Granted* trigger:

```html
<script>window.HPW_TRACKER_CONSENT = true;</script>
```

Without this flag the tracker stays inert (no cookie, no requests).

## 6. Verify

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

## What's coming in later phases

- **Phase 2**: Stats UI tab in the admin (counts per event, per hotel,
  per period — funnel from load → open → click).
- **Phase 3**: Sale tracking. The widget will append `&hpw_uid={uid}`
  to the d-edge Book URL; a snippet you paste on the d-edge
  confirmation page will POST to `/api/track/sale` with the uid +
  amount, closing the attribution loop.
