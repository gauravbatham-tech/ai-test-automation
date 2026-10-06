import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || process.env.GITHUB_TOKEN;
    const username = searchParams.get('username');

    return await fetchGitHubUser(token, username);
  } catch (error: any) {
    console.error('GitHub User API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GitHub user.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || process.env.GITHUB_TOKEN;
    const username = body.username;

    return await fetchGitHubUser(token, username);
  } catch (error: any) {
    console.error('GitHub User API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GitHub user.' },
      { status: 500 }
    );
  }
}

async function fetchGitHubUser(token?: string | null, username?: string | null) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Graphify-AutoQA-Agent',
  };

  if (token && token.trim().length > 0) {
    const cleanToken = token.trim();
    headers['Authorization'] = cleanToken.startsWith('Bearer ') || cleanToken.startsWith('token ') 
      ? cleanToken 
      : `Bearer ${cleanToken}`;
  }

  // If token is provided without a username, fetch authenticated user /user
  const url = token && !username 
    ? 'https://api.github.com/user' 
    : username 
      ? `https://api.github.com/users/${encodeURIComponent(username.trim())}` 
      : 'https://api.github.com/user';

  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let parsedErr: any = {};
    try {
      parsedErr = JSON.parse(errText);
    } catch {}

    const message = parsedErr.message || res.statusText;
    if (res.status === 401) {
      return NextResponse.json(
        { error: 'Invalid GitHub Personal Access Token. Please check token permissions.' },
        { status: 401 }
      );
    }
    if (res.status === 404) {
      return NextResponse.json(
        { error: `GitHub user "${username}" was not found.` },
        { status: 404 }
      );
    }
    if (res.status === 403) {
      return NextResponse.json(
        { error: 'GitHub API rate limit exceeded or insufficient scopes.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: `GitHub API error (${res.status}): ${message}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const user = {
    login: data.login,
    id: data.id,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
    name: data.name || data.login,
    bio: data.bio || '',
    public_repos: data.public_repos || 0,
    total_private_repos: data.total_private_repos || 0,
  };

  return NextResponse.json({ user });
}
