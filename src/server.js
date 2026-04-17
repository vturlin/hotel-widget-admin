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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
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