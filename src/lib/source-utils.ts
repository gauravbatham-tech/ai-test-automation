import { FileItem, RouteItem, RepositoryMetadata } from '@/types';

export function isExcludedFile(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, '/');
  const excludePatterns = [
    'node_modules/',
    '.git/',
    '.next/',
    '.turbo/',
    'dist/',
    'build/',
    'out/',
    'coverage/',
    '.github/',
    '.vscode/',
    '.idea/',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lockb',
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.gif',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.mp4',
    '.webm',
    '.mp3',
    '.wav',
    '.pdf',
    '.zip',
    '.tar',
    '.gz',
    '.7z',
    '.rar',
    '.map',
    '.DS_Store',
    'Thumbs.db',
  ];

  return excludePatterns.some((pattern) => lower.includes(pattern) || lower.endsWith(pattern));
}

export function classifyFile(path: string): {
  isRelevant: boolean;
  category: 'route' | 'api' | 'auth' | 'component' | 'config' | 'other';
  tokenEstimate: number;
} {
  const normalized = path.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();

  // App router routes
  if (lower.includes('/app/') && (lower.endsWith('page.tsx') || lower.endsWith('page.jsx') || lower.endsWith('page.js'))) {
    return { isRelevant: true, category: 'route', tokenEstimate: 450 };
  }
  // Pages router routes
  if (lower.includes('/pages/') && !lower.includes('/api/') && (lower.endsWith('.tsx') || lower.endsWith('.jsx') || lower.endsWith('.js'))) {
    return { isRelevant: true, category: 'route', tokenEstimate: 420 };
  }
  // API routes
  if (lower.includes('/api/') || lower.endsWith('route.ts') || lower.endsWith('route.js')) {
    const isAuth = lower.includes('auth') || lower.includes('session') || lower.includes('login');
    return { isRelevant: true, category: isAuth ? 'auth' : 'api', tokenEstimate: 380 };
  }
  // Auth files / middleware
  if (lower.includes('auth') || lower.includes('middleware.ts') || lower.includes('middleware.js') || lower.includes('session')) {
    return { isRelevant: true, category: 'auth', tokenEstimate: 320 };
  }
  // Express / Fastify / Node server routes
  if (lower.includes('/routes/') || lower.includes('/controllers/') || lower.endsWith('routes.ts') || lower.endsWith('routes.js')) {
    return { isRelevant: true, category: 'api', tokenEstimate: 360 };
  }
  // React SPA / Vite router definitions
  if (lower.includes('router') || lower.endsWith('app.tsx') || lower.endsWith('app.jsx')) {
    return { isRelevant: true, category: 'route', tokenEstimate: 390 };
  }
  // Main components
  if (lower.includes('/components/') && (lower.endsWith('.tsx') || lower.endsWith('.jsx'))) {
    return { isRelevant: false, category: 'component', tokenEstimate: 350 };
  }
  // Config files
  if (
    lower.endsWith('package.json') ||
    lower.endsWith('next.config.js') ||
    lower.endsWith('next.config.mjs') ||
    lower.endsWith('vite.config.ts') ||
    lower.endsWith('vite.config.js')
  ) {
    return { isRelevant: true, category: 'config', tokenEstimate: 250 };
  }

  return { isRelevant: false, category: 'other', tokenEstimate: 200 };
}

