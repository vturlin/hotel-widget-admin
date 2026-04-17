import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { hotelId, config } = await req.json();

    if (!hotelId || typeof hotelId !== 'string') {
      return NextResponse.json({ error: 'Missing hotelId' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(hotelId)) {
      return NextResponse.json({ error: 'Invalid hotelId' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub env vars not configured' },
        { status: 500 }
      );
    }

    const path = `public/configs/${hotelId}.json`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Check if file exists (need its SHA to update)
    const existingRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    let sha: string | undefined;
    if (existingRes.ok) {
      const existing = await existingRes.json();
      sha = existing.sha;
    }

    const contentStr = JSON.stringify(config, null, 2);
    const contentB64 = Buffer.from(contentStr, 'utf-8').toString('base64');

    const payload: Record<string, unknown> = {
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
      const err = await putRes.text();
      return NextResponse.json(
        { error: `GitHub API error: ${err}` },
        { status: putRes.status }
      );
    }

    const result = await putRes.json();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}