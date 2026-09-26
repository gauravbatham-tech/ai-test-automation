import { NextRequest, NextResponse } from 'next/server';
import { generateTestCasesWithGemini } from '@/lib/gemini';
import { InspectionResult } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inspection, baseUrl, apiKey, modelName } = body as {
      inspection: InspectionResult;
      baseUrl?: string;
      apiKey?: string;
      modelName?: string;
    };

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection data is required.' }, { status: 400 });
    }

    const effectiveBaseUrl = baseUrl || 'http://localhost:3000';
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    const testCases = await generateTestCasesWithGemini(
      inspection,
      effectiveBaseUrl,
      effectiveApiKey,
      modelName || 'gemini-1.5-flash'
    );

    return NextResponse.json({ testCases });
  } catch (error: any) {
    console.error('Test generation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate test cases.' },
      { status: 500 }
    );
  }
}