export function extractRouteFromPath(path: string): RouteItem | null {
  const normalized = path.replace(/\\/g, '/');

  // Next.js App Router: app/.../page.tsx or app/.../route.ts
  const appPageMatch = normalized.match(/(?:.*\/)?(?:src\/)?app(\/.*?)\/page\.(?:tsx|jsx|js)$/);
  if (appPageMatch) {
    const route = appPageMatch[1] === '' ? '/' : appPageMatch[1];
    const isAuth = route.includes('auth') || route.includes('login') || route.includes('signup') || route.includes('register');
    const isProtected =
      route.includes('dashboard') ||
      route.includes('admin') ||
      route.includes('account') ||
      route.includes('billing') ||
      route.includes('settings') ||
      route.includes('profile');

    return {
      path: route,
      type: isAuth ? 'auth-route' : isProtected ? 'protected' : 'page',
      fileSource: normalized,
      description: `Next.js App Route: ${route}`,
    };
  }

  // Root app page: src/app/page.tsx or app/page.tsx
  if (normalized.match(/(?:.*\/)?(?:src\/)?app\/page\.(?:tsx|jsx|js)$/)) {
    return {
      path: '/',
      type: 'page',
      fileSource: normalized,
      description: 'Application landing page',
    };
  }

  // Next.js App Router API: app/.../route.ts
  const appApiMatch = normalized.match(/(?:.*\/)?(?:src\/)?app(\/api.*?)\/route\.(?:ts|js)$/);
  if (appApiMatch) {
    const route = appApiMatch[1];
    return {
      path: route,
      type: 'api',
      method: 'GET / POST',
      fileSource: normalized,
      description: `App Router API endpoint: ${route}`,
    };
  }

  // Next.js Pages Router: pages/...
  const pagesMatch = normalized.match(/(?:.*\/)?(?:src\/)?pages(\/.*?)(?:\.(?:tsx|jsx|js))$/);
  if (pagesMatch) {
    let route = pagesMatch[1];
    if (route.endsWith('/index')) route = route.slice(0, -6) || '/';
    if (route === '/_app' || route === '/_document') return null;

    if (route.startsWith('/api/')) {
      return {
        path: route,
        type: 'api',
        method: 'GET / POST',
        fileSource: normalized,
        description: `Pages API endpoint: ${route}`,
      };
    }

    const isAuth = route.includes('auth') || route.includes('login') || route.includes('register') || route.includes('signup');
    const isProtected = route.includes('dashboard') || route.includes('admin') || route.includes('settings');

    return {
      path: route,
      type: isAuth ? 'auth-route' : isProtected ? 'protected' : 'page',
      fileSource: normalized,
      description: `Pages Route: ${route}`,
    };
  }

  // Express / Node routes: routes/users.js -> /api/users
  const expressMatch = normalized.match(/(?:.*\/)?routes\/(.*?)\.(?:ts|js)$/);
  if (expressMatch) {
    const rawName = expressMatch[1];
    const routePath = rawName === 'index' ? '/api' : `/api/${rawName}`;
    return {
      path: routePath,
      type: 'api',
      method: 'GET / POST',
      fileSource: normalized,
      description: `Express / REST Route: ${routePath}`,
    };
  }

  return null;
}

export function detectFrameworkAndAuth(
  filePaths: string[],
  packageJsonContent?: string
): {
  framework: string;
  routerType: RepositoryMetadata['routerType'];
  authType: RepositoryMetadata['authType'];
  language: string;
} {
  let framework = 'Full-Stack JavaScript/TypeScript';
  let routerType: RepositoryMetadata['routerType'] = 'unknown';
  let authType: RepositoryMetadata['authType'] = 'none';
  let hasTs = false;

  const normalizedPaths = filePaths.map((p) => p.replace(/\\/g, '/').toLowerCase());

  for (const p of normalizedPaths) {
    if (p.endsWith('.ts') || p.endsWith('.tsx')) hasTs = true;
    if (p.includes('/app/') && (p.endsWith('page.tsx') || p.endsWith('page.jsx') || p.endsWith('page.js'))) {
      routerType = 'app-router';
    } else if (p.includes('/pages/') && routerType !== 'app-router') {
      routerType = 'pages-router';
    } else if (p.includes('/routes/') && routerType === 'unknown') {
      routerType = 'express';
    }

    if (p.includes('clerk') && authType === 'none') authType = 'clerk';
    if ((p.includes('nextauth') || p.includes('auth.ts')) && authType === 'none') authType = 'next-auth';
    if (p.includes('supabase') && authType === 'none') authType = 'supabase';
  }

  if (packageJsonContent) {
    try {
      const pkg = JSON.parse(packageJsonContent);
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      if (allDeps['@clerk/nextjs']) authType = 'clerk';
      else if (allDeps['next-auth']) authType = 'next-auth';
      else if (allDeps['@supabase/supabase-js'] || allDeps['@supabase/auth-helpers-nextjs']) authType = 'supabase';
      else if (allDeps['firebase']) authType = 'custom';
      else if (allDeps['jsonwebtoken'] || allDeps['passport']) authType = 'jwt';

      if (allDeps['next']) {
        framework = routerType === 'app-router' ? 'Next.js (App Router)' : 'Next.js (Pages Router)';
      } else if (allDeps['vite']) {
        framework = 'Vite + React SPA';
        if (routerType === 'unknown') routerType = 'react-spa';
      } else if (allDeps['express'] || allDeps['fastify'] || allDeps['koa']) {
        framework = allDeps['fastify'] ? 'Fastify Backend API' : 'Express.js Backend API';
        if (routerType === 'unknown') routerType = 'express';
      } else if (allDeps['remix'] || allDeps['@remix-run/react']) {
        framework = 'Remix Run Framework';
      } else if (allDeps['astro']) {
        framework = 'Astro Framework';
      } else if (allDeps['react']) {
        framework = 'React Web Application';
        if (routerType === 'unknown') routerType = 'react-spa';
      }
    } catch {
      // Ignored
    }
  }

  if (routerType === 'app-router' && framework === 'Full-Stack JavaScript/TypeScript') {
    framework = 'Next.js (App Router)';
  } else if (routerType === 'pages-router' && framework === 'Full-Stack JavaScript/TypeScript') {
    framework = 'Next.js (Pages Router)';
  }

  return {
    framework,
    routerType,
    authType,
    language: hasTs ? 'TypeScript' : 'JavaScript',
  };
}
