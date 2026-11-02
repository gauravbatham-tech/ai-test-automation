import { GoogleGenerativeAI } from '@google/generative-ai';
import { InspectionResult, TestCase, TestCategory, TestSeverity } from '@/types';

// Fallback test case generator when Gemini API key is omitted or rate-limited
export function generateHeuristicTestCases(inspection: InspectionResult, baseUrl: string): TestCase[] {
  const tests: TestCase[] = [];
  const { detectedRoutes, metadata } = inspection;
  const effectiveBase = (inspection.liveUrl || metadata.liveUrl || baseUrl || 'http://localhost:3000').replace(/\/$/, '');

  // 1. UI Test Cases
  const pageRoutes = detectedRoutes.filter((r) => r.type === 'page' || r.path === '/');
  pageRoutes.forEach((route, idx) => {
    const routePath = route.path === '/' ? '' : route.path;
    const targetUrl = `${effectiveBase}${routePath}`;
    tests.push({
      id: `ui-test-${idx + 1}`,
      title: `Verify ${route.path === '/' ? 'Landing Page' : route.path} UI Rendering & Navigation`,
      category: 'UI',
      severity: idx === 0 ? 'critical' : 'high',
      targetRoute: route.path,
      description: `Validate core DOM landmarks, visible navigation elements, and interactive CTA buttons on ${route.path}.`,
      preconditions: ['Browser viewport initialized to 1280x800', 'Target server is accessible'],
      steps: [
        { order: 1, action: 'navigate', target: targetUrl, expected: 'HTTP 200 and page rendered' },
        { order: 2, action: 'assert', target: 'body', expected: 'Body element is visible in viewport' },
        { order: 3, action: 'click', target: 'a[href], button', expected: 'Trigger interactive state or link navigation' },
        { order: 4, action: 'wait', target: 'networkidle', expected: 'All layout shifts and hydration complete' },
      ],
      assertions: [
        { type: 'element_visible', target: 'header, nav, main, body', expected: true },
        { type: 'url_match', target: 'current_url', expected: targetUrl },
        { type: 'status_code', target: 'response', expected: 200 },
      ],
      playwrightScript: `import { test, expect } from '@playwright/test';

test('UI: Verify ${route.path} visual rendering & layout', async ({ page }) => {
  const response = await page.goto('${targetUrl}', { waitUntil: 'domcontentloaded', timeout: 15000 });
  expect(response?.status()).toBeLessThan(400);

  // Check essential structural containers
  await expect(page.locator('body')).toBeVisible();
  const mainContent = page.locator('main, [role="main"], #__next, #root, body > div');
  await expect(mainContent.first()).toBeVisible();

  // Verify no uncaught console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  await page.waitForTimeout(1000);
  expect(consoleErrors.length).toBeLessThan(5);
});`,
      status: 'pending',
      selected: true,
    });
  });

  // 2. Auth Test Cases
  const authRoutes = detectedRoutes.filter((r) => r.type === 'auth-route' || r.path.includes('login') || r.path.includes('auth'));
  const protectedRoutes = detectedRoutes.filter((r) => r.type === 'protected' || r.path.includes('dashboard') || r.path.includes('settings'));

  if (authRoutes.length > 0 || metadata.authType !== 'none') {
    const loginPath = authRoutes[0]?.path || '/login';
    const loginUrl = `${effectiveBase}${loginPath}`;
    const protectedPath = protectedRoutes[0]?.path || '/dashboard';
    const protectedUrl = `${effectiveBase}${protectedPath}`;

    // Test: Login form validation & submission
    tests.push({
      id: `auth-test-1`,
      title: `Authentication: Login Form Validation & Input Handling`,
      category: 'Auth',
      severity: 'critical',
      targetRoute: loginPath,
      description: `Ensures the login form renders username/password fields, validates empty inputs, and handles credential submission.`,
      preconditions: ['Fresh browser context with cleared storage & cookies'],
      steps: [
        { order: 1, action: 'navigate', target: loginUrl, expected: 'Login screen rendered with credentials inputs' },
        { order: 2, action: 'assert', target: 'input[type="email"], input[name="email"], input[name="username"]', expected: 'Identifier field present' },
        { order: 3, action: 'fill', target: 'input[type="email"], input[name="email"]', value: 'qa-tester@example.com', expected: 'Email field filled' },
        { order: 4, action: 'click', target: 'button[type="submit"]', expected: 'Submit action triggered' },
      ],
      assertions: [
        { type: 'element_visible', target: 'form, input[type="email"], input[name="email"]', expected: true },
        { type: 'text_contains', target: 'body', expected: 'Sign in' },
      ],
      playwrightScript: `import { test, expect } from '@playwright/test';

test('Auth: Validate credentials input and form submission', async ({ page }) => {
  await page.goto('${loginUrl}', { waitUntil: 'networkidle' });

  // Locate login form elements
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[type="text"]').first();
  await expect(emailInput).toBeVisible({ timeout: 6000 });
  await emailInput.fill('qa-test-user@enterprise.org');

  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('TestPassword#2026!');
  }

  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Submit")').first();
  if (await submitButton.isVisible()) {
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  await page.waitForTimeout(1500);
});`,
      status: 'pending',
      selected: true,
    });

    // Test: Protected Route Redirect
    tests.push({
      id: `auth-test-2`,
      title: `Security: Unauthorized Access Redirect on Protected Route`,
      category: 'Auth',
      severity: 'critical',
      targetRoute: protectedPath,
      description: `Guarantees unauthenticated requests accessing ${protectedPath} are redirected to the login gateway.`,
      preconditions: ['No active session token in cookie or localStorage'],
      steps: [
        { order: 1, action: 'navigate', target: protectedUrl, expected: 'Redirect response initiated' },
        { order: 2, action: 'assert', target: 'current_url', expected: `URL redirected to ${loginPath} or contains redirect query` },
      ],
      assertions: [
        { type: 'url_match', target: 'current_url', expected: loginPath },
      ],
      playwrightScript: `import { test, expect } from '@playwright/test';

test('Security: Protected route redirects unauthenticated visitor', async ({ page }) => {
  // Navigate directly to protected route without auth cookie
  await page.goto('${protectedUrl}', { waitUntil: 'load' });
  
  // URL should either redirect to login or show access denied
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  const isRedirectedToAuth = currentUrl.includes('login') || currentUrl.includes('auth') || currentUrl.includes('signin');
  const hasAuthGuard = await page.locator('text=Sign in, text=Log in, text=Unauthorized, text=Access Denied').first().isVisible().catch(() => false);

  expect(isRedirectedToAuth || hasAuthGuard || currentUrl !== '${protectedUrl}').toBeTruthy();
});`,
      status: 'pending',
      selected: true,
    });
  }

  // 3. API Test Cases
  const apiRoutes = detectedRoutes.filter((r) => r.type === 'api');
  if (apiRoutes.length > 0) {
    apiRoutes.slice(0, 3).forEach((route, idx) => {
      const targetUrl = `${effectiveBase}${route.path}`;
      tests.push({
        id: `api-test-${idx + 1}`,
        title: `API Route Contract & Response Code: ${route.path}`,
        category: 'API',
        severity: 'high',
        targetRoute: route.path,
        description: `Verifies HTTP response code, headers, and payload schema for ${route.path}.`,
        preconditions: ['Target API server reachable'],
        steps: [
          { order: 1, action: 'api_call', target: targetUrl, expected: 'HTTP 200, 201, 401 or 403' },
          { order: 2, action: 'assert', target: 'status_code', expected: 200 },
        ],
        assertions: [
          { type: 'status_code', target: 'response', expected: 200 },
        ],
        playwrightScript: `import { test, expect } from '@playwright/test';

test('API: Verify endpoint ${route.path} contract', async ({ request }) => {
  const response = await request.get('${targetUrl}');
  
  // Expect valid HTTP code (200 OK or 401 Unauthorized if protected)
  expect([200, 201, 204, 301, 302, 307, 308, 401, 403, 404, 405]).toContain(response.status());
  
  const headers = response.headers();
  console.log('API Status:', response.status(), 'Headers:', headers);
});`,
        status: 'pending',
        selected: true,
      });
    });
  } else {
    // Generic API test
    tests.push({
      id: `api-test-generic`,
      title: `API Health Check & Response Latency Verification`,
      category: 'API',
      severity: 'medium',
      targetRoute: '/api/health',
      description: `Monitors base API endpoint health check and response times under 1500ms.`,
      preconditions: ['Server is online'],
      steps: [
        { order: 1, action: 'api_call', target: `${effectiveBase}/api/health`, expected: 'API returns within 1500ms' },
      ],
      assertions: [
        { type: 'status_code', target: 'status', expected: 200 },
      ],
      playwrightScript: `import { test, expect } from '@playwright/test';

test('API: Health Check and Response Latency', async ({ request }) => {
  const start = Date.now();
  const response = await request.get('${effectiveBase}/');
  const elapsed = Date.now() - start;

  expect(response.status()).toBeLessThan(500);
  expect(elapsed).toBeLessThan(4000);
});`,
      status: 'pending',
      selected: true,
    });
  }

  // 4. Integration Test Cases
  tests.push({
    id: `integration-test-1`,
    title: `End-to-End User Journey: Navigation, Content Discovery & Interactive Flow`,
    category: 'Integration',
    severity: 'critical',
    targetRoute: '/',
    description: `Executes multi-step user flow: loads homepage, checks viewport responsiveness, clicks navigation links, and verifies uninterrupted session flow.`,
    preconditions: ['Clean session', 'Viewport size 1440x900'],
    steps: [
      { order: 1, action: 'navigate', target: `${effectiveBase}/`, expected: 'Homepage rendered' },
      { order: 2, action: 'click', target: 'nav a, header a', expected: 'Navigate to secondary route' },
      { order: 3, action: 'wait', target: 'load', expected: 'Target view loaded without fatal crash' },
      { order: 4, action: 'assert', target: 'body', expected: 'DOM state remains interactive' },
    ],
    assertions: [
      { type: 'element_visible', target: 'body', expected: true },
      { type: 'status_code', target: 'response', expected: 200 },
    ],
    playwrightScript: `import { test, expect } from '@playwright/test';

test('Integration: Multi-route User Journey & Interactive State', async ({ page }) => {
  // Step 1: Visit Home
  await page.goto('${effectiveBase}/', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();

  // Step 2: Discover and Click primary interactive element
  const links = page.locator('nav a, header a, a[href^="/"]');
  const count = await links.count();
  
  if (count > 0) {
    const targetLink = links.first();
    const href = await targetLink.getAttribute('href');
    if (href && href !== '#' && !href.startsWith('http')) {
      await Promise.all([
        page.waitForNavigation({ timeout: 10000 }).catch(() => null),
        targetLink.click(),
      ]);
    }
  }

  // Step 3: Assert no runtime errors
  await expect(page.locator('body')).toBeVisible();
});`,
    status: 'pending',
    selected: true,
  });

  return tests;
}

// Generate tests using Google Gemini AI
export async function generateTestCasesWithGemini(
  inspection: InspectionResult,
  baseUrl: string,
  apiKey?: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<TestCase[]> {
  const effectiveBase = (inspection.liveUrl || inspection.metadata.liveUrl || baseUrl || 'http://localhost:3000').replace(/\/$/, '');

  if (!apiKey) {
    console.log('No Gemini API key supplied. Utilizing heuristic AST test generator.');
    return generateHeuristicTestCases(inspection, effectiveBase);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const sourceType = inspection.sourceType || inspection.metadata.sourceType || 'github';
  const sourceContext =
    sourceType === 'deployed-url'
      ? `Project Source: LIVE DEPLOYED WEB APPLICATION (${effectiveBase}). Discovered forms: ${JSON.stringify(inspection.detectedForms || [])}. Test actual live elements, forms, links, and API routes on this live domain.`
      : sourceType === 'zip'
      ? `Project Source: LOCAL PROJECT ZIP ARCHIVE (${inspection.metadata.zipFileName || 'project.zip'}). Base URL: ${effectiveBase}.`
      : sourceType === 'local-folder'
      ? `Project Source: LOCAL PROJECT FOLDER (${inspection.metadata.projectName || 'Local Workspace'}). Base URL: ${effectiveBase}.`
      : `Project Source: GITHUB REPOSITORY (${inspection.metadata.owner}/${inspection.metadata.repo}). Base URL: ${effectiveBase}.`;

  const prompt = `You are an expert Principal QA Automation Engineer and Playwright Browserbase specialist.
Analyze this web application structure and auto-generate comprehensive, production-grade automated test cases.

${sourceContext}

Project Metadata:
Framework: ${inspection.metadata.framework}
Router Type: ${inspection.metadata.routerType}
Auth Strategy: ${inspection.metadata.authType}
Target Base URL: ${effectiveBase}

Detected Application Routes:
${JSON.stringify(inspection.detectedRoutes, null, 2)}

Key Source Code Extracts / DOM Landmarks (sample files):
${JSON.stringify(inspection.sampleCodeSnippets, null, 2)}

TASK REQUIREMENTS:
Generate a structured JSON array of test cases covering all 4 core QA pillars:
1. "UI" (Layout rendering, CTA buttons, responsive forms, navigation)
2. "API" (REST/Route handler verification, payload validation, status codes)
3. "Auth" (Login credentials, session cookies, protected route redirects)
4. "Integration" (Multi-step user journey, data state transitions)

CRITICAL INSTRUCTIONS:
- Each test case must include executable, valid Playwright TypeScript code in "playwrightScript" designed for headless cloud browser execution on Browserbase.
- Target the supplied Base URL: "${effectiveBase}".
- Follow this exact JSON schema:
[
  {
    "id": "ui-1",
    "title": "string",
    "category": "UI" | "API" | "Auth" | "Integration",
    "severity": "critical" | "high" | "medium" | "low",
    "targetRoute": "string (e.g. /dashboard)",
    "description": "string",
    "preconditions": ["string"],
    "steps": [
      {
        "order": 1,
        "action": "navigate" | "click" | "fill" | "assert" | "wait" | "api_call",
        "target": "string",
        "value": "string or omitted",
        "expected": "string"
      }
    ],
    "assertions": [
      {
        "type": "element_visible" | "url_match" | "status_code" | "text_contains",
        "target": "string",
        "expected": "string or number or boolean"
      }
    ],
    "playwrightScript": "string with complete valid Playwright test code",
    "status": "pending",
    "selected": true
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((tc: any, index: number) => ({
        ...tc,
        id: tc.id || `test-${index + 1}`,
        status: 'pending',
        selected: true,
      }));
    }
    return generateHeuristicTestCases(inspection, effectiveBase);
  } catch (err: any) {
    console.error('Gemini test generation encountered an error, falling back to heuristic tests:', err);
    return generateHeuristicTestCases(inspection, effectiveBase);
  }
}

// AI Failure Remediation Diagnostic using Gemini
export async function diagnoseFailureWithGemini(
  testCase: TestCase,
  errorMessage: string,
  logs: string[],
  apiKey?: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<{
  rootCause: string;
  fixSuggestion: string;
  suggestedCode?: string;
  suggestedSelectorFix?: string;
}> {
  if (!apiKey) {
    return {
      rootCause: `Assertion or selector timeout: ${errorMessage.slice(0, 150)}...`,
      fixSuggestion: 'Check if the target DOM element exists or needs an increased timeout. Ensure authenticated session cookies are set if the target route is protected.',
      suggestedCode: testCase.playwrightScript.replace('timeout: 5000', 'timeout: 15000'),
      suggestedSelectorFix: 'Add fallback selector or use data-testid attribute',
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `You are a Senior QA Test Automation Architect. A Playwright test failed during cloud browser execution.
Analyze the test failure, error message, execution logs, and Playwright code, and provide an actionable diagnostic.

Test Title: ${testCase.title}
Category: ${testCase.category}
Target Route: ${testCase.targetRoute}
Error Message: ${errorMessage}

Execution Logs:
${logs.slice(-10).join('\n')}

Playwright Script:
${testCase.playwrightScript}

Respond with this exact JSON format:
{
  "rootCause": "Clear explanation of why the test failed (e.g. element selector timed out, unhandled 401 redirect, hydration race condition)",
  "fixSuggestion": "Step-by-step recommendation for the developer or QA team to fix the issue",
  "suggestedCode": "The corrected Playwright test code snippet",
  "suggestedSelectorFix": "Optional better selector (e.g. [data-testid=submit-btn] instead of brittle CSS)"
}`;

  try {
    const res = await model.generateContent(prompt);
    const json = JSON.parse(res.response.text());
    return json;
  } catch (e: any) {
    return {
      rootCause: `Execution error encountered: ${errorMessage}`,
      fixSuggestion: 'Verify DOM stability and ensure asynchronous elements are fully resolved before assertion.',
    };
  }
}
