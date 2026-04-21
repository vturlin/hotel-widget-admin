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
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import NodeCache from 'node-cache';
import cors from 'cors';

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