import { NextRequest, NextResponse } from 'next/server';
import { inspectGitHubRepository } from '@/lib/github';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, githubToken } = body;

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required.' }, { status: 400 });
    }

    const inspection = await inspectGitHubRepository(repoUrl, githubToken || process.env.GITHUB_TOKEN);
    return NextResponse.json(inspection);
  } catch (error: any) {
    console.error('Inspection API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to inspect GitHub repository.' },
      { status: 500 }
    );
  }
}
