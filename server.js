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

// ─── /api/current-config/:hotelId ───────────────────────────────────
// Fetches the config currently published on GitHub, if any.
// Returns { exists: false } if this hotelId hasn't been published yet,
// so the client can show a "new publication" state rather than a diff.
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