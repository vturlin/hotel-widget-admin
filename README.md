# Hotel Widget Admin

D-EDGE Marketing Suite — a small Express + React admin that lets
hoteliers configure four embeddable marketing widgets (Best-Price,
Lead-Gen, Reassurance, Stress-marketing) and publishes the
configurations to GitHub-served CDN bundles.

<p align="center"><em>One Cloud Run service. Four widget products. GitHub as a config store.</em></p>

---

## What it does

1. The hotelier logs into the admin (cookie-based auth).
2. They pick a product (best-price / lead-gen / reassurance / stress)
   and an existing hotel config — or create a new one.
3. They edit the config across tabbed forms (Identity / Data / Content
   / Appearance / Languages / Auto-open / Analytics / Publish), with a
   live preview rendered in an iframe alongside.
4. On Publish, the admin pushes the JSON to the matching widget repo
   (`best-price-widget`, `lead-gen-widget`, etc.) under
   `public/configs/<hotelId>.json`. GitHub Pages serves the file at
   the same path; the widget on the hotel's site picks up the new
   config within a minute or two (CDN cache).

The same Cloud Run service also exposes:
- `/api/rates/*` — public proxy that fetches AvailPro rates and
  caches them (used by the Best-Price widget on every visitor page
  load),
- `/api/i`, `/api/track` — first-party tracker beacons,
- `/api/stats/*` — admin-only BigQuery-backed stats screens,
- `/api/lead-gen/generate-content` — Gemini-powered copy generation
  for Lead-Gen configs.

---

## Architecture

```
                     ┌──────────────────────┐
   Hôtel visiteur ──▶│  GitHub Pages CDN    │ widget.js + configs/*.json
                     └──────────┬───────────┘
                                │ /api/rates, /api/i
                                ▼
                     ┌──────────────────────┐
                     │ Cloud Run            │
                     │ hotel-widget-admin   │
                     └──┬─────┬─────┬──────┘
                        │     │     │
   ┌────────────────────┘     │     └─────────────┐
   ▼                          ▼                   ▼
┌──────────┐             ┌──────────┐       ┌──────────┐
│ AvailPro │             │ BigQuery │       │  Gemini  │
└──────────┘             └──────────┘       └──────────┘
                                ▲
                                │
        ┌─────── Admin opérateur (HTTPS + cookie HttpOnly)
        │
        ▼
   ┌──────────────┐                  ┌──────────────────┐
   │ /api/* admin │ ── publish ────▶ │ 4 GitHub repos   │
   └──────────────┘                  │ (per product)    │
                                     └──────────────────┘
```

See [docs/infra-notice.md](docs/infra-notice.md) for the full infra
breakdown, security posture, cost model and decision matrix.

---

## Quick start (developer)

```bash
npm install

# Terminal 1 — Vite dev server (admin SPA on :5173)
npm run dev

# Terminal 2 — Express backend on :8080 (Vite proxies /api/* to it)
ADMIN_PASSWORD=changeme \
GITHUB_TOKEN=ghp_xxx \
GITHUB_OWNER=vturlin \
GITHUB_REPO=best-price-widget \
GITHUB_REPO_LEAD_GEN=lead-gen-widget \
GITHUB_REPO_STRESS=stress-widget \
GITHUB_REPO_REASSURANCE=reassurance-widget \
node server.js
```

Open http://localhost:5173 and authenticate with `ADMIN_PASSWORD`.

---

## Environment variables

| Variable                 | Required | Notes                                                                |
| ------------------------ | -------- | -------------------------------------------------------------------- |
| `PORT`                   | system   | Cloud Run injects automatically.                                     |
| `NODE_ENV`               | runtime  | `production` in the Dockerfile (controls cookie `Secure`).           |
| `ADMIN_PASSWORD`         | yes      | Secret. Compared with timing-safe SHA-256.                           |
| `GITHUB_TOKEN`           | yes      | PAT with `repo:contents:write` on the four widget repos.             |
| `GITHUB_OWNER`           | yes      | e.g. `vturlin`.                                                      |
| `GITHUB_REPO`            | yes      | Best-price repo name.                                                |
| `GITHUB_REPO_LEAD_GEN`   | no       | Defaults to `lead-gen-widget`.                                       |
| `GITHUB_REPO_STRESS`     | no       | Defaults to `stress-widget`.                                         |
| `GITHUB_REPO_REASSURANCE`| no       | Defaults to `reassurance-widget`.                                    |
| `GITHUB_BRANCH`          | no       | Defaults to `main`.                                                  |
| `GEMINI_API_KEY`         | no       | Enables Lead-Gen content generation.                                 |
| `BQ_PROJECT_ID`          | no       | Tracker BigQuery project.                                            |
| `BQ_DATASET`             | no       | Defaults to `hotel_widget`.                                          |
| `BQ_TABLE`               | no       | Defaults to `events`.                                                |
| `GOOGLE_APPLICATION_CREDENTIALS` | no | Service-account JSON path. Cloud Run handles this automatically. |

