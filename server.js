/**
 * Express server for production.
 *
 * In production (on Cloud Run), this server does two things:
 *   1. Serves the Vite-built static frontend from ./dist
 *   2. Exposes two JSON APIs:
 *      - POST /api/auth     — validates the admin password
 *      - POST /api/publish  — pushes a config JSON to GitHub
 *
 * In development, you run `npm run dev` (Vite) and `node server.js` separately.
 * Vite proxies /api/* to this server via the `server.proxy` config.
 *
 * Env vars (all required in production):
 *   PORT              — HTTP port (Cloud Run provides this automatically)
 *   ADMIN_PASSWORD    — password for the admin UI
 *   GITHUB_TOKEN      — Personal Access Token with repo contents write
 *   GITHUB_OWNER      — e.g. "vturlin"
 *   GITHUB_REPO       — e.g. "best-price-widget"
 *   GITHUB_BRANCH     — e.g. "main" (default)
 *
 * Optional (Phase 1 tracker — see SETUP-TRACKER.md):
 *   BQ_PROJECT_ID                   — GCP project that owns the dataset
 *   BQ_DATASET                      — BigQuery dataset (default: hotel_widget)
 *   BQ_TABLE                        — BigQuery table   (default: events)
 *   GOOGLE_APPLICATION_CREDENTIALS  — path to GCP service-account JSON
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import NodeCache from 'node-cache';
import cors from 'cors';
import { BigQuery } from '@google-cloud/bigquery';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── In-memory rates cache ──────────────────────────────────────────
// node-cache handles TTL expiry and periodic cleanup for us. Cache lives
// in the process memory, so it's lost on container restart (Cloud Run
// scales to zero after ~15 min of inactivity). Acceptable for the POC:
// only cost is one extra upstream call on cold start.
//
// stdTTL    = 86400 seconds (24h) — default for every entry
// checkperiod = 600 seconds (10 min) — background sweep of expired keys
// useClones = false — don't deep-clone the big JSON on get/set (faster)

const ratesCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 120,
  useClones: false,
});

function cacheKey(apiHotelId, year, month) {
  return `${apiHotelId}:${year}:${month}`;
}

// ─── Rates API helpers ──────────────────────────────────────────────
// Token generation follows the AvailPro spec:
//   raw  = "{hotelId}:{YYYYMMDD}:Token:{salt}"   (UTC date)
//   hash = MD5(raw)
//   token = hex(hash).lowercase
//
// The date rolls at UTC midnight, so tokens are valid for one UTC day.

function generateRatesApiToken(hotelId) {
  const salt = process.env.RATES_API_SALT;
  if (!salt) throw new Error('RATES_API_SALT not configured');

  const now = new Date();
  const dateStr =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0');

  const raw = `${hotelId}:${dateStr}:Token:${salt}`;
  return crypto.createHash('md5').update(raw, 'utf-8').digest('hex').toLowerCase();
}

async function fetchRatesFromUpstream(apiHotelId, year, month) {
  const baseUrl = process.env.RATES_API_BASE_URL;
  if (!baseUrl) throw new Error('RATES_API_BASE_URL not set');

  const token = generateRatesApiToken(apiHotelId);
  const upstreamUrl = new URL(`${baseUrl}/hotels/${apiHotelId}/prices`);
  upstreamUrl.searchParams.set('year', String(year));
  upstreamUrl.searchParams.set('month', String(month).padStart(2, '0'));
  upstreamUrl.searchParams.set('token', token);

  console.info(
    '[rates] upstream fetch',
    `hotel=${apiHotelId}`,
    `year=${year}`,
    `month=${month}`
  );

  const res = await fetch(upstreamUrl.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Upstream ${res.status}: ${text.slice(0, 200)}`);
    err.upstreamStatus = res.status;
    throw err;
  }

  return res.json();
}

const app = express();

// ─── Security headers ───────────────────────────────────────────────
// Content Security Policy — restrict what the admin UI can load.
// Allowed sources:
//   - 'self': the admin's own Cloud Run origin
//   - Google Fonts for our Inter typeface
//   - D-EDGE logo hotlinked from their site
//   - Thum.io for client site screenshots
//   - GitHub Pages for the widget preview iframe
//   - GitHub API for config fetch/publish (we call it server-side but the
//     browser may preflight; fetch to api.github.com from admin frontend
//     is NOT done directly, but kept as 'self' via our /api proxy)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' https://image.thum.io https://www.d-edge.com data: blob:",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://vturlin.github.io",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  // Additional hardening
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '100kb' }));

// ─── /api/auth ──────────────────────────────────────────────────────
app.post('/api/auth', (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
  }
  const { password } = req.body || {};
  if (password === expected) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Wrong password' });
});
app.get('/api/current-config/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    if (!/^[a-zA-Z0-9_-]+$/.test(hotelId)) {
      return res.status(400).json({ error: 'Invalid hotelId' });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return res.status(500).json({ error: 'GitHub env vars not set' });
    }

    const filePath = `public/configs/${hotelId}.json`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'hotel-widget-admin',
      },
    });

    if (response.status === 404) {
      return res.json({ exists: false });
    }
    if (!response.ok) {
      const errTxt = await response.text();
      return res
        .status(response.status)
        .json({ error: `GitHub API error: ${errTxt.slice(0, 300)}` });
    }

    const data = await response.json();
    // Content is base64-encoded JSON
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    const config = JSON.parse(decoded);
    return res.json({ exists: true, config });
  } catch (err) {
    console.error('[api/current-config]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── /api/publish ───────────────────────────────────────────────────
app.post('/api/publish', async (req, res) => {
  try {
    const { hotelId, config } = req.body || {};
    if (!hotelId || typeof hotelId !== 'string') {
      return res.status(400).json({ error: 'Missing hotelId' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(hotelId)) {
      return res.status(400).json({ error: 'Invalid hotelId' });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return res.status(500).json({ error: 'GitHub env vars not set' });
    }

    const filePath = `public/configs/${hotelId}.json`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'hotel-widget-admin',
    };

    // Check if file already exists (need its SHA to update)
    let sha;
    const existing = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }

    const contentStr = JSON.stringify(config, null, 2);
    const contentB64 = Buffer.from(contentStr, 'utf-8').toString('base64');

    const payload = {
      message: `config: ${sha ? 'update' : 'create'} ${hotelId}`,
      content: contentB64,
      branch,
    };
    if (sha) payload.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const errTxt = await putRes.text();
      return res
        .status(putRes.status)
        .json({ error: `GitHub API error: ${errTxt.slice(0, 300)}` });
    }

    const result = await putRes.json();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────
function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hotel-widget-admin',
  };
}

function githubEnvOk(res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) {
    res.status(500).json({ error: 'GitHub env vars not set' });
    return false;
  }
  return true;
}

// ─── /api/list-configs ───────────────────────────────────────────────
// Lists all published configs by reading public/configs/*.json from the
// widget repo. For each file, fetches the JSON to extract hotelName, and
// uses the commits API to get the most recent modification date.
//
// Note: we do 1 + N requests to GitHub (1 for the directory listing, then
// 2 per file in parallel — one for content, one for the last commit). Fine
// for the POC with a handful of hotels; if this grows to hundreds, we'd
// cache or precompute an index file.
app.get('/api/list-configs', async (req, res) => {
  try {
    if (!githubEnvOk(res)) return;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    const listUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/configs?ref=${branch}`;
    const listRes = await fetch(listUrl, { headers: githubHeaders() });

    if (listRes.status === 404) {
      // Directory doesn't exist yet (no config ever published)
      return res.json({ hotels: [] });
    }
    if (!listRes.ok) {
      const errTxt = await listRes.text();
      return res.status(listRes.status).json({ error: errTxt.slice(0, 300) });
    }

    const files = await listRes.json();
    const jsonFiles = files.filter(
      (f) => f.type === 'file' && f.name.endsWith('.json')
    );

    // For each file, fetch content + last commit in parallel
    const hotels = await Promise.all(
      jsonFiles.map(async (file) => {
        const hotelId = file.name.replace(/\.json$/, '');
        try {
          // Content
          const contentRes = await fetch(file.url, { headers: githubHeaders() });
          const contentData = await contentRes.json();
          const decoded = Buffer.from(contentData.content, 'base64').toString('utf-8');
          const config = JSON.parse(decoded);

          // Last commit that touched this file
          const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(file.path)}&per_page=1&sha=${branch}`;
          const commitsRes = await fetch(commitsUrl, { headers: githubHeaders() });
          const commits = commitsRes.ok ? await commitsRes.json() : [];
          const lastCommitDate = commits[0]?.commit?.author?.date || null;

          return {
            hotelId,
            hotelName: config.hotelName || '',
            updatedAt: lastCommitDate,
          };
        } catch (err) {
          console.error(`[list-configs] failed for ${hotelId}:`, err.message);
          return { hotelId, hotelName: '', updatedAt: null, error: true };
        }
      })
    );

    // Sort by most recent first
    hotels.sort((a, b) => {
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return res.json({ hotels });
  } catch (err) {
    console.error('[api/list-configs]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── /api/duplicate ──────────────────────────────────────────────────
// Copies the JSON from sourceId to newId, keeping all fields except
// updating hotelId references (we don't store hotelId in the JSON but
// clients should update the display name after duplicating).
app.post('/api/duplicate', async (req, res) => {
  try {
    if (!githubEnvOk(res)) return;
    const { sourceId, newId } = req.body || {};
    if (!sourceId || !newId) {
      return res.status(400).json({ error: 'Missing sourceId or newId' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
      return res.status(400).json({ error: 'Invalid newId' });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    // 1. Fetch source config
    const sourcePath = `public/configs/${sourceId}.json`;
    const sourceUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(sourcePath)}?ref=${branch}`;
    const sourceRes = await fetch(sourceUrl, { headers: githubHeaders() });
    if (!sourceRes.ok) {
      return res.status(404).json({ error: `Source config ${sourceId} not found` });
    }
    const sourceData = await sourceRes.json();
    const decoded = Buffer.from(sourceData.content, 'base64').toString('utf-8');
    const config = JSON.parse(decoded);

    // 2. Check target doesn't already exist
    const targetPath = `public/configs/${newId}.json`;
    const targetUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}?ref=${branch}`;
    const existsRes = await fetch(targetUrl, { headers: githubHeaders() });
    if (existsRes.ok) {
      return res.status(409).json({ error: `Config ${newId} already exists` });
    }

    // 3. Update the hotelName to indicate duplication (user can rename after)
    config.hotelName = `${config.hotelName || sourceId} (copy)`;

    // 4. Create target file
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}`, {
      method: 'PUT',
      headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `config: duplicate ${sourceId} → ${newId}`,
        content: Buffer.from(JSON.stringify(config, null, 2), 'utf-8').toString('base64'),
        branch,
      }),
    });

    if (!putRes.ok) {
      const errTxt = await putRes.text();
      return res.status(putRes.status).json({ error: errTxt.slice(0, 300) });
    }

    return res.json({ ok: true, newId });
  } catch (err) {
    console.error('[api/duplicate]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── /api/config/:hotelId (DELETE) ───────────────────────────────────
// Deletes a published config. GitHub API requires the file's current SHA
// for safety (prevents deleting a file that changed under us).
app.delete('/api/config/:hotelId', async (req, res) => {
  try {
    if (!githubEnvOk(res)) return;
    const { hotelId } = req.params;
    if (!/^[a-zA-Z0-9_-]+$/.test(hotelId)) {
      return res.status(400).json({ error: 'Invalid hotelId' });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    // Get current SHA
    const filePath = `public/configs/${hotelId}.json`;
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`;
    const fileRes = await fetch(fileUrl, { headers: githubHeaders() });
    if (!fileRes.ok) {
      return res.status(404).json({ error: `Config ${hotelId} not found` });
    }
    const fileData = await fileRes.json();

    // Delete
    const delRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
      headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `config: delete ${hotelId}`,
        sha: fileData.sha,
        branch,
      }),
    });

    if (!delRes.ok) {
      const errTxt = await delRes.text();
      return res.status(delRes.status).json({ error: errTxt.slice(0, 300) });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[api/config DELETE]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Rates API proxy ────────────────────────────────────────────────
// Proxies calls to the AvailPro rate screener API. Keeps the salt
// server-side (would be a critical leak if ever exposed in the widget)
// and adds an in-memory cache (24h TTL) to avoid hammering upstream.
//
// Response headers set for observability:
//   X-Cache: HIT | MISS
//   X-Cache-Expires-In-Seconds: <seconds>   (on HIT)

const ratesCors = cors({
  origin: true,
  methods: ['GET'],
  maxAge: 3600,
});

app.use('/api/rates', ratesCors);

app.get('/api/rates/:apiHotelId', async (req, res) => {
  try {
    const apiHotelId = parseInt(req.params.apiHotelId, 10);
    if (!Number.isInteger(apiHotelId) || apiHotelId <= 0) {
      return res.status(400).json({ error: 'Invalid apiHotelId' });
    }

    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (
      !Number.isInteger(year) || year < 2020 || year > 2100 ||
      !Number.isInteger(month) || month < 1 || month > 12
    ) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const key = cacheKey(apiHotelId, year, month);

    // Cache first
    const cached = ratesCache.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      const ttl = ratesCache.getTtl(key);
      if (ttl) {
        res.setHeader(
          'X-Cache-Expires-In-Seconds',
          String(Math.floor((ttl - Date.now()) / 1000))
        );
      }
      return res.json(cached);
    }

    // Miss: fetch upstream and cache
    console.info(
      '[rates] cache MISS',
      `hotel=${apiHotelId}`,
      `year=${year}`,
      `month=${month}`
    );
    const data = await fetchRatesFromUpstream(apiHotelId, year, month);
    ratesCache.set(key, data);   // uses stdTTL (24h)
    res.setHeader('X-Cache', 'MISS');
    return res.json(data);
  } catch (err) {
    console.error('[api/rates]', err);
    const status = err.upstreamStatus || 500;
    return res.status(status).json({ error: err.message });
  }
});

// ─── Cache inspection (debugging) ────────────────────────────────────
// Useful to monitor cache effectiveness. Not sensitive but you may want
// to lock this down later.
app.get('/api/rates-cache/stats', (req, res) => {
  const stats = ratesCache.getStats();
  const keys = ratesCache.keys();
  return res.json({
    stats,
    keyCount: keys.length,
    keys: keys.map((k) => {
      const ttl = ratesCache.getTtl(k);
      return {
        key: k,
        expiresInSeconds: ttl ? Math.floor((ttl - Date.now()) / 1000) : null,
      };
    }),
  });
});

// ─── Tracker (Phase 1: 3 widget events) ─────────────────────────────
// Public endpoint hit by the widget on hotels' production sites. The
// widget posts here from any origin, so CORS is wide open. Body is
// minimal: { uid, hotelId, event, payload?, clientTs? }. Server stamps
// its own timestamp + IP hash + UA + page URL.
//
// Storage: BigQuery streaming insert. If GCP is not configured (env
// vars missing), the endpoint logs to console and returns 204 — useful
// for local dev so you can wire the widget without GCP.
//
// See SETUP-TRACKER.md for BigQuery dataset/table setup.

const BQ_PROJECT = process.env.BQ_PROJECT_ID;
const BQ_DATASET = process.env.BQ_DATASET || 'hotel_widget';
const BQ_TABLE = process.env.BQ_TABLE || 'events';
const TRACKER_KNOWN_EVENTS = new Set([
  'widget_loaded',
  'widget_opened',
  'book_clicked',
  'sale', // future, accepted now so phase 3 doesn't need a server change
]);

let bqClient = null;
if (BQ_PROJECT) {
  // Auth resolution is left to @google-cloud/bigquery's default chain:
  //   1. attached service account (Cloud Run, GKE, GCE metadata server)
  //   2. GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
  //   3. gcloud auth application-default login (local dev)
  // We just need the project id; the SDK fails the first insert with a
  // clear auth error if none of the above is set.
  try {
    bqClient = new BigQuery({ projectId: BQ_PROJECT });
    console.info(`[tracker] BigQuery client ready (${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE})`);
  } catch (err) {
    console.error('[tracker] BigQuery init failed; events will only be logged', err);
    bqClient = null;
  }
} else {
  console.warn(
    '[tracker] BQ_PROJECT_ID not set — events will be logged to stdout only'
  );
}

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32);
}

const trackerCors = cors({
  origin: true, // reflect any origin (the widget runs on every hotel's domain)
  methods: ['POST', 'OPTIONS'],
  maxAge: 86400,
  // navigator.sendBeacon (used by the widget under page-unload conditions)
  // always sends with credentials mode = 'include'. The browser then refuses
  // the request unless the response carries Access-Control-Allow-Credentials:
  // true. Our endpoint doesn't actually read any cookie — accepting
  // credentials here is purely to keep the preflight happy.
  credentials: true,
});

app.use('/api/track', trackerCors);

app.post('/api/track', async (req, res) => {
  const { uid, hotelId, event, payload, clientTs } = req.body || {};

  // Validation: cheap rejects before any work
  if (typeof uid !== 'string' || uid.length < 8 || uid.length > 64) {
    return res.status(400).json({ error: 'invalid uid' });
  }
  if (typeof hotelId !== 'string' || !hotelId || hotelId.length > 128) {
    return res.status(400).json({ error: 'invalid hotelId' });
  }
  if (typeof event !== 'string' || !TRACKER_KNOWN_EVENTS.has(event)) {
    return res.status(400).json({ error: 'invalid event' });
  }

  const row = {
    uid,
    hotel_id: hotelId,
    event,
    ts: new Date().toISOString(),
    client_ts: typeof clientTs === 'number' ? new Date(clientTs).toISOString() : null,
    user_agent: (req.headers['user-agent'] || '').slice(0, 512) || null,
    page_url: typeof payload?.pageUrl === 'string' ? payload.pageUrl.slice(0, 1024) : null,
    referrer: typeof payload?.referrer === 'string' ? payload.referrer.slice(0, 1024) : null,
    payload: payload && typeof payload === 'object'
      ? JSON.stringify(payload).slice(0, 4096)
      : null,
    ip_hash: hashIp(
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
        req.socket?.remoteAddress
    ),
  };

  // Always log so it's visible in Cloud Run logs even if BQ is down
  console.info('[tracker]', event, { uid, hotelId });

  if (!bqClient) {
    return res.status(204).send();
  }

  try {
    await bqClient.dataset(BQ_DATASET).table(BQ_TABLE).insert([row]);
    return res.status(204).send();
  } catch (err) {
    // BigQuery insert errors are noisy (PartialFailureError carries per-row
    // detail). Log it but don't bubble to the widget — the user shouldn't
    // see retries on their site for our reporting issues.
    console.error('[tracker] BigQuery insert failed', err.errors || err);
    return res.status(204).send();
  }
});

// ─── Stats (Phase 2) ─────────────────────────────────────────────────
// BigQuery aggregation read by the admin's Stats tab. Two scopes:
//   GET /api/stats/:hotelId   — single-hotel breakdown
//   GET /api/stats            — across all hotels
//
// Query string: ?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults: last 30 days,
// today exclusive). Range capped at 365 days. Returns:
//   { from, to, hotelId, totals: { event: { count, uniqueUsers } },
//     series: [{ day, events: { event: count } }] }
//
// Cached in-memory for 5 minutes per (scope, range) tuple to keep BQ
// scan costs sane when the user toggles dates.

const statsCache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });

function todayUtcStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoUtcStr(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildStatsParams(req) {
  const from = (req.query.from || daysAgoUtcStr(30)).slice(0, 10);
  // `to` is exclusive, default = tomorrow so today's events are included.
  const to = (req.query.to || daysAgoUtcStr(-1)).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { error: 'invalid date format, expected YYYY-MM-DD' };
  }
  const days = Math.floor((Date.parse(to) - Date.parse(from)) / 86400000);
  if (Number.isNaN(days) || days <= 0) {
    return { error: '`to` must be after `from`' };
  }
  if (days > 365) return { error: 'range too large (max 365 days)' };
  return { from, to };
}

function denseSeries(rows, from, to) {
  // Roll BQ rows ([{ day, event, n }]) into [{ day, events: { name: n } }]
  // with a row for every day in the range, even days with zero events.
  const byDay = new Map();
  for (const r of rows) {
    const day = r.day?.value || r.day;
    if (!byDay.has(day)) byDay.set(day, {});
    byDay.get(day)[r.event] = Number(r.n || 0);
  }
  const out = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayStr = d.toISOString().slice(0, 10);
    out.push({ day: dayStr, events: byDay.get(dayStr) || {} });
  }
  return out;
}

async function statsHandler(req, res, hotelId) {
  if (!bqClient) {
    return res.status(503).json({ error: 'BigQuery not configured on this server' });
  }

  const range = buildStatsParams(req);
  if (range.error) return res.status(400).json({ error: range.error });
  const { from, to } = range;

  const cacheKey = `stats:${hotelId || '*'}:${from}:${to}`;
  const cached = statsCache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const tableRef = `\`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE}\``;
    const where = hotelId
      ? 'ts >= @from AND ts < @to AND hotel_id = @hotelId'
      : 'ts >= @from AND ts < @to';
    const params = hotelId
      ? { from: `${from} 00:00:00`, to: `${to} 00:00:00`, hotelId }
      : { from: `${from} 00:00:00`, to: `${to} 00:00:00` };
    const types = hotelId
      ? { from: 'TIMESTAMP', to: 'TIMESTAMP', hotelId: 'STRING' }
      : { from: 'TIMESTAMP', to: 'TIMESTAMP' };

    const [[seriesRows], [totalsRows]] = await Promise.all([
      bqClient.query({
        query: `SELECT DATE(ts) AS day, event, COUNT(*) AS n
                FROM ${tableRef}
                WHERE ${where}
                GROUP BY day, event
                ORDER BY day`,
        params,
        types,
      }),
      bqClient.query({
        query: `SELECT event, COUNT(*) AS n, COUNT(DISTINCT uid) AS unique_users
                FROM ${tableRef}
                WHERE ${where}
                GROUP BY event`,
        params,
        types,
      }),
    ]);

    const totals = {};
    for (const r of totalsRows) {
      totals[r.event] = {
        count: Number(r.n || 0),
        uniqueUsers: Number(r.unique_users || 0),
      };
    }

    const result = {
      hotelId: hotelId || null,
      from,
      to,
      totals,
      series: denseSeries(seriesRows, from, to),
    };

    statsCache.set(cacheKey, result);
    res.setHeader('X-Cache', 'MISS');
    return res.json(result);
  } catch (err) {
    console.error('[api/stats]', err.errors || err);
    return res.status(500).json({ error: err.message || 'BigQuery query failed' });
  }
}

app.get('/api/stats', (req, res) => statsHandler(req, res, null));
app.get('/api/stats/:hotelId', (req, res) =>
  statsHandler(req, res, decodeURIComponent(req.params.hotelId))
);

// ─── Static frontend (production) ───────────────────────────────────
// After `npm run build`, Vite produces ./dist. We serve it from here.
// In dev, you'd run `vite` separately — this block isn't hit.
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

// Catch-all for client-side navigation (not really needed here since
// we have a single page, but it's a cheap safety net).
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// ─── Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[hotel-widget-admin] listening on ${PORT}`);
});