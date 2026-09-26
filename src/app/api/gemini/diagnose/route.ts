import { NextRequest, NextResponse } from 'next/server';
import { diagnoseFailureWithGemini } from '@/lib/gemini';
import { TestCase } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testCase, errorMessage, logs, apiKey } = body as {
      testCase: TestCase;
      errorMessage: string;
      logs: string[];
      apiKey?: string;
    };

    if (!testCase || !errorMessage) {
      return NextResponse.json({ error: 'Test case and error message required' }, { status: 400 });
    }

    const diagnosis = await diagnoseFailureWithGemini(
      testCase,
      errorMessage,
      logs || [],
      apiKey || process.env.GEMINI_API_KEY
    );

    return NextResponse.json({ diagnosis });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Diagnostic failed.' },
      { status: 500 }
    );
  }
}
