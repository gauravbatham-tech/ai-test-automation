import { NextRequest, NextResponse } from 'next/server';
import { inspectGitHubRepository } from '@/lib/github';
import { inspectDeployedUrl } from '@/lib/crawler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, githubToken } = body;

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL or Live URL is required.' }, { status: 400 });
    }

    const trimmed = repoUrl.trim();
    if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('github.com')) {
      const liveInspection = await inspectDeployedUrl(trimmed);
      return NextResponse.json(liveInspection);
    }

    const inspection = await inspectGitHubRepository(trimmed, githubToken || process.env.GITHUB_TOKEN);
    return NextResponse.json(inspection);
  } catch (error: any) {
    console.error('Inspection API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to inspect project source.' },
      { status: 500 }
    );
  }
}
