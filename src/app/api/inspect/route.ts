import { NextRequest, NextResponse } from 'next/server';
import { inspectGitHubRepository } from '@/lib/github';
import { inspectZipArchive } from '@/lib/zip-inspector';
import { inspectDeployedUrl } from '@/lib/crawler';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. Multipart Form Data (ZIP file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = (formData.get('file') || formData.get('zipFile')) as File | null;
      const liveUrl = formData.get('liveUrl') as string | null;
      const sourceType = formData.get('sourceType') as string | null;

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const inspection = await inspectZipArchive(buffer, file.name);
        return NextResponse.json(inspection);
      }

      if (liveUrl) {
        const inspection = await inspectDeployedUrl(liveUrl);
        return NextResponse.json(inspection);
      }

      return NextResponse.json({ error: 'No file or URL provided in form data.' }, { status: 400 });
    }

    // 2. JSON Body
    const body = await req.json().catch(() => ({}));
    const { sourceType, liveUrl, repoUrl, githubToken, zipBase64, fileName } = body;

    // Deployed Web Application URL
    if (sourceType === 'deployed-url' || liveUrl) {
      const targetUrl = liveUrl || repoUrl;
      if (!targetUrl) {
        return NextResponse.json({ error: 'Target URL is required for live application inspection.' }, { status: 400 });
      }
      const inspection = await inspectDeployedUrl(targetUrl);
      return NextResponse.json(inspection);
    }

    // ZIP archive as base64 string
    if (zipBase64) {
      const buffer = Buffer.from(zipBase64, 'base64');
      const inspection = await inspectZipArchive(buffer, fileName || 'uploaded-project.zip');
      return NextResponse.json(inspection);
    }

    // GitHub repository inspection
    if (sourceType === 'github' || repoUrl) {
      if (!repoUrl) {
        return NextResponse.json({ error: 'Repository URL is required.' }, { status: 400 });
      }
      const inspection = await inspectGitHubRepository(repoUrl, githubToken || process.env.GITHUB_TOKEN);
      return NextResponse.json(inspection);
    }

    return NextResponse.json(
      { error: 'Unrecognized inspection source. Provide liveUrl, repoUrl, or upload a zip file.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Inspection API error:', error);
    return NextResponse.json(
      { error: error.message || 'Inspection failed. Please verify project source.' },
      { status: 500 }
    );
  }
}
