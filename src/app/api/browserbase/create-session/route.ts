import { NextRequest, NextResponse } from 'next/server';
import { BrowserbaseClient } from '@/lib/browserbase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, projectId, config } = body || {};

    const client = new BrowserbaseClient(apiKey, projectId);
    const session = await client.createSession(config);

    return NextResponse.json(session);
  } catch (err: any) {
    console.error('Session creation failed:', err);
    return NextResponse.json({ error: err.message || 'Session creation failed' }, { status: 500 });
  }
}
