import { NextRequest, NextResponse } from 'next/server';
import { executeTestInCloudBrowser } from '@/lib/browserbase';
import { TestCase } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testCase, config } = body as {
      testCase: TestCase;
      config: {
        browserbaseApiKey?: string;
        browserbaseProjectId?: string;
        baseUrl: string;
        forceFail?: boolean;
      };
    };

    if (!testCase) {
      return NextResponse.json({ error: 'Test case is required' }, { status: 400 });
    }

    const result = await executeTestInCloudBrowser(testCase, {
      browserbaseApiKey: config?.browserbaseApiKey || process.env.BROWSERBASE_API_KEY,
      browserbaseProjectId: config?.browserbaseProjectId || process.env.BROWSERBASE_PROJECT_ID,
      baseUrl: config?.baseUrl || 'http://localhost:3000',
      forceFail: config?.forceFail ?? false,
    });

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error('Test execution error:', err);
    return NextResponse.json(
      { error: err.message || 'Execution failed' },
      { status: 500 }
    );
  }
}