---

## Authentication

- Login: POST `/api/auth` with `{ password }`. Server compares with
  `crypto.timingSafeEqual` over SHA-256 digests, rate-limited to 10
  attempts / 15 min / IP.
- On success: server emits a 32-byte random session token, stored
  in-memory keyed by `token → expiresAt` (TTL 30 days), and returns
  it as an HttpOnly Secure SameSite=Strict cookie.
- All `/api/*` endpoints below the auth layer require the cookie.
  Public exceptions: `/api/auth*`, `/api/rates/*` (widget callers),
  `/api/i`, `/api/track` (tracker beacons).
- Logout: POST `/api/auth-logout` invalidates the token server-side
  and clears the cookie.
- Sessions are lost on Cloud Run cold start (in-memory). At that
  scale this is acceptable; Redis or Memorystore is the upgrade
  path.

---

## Project structure

```
├── server.js                    # Express: auth, GitHub publish, rates proxy, tracker, BigQuery, Gemini
├── src/
│   ├── App.jsx                  # Top-level routing + product selector
│   ├── main.jsx                 # React entry
│   ├── ConfigForm.jsx           # Best-price config form
│   ├── auth/AuthScreen.jsx      # Login screen
│   ├── products/                # Product picker after login
│   ├── landing/                 # Hotel-list landing pages (one per product)
│   ├── leadgen/                 # Lead-Gen forms + tabs
│   ├── reassurance/             # Reassurance forms + tabs
│   ├── stress/                  # Stress-marketing forms + tabs
│   ├── tabs/                    # Shared tab components (Identity / Data / Content / Languages / etc.)
│   ├── admin/                   # Layout shells (TabBar / PreviewPane / GroupCard / TopChrome / …)
│   ├── components/forms/        # Reusable form atoms (TextInput / Select / Toggle / ColorInput / …)
│   ├── stats/                   # BigQuery-backed stats screens
│   ├── hooks/useUnpublishedDiff.js
│   ├── diff.js                  # Config-vs-config diff for the Publish tab
│   ├── utils.js                 # buildConfig + helpers
│   ├── constants.js
│   └── tokens.css               # Design tokens
├── docs/
│   └── infra-notice.md          # Briefing for the infra team
├── Dockerfile                   # Multi-stage Node 20 alpine
├── vite.config.js               # Dev proxies /api → :8080
├── index.html
└── package.json
```

---

## Deployment

```bash
gcloud run deploy hotel-widget-admin \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

Secrets (`ADMIN_PASSWORD`, `GITHUB_TOKEN`, `GEMINI_API_KEY`,
`BQ_*`) should stay in Secret Manager and be bound to the service via
the console — not passed in `--set-env-vars`.

The first deploy after the auth refactor (HttpOnly cookie / token
session) invalidates every existing browser session — operators see
the AuthScreen and re-login once.

---

## Security posture

- Login: SHA-256 + `timingSafeEqual` + rate-limited.
- Session: HttpOnly Secure SameSite=Strict cookie, 30-day TTL,
  server-side revocation on logout.
- All admin `/api/*` endpoints behind a `requireAuth` middleware.
- Public endpoints (`/api/rates/*`, `/api/i`, `/api/track`) have
  their own validation + rate-limit.
- BigQuery queries use parameterised statements.
- CSP locks down sources: `'self'` for everything except Google
  Fonts and the GitHub Pages preview iframe.
- `apiHotelId` is bounded ≤ 10⁷ to prevent cache flooding via
  `/api/rates/*`.
- Tracker accepts events only for hotelIds present in the four
  product repos (cached 5 min).

For the full posture, residual risks and decisions to bring back
from the infra meeting, see [docs/infra-notice.md](docs/infra-notice.md).

---

## Tracker

The first-party tracker is opt-in per hotel (config field
`trackerEnabled: true`) and consent-gated client-side
(`window.HPW_TRACKER_CONSENT === true`). Three events:

- `widget_loaded` — fires once on mount,
- `widget_opened` — when the visitor expands the widget,
- `book_clicked` — when the visitor clicks the Book button.

Events are POSTed to `/api/i` (deliberately opaque path to slip past
generic adblock rules) and inserted into BigQuery. Setup details:
[SETUP-TRACKER.md](SETUP-TRACKER.md).

---

## Related repos

- [`best-price-widget`](https://github.com/vturlin/best-price-widget)
- [`lead-gen-widget`](https://github.com/vturlin/lead-gen-widget)
- [`reassurance-widget`](https://github.com/vturlin/reassurance-widget)
- [`stress-widget`](https://github.com/vturlin/stress-widget)

---

## License

MIT.
