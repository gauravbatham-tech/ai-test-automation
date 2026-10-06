import { NextRequest, NextResponse } from 'next/server';
import { GitHubRepository } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || process.env.GITHUB_TOKEN;
    const username = searchParams.get('username');

    return await fetchGitHubRepos(token, username);
  } catch (error: any) {
    console.error('GitHub Repos API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GitHub repositories.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || process.env.GITHUB_TOKEN;
    const username = body.username;

    return await fetchGitHubRepos(token, username);
  } catch (error: any) {
    console.error('GitHub Repos API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GitHub repositories.' },
      { status: 500 }
    );
  }
}

async function fetchGitHubRepos(token?: string | null, username?: string | null) {
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

  // If token is provided without specific username, get user's private and public repos
  let url: string;
  if (token && !username) {
    url = 'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member';
  } else if (username) {
    url = `https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?per_page=100&sort=updated`;
  } else {
    url = 'https://api.github.com/user/repos?per_page=100&sort=updated';
  }

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
        { error: 'GitHub token unauthorized or expired.' },
        { status: 401 }
      );
    }
    if (res.status === 404) {
      return NextResponse.json(
        { error: `Repositories for "${username || 'account'}" not found.` },
        { status: 404 }
      );
    }
    if (res.status === 403) {
      return NextResponse.json(
        { 
          error: 'GitHub API rate limit exceeded. Provide a GitHub Token with repo scope for unlimited access.',
          rateLimited: true 
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: `GitHub API error (${res.status}): ${message}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    return NextResponse.json({ repositories: [] });
  }

  const repositories: GitHubRepository[] = data.map((item: any) => ({
    id: item.id,
    name: item.name,
    full_name: item.full_name,
    private: Boolean(item.private),
    html_url: item.html_url,
    description: item.description || '',
    fork: Boolean(item.fork),
    stargazers_count: item.stargazers_count || 0,
    forks_count: item.forks_count || 0,
    language: item.language || 'Unknown',
    default_branch: item.default_branch || 'main',
    updated_at: item.updated_at || new Date().toISOString(),
    owner: {
      login: item.owner?.login || '',
      avatar_url: item.owner?.avatar_url || '',
    },
  }));

  return NextResponse.json({ repositories });
}
