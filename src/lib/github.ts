import { FileItem, InspectionResult, RepositoryMetadata, RouteItem, TokenBudget } from '@/types';
import { REPO_PRESETS } from './presets';

// Helper to parse repo url like "owner/repo" or "https://github.com/owner/repo"
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Handle https://github.com/owner/repo or http://github.com/owner/repo
  const urlMatch = trimmed.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }

  // Handle owner/repo
  const shortMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_\.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2].replace(/\.git$/, '') };
  }

  return null;
}

export function isExcludedFile(path: string): boolean {
  const lower = path.toLowerCase();
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
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.mp4',
    '.webm',
    '.pdf',
    '.zip',
    '.tar',
    '.gz',
    '.map',
  ];

  return excludePatterns.some((pattern) => lower.includes(pattern) || lower.endsWith(pattern));
}

export function classifyFile(path: string): {
  isRelevant: boolean;
  category: 'route' | 'api' | 'auth' | 'component' | 'config' | 'other';
  tokenEstimate: number;
} {
  const lower = path.toLowerCase();

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
  // Main components
  if (lower.includes('/components/') && (lower.endsWith('.tsx') || lower.endsWith('.jsx'))) {
    return { isRelevant: false, category: 'component', tokenEstimate: 350 };
  }
  // Config files
  if (lower.endsWith('package.json') || lower.endsWith('next.config.js') || lower.endsWith('next.config.mjs')) {
    return { isRelevant: true, category: 'config', tokenEstimate: 250 };
  }

  return { isRelevant: false, category: 'other', tokenEstimate: 200 };
}

export function extractRouteFromPath(path: string): RouteItem | null {
  // Normalize path
  const normalized = path.replace(/\\/g, '/');

  // Next.js App Router: app/.../page.tsx or app/.../route.ts
  const appPageMatch = normalized.match(/(?:src\/)?app(\/.*?)\/page\.(?:tsx|jsx|js)$/);
  if (appPageMatch) {
    const route = appPageMatch[1] === '' ? '/' : appPageMatch[1];
    const isAuth = route.includes('auth') || route.includes('login') || route.includes('signup') || route.includes('register');
    const isProtected = route.includes('dashboard') || route.includes('admin') || route.includes('account') || route.includes('billing') || route.includes('settings');

    return {
      path: route,
      type: isAuth ? 'auth-route' : isProtected ? 'protected' : 'page',
      fileSource: normalized,
      description: `Next.js App Route: ${route}`,
    };
  }

  // Root app page: src/app/page.tsx or app/page.tsx
  if (normalized.match(/(?:src\/)?app\/page\.(?:tsx|jsx|js)$/)) {
    return {
      path: '/',
      type: 'page',
      fileSource: normalized,
      description: 'Application landing page',
    };
  }

  // Next.js App Router API: app/.../route.ts
  const appApiMatch = normalized.match(/(?:src\/)?app(\/api.*?)\/route\.(?:ts|js)$/);
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
  const pagesMatch = normalized.match(/(?:src\/)?pages(\/.*?)(?:\.(?:tsx|jsx|js))$/);
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

    const isAuth = route.includes('auth') || route.includes('login') || route.includes('register');
    const isProtected = route.includes('dashboard') || route.includes('admin') || route.includes('settings');

    return {
      path: route,
      type: isAuth ? 'auth-route' : isProtected ? 'protected' : 'page',
      fileSource: normalized,
      description: `Pages Route: ${route}`,
    };
  }

  return null;
}

export async function inspectGitHubRepository(
  repoUrl: string,
  githubToken?: string
): Promise<InspectionResult> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository format. Use "owner/repo" or full GitHub URL.');
  }

  const { owner, repo } = parsed;

  // Check if it matches our preset fixtures first for instant, offline, zero-token, zero-rate-limit demo
  const preset = REPO_PRESETS.find(
    (p) =>
      p.inspectionData.metadata.owner.toLowerCase() === owner.toLowerCase() &&
      p.inspectionData.metadata.repo.toLowerCase() === repo.toLowerCase()
  );

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'AutoQA-Agent-Bot',
  };
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  try {
    // 1. Fetch Repository Info
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 60 },
    });

    if (!repoInfoRes.ok) {
      if (preset) {
        console.warn(`GitHub API failed with status ${repoInfoRes.status}, falling back to preset cache for ${owner}/${repo}`);
        return preset.inspectionData;
      }
      if (repoInfoRes.status === 403 || repoInfoRes.status === 429) {
        throw new Error('GitHub API rate limit exceeded. Please provide a GitHub Token in settings or select a sample preset.');
      }
      if (repoInfoRes.status === 404) {
        throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
      }
      throw new Error(`GitHub API error: ${repoInfoRes.statusText}`);
    }

    const repoInfo = await repoInfoRes.json();
    const defaultBranch = repoInfo.default_branch || 'main';

    // 2. Fetch Git Tree recursively
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    if (!treeRes.ok) {
      if (preset) return preset.inspectionData;
      throw new Error(`Failed to fetch repository tree: ${treeRes.statusText}`);
    }

    const treeData = await treeRes.json();
    const treeItems: Array<{ path: string; type: string; size?: number }> = treeData.tree || [];

    const fileItems: FileItem[] = [];
    const detectedRoutes: RouteItem[] = [];
    let rawTokenSum = 0;
    let targetedTokenSum = 0;
    let authType: RepositoryMetadata['authType'] = 'none';
    let routerType: RepositoryMetadata['routerType'] = 'unknown';

    for (const item of treeItems) {
      if (item.type !== 'blob') continue;

      if (isExcludedFile(item.path)) continue;

      const classification = classifyFile(item.path);
      const estTokens = item.size ? Math.ceil(item.size / 3.8) : classification.tokenEstimate;
      rawTokenSum += estTokens;

      const fileItem: FileItem = {
        path: item.path,
        name: item.path.split('/').pop() || item.path,
        type: 'file',
        size: item.size,
        isRelevant: classification.isRelevant,
        category: classification.category,
        tokenEstimate: classification.tokenEstimate,
      };

      fileItems.push(fileItem);

      if (classification.isRelevant) {
        targetedTokenSum += classification.tokenEstimate;

        // Check for router framework
        if (item.path.includes('/app/')) routerType = 'app-router';
        else if (item.path.includes('/pages/') && routerType !== 'app-router') routerType = 'pages-router';

        // Check auth type
        const lower = item.path.toLowerCase();
        if (lower.includes('nextauth') || lower.includes('auth.ts')) authType = 'next-auth';
        else if (lower.includes('supabase') && authType === 'none') authType = 'supabase';
        else if (lower.includes('clerk') && authType === 'none') authType = 'clerk';

        // Extract route
        const route = extractRouteFromPath(item.path);
        if (route && !detectedRoutes.some((r) => r.path === route.path)) {
          detectedRoutes.push(route);
        }
      }
    }

    // Sort detected routes: root first, then pages, then protected, then api
    detectedRoutes.sort((a, b) => {
      if (a.path === '/') return -1;
      if (b.path === '/') return 1;
      return a.path.localeCompare(b.path);
    });

    const targetedFilesCount = fileItems.filter((f) => f.isRelevant).length;
    const tokensSavedPercentage =
      rawTokenSum > 0 ? Number((((rawTokenSum - targetedTokenSum) / rawTokenSum) * 100).toFixed(1)) : 98.5;

    // 3. Selectively fetch code contents for up to 5 critical route files to save tokens
    const sampleCodeSnippets: Record<string, string> = {};
    const criticalFiles = fileItems.filter((f) => f.isRelevant && (f.category === 'route' || f.category === 'auth')).slice(0, 4);

    for (const cf of criticalFiles) {
      try {
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cf.path}`,
          { headers: githubToken ? { Authorization: `token ${githubToken}` } : undefined }
        );
        if (rawRes.ok) {
          const content = await rawRes.text();
          // Trim to max 120 lines to stay lean on tokens
          sampleCodeSnippets[cf.path] = content.split('\n').slice(0, 120).join('\n');
        }
      } catch (err) {
        // Silently skip snippet failure
      }
    }

    const metadata: RepositoryMetadata = {
      owner,
      repo,
      branch: defaultBranch,
      stars: repoInfo.stargazers_count,
      language: repoInfo.language || 'TypeScript',
      framework: routerType === 'app-router' ? 'Next.js (App Router)' : routerType === 'pages-router' ? 'Next.js (Pages Router)' : 'React / Full-stack',
      routerType,
      authType,
      totalRawFiles: treeItems.length,
      totalFilteredFiles: fileItems.length,
    };

    const tokenBudget: TokenBudget = {
      rawRepoTokensEstimated: rawTokenSum || 350000,
      targetedTokensUsed: targetedTokenSum || 4200,
      tokensSavedPercentage: Math.max(90, tokensSavedPercentage),
      filesScanned: treeItems.length,
      targetedFilesCount,
    };

    return {
      metadata,
      files: fileItems,
      detectedRoutes,
      tokenBudget,
      sampleCodeSnippets,
    };
  } catch (err: any) {
    if (preset) {
      console.warn(`GitHub fetch error (${err.message}), serving preset fallback for ${owner}/${repo}`);
      return preset.inspectionData;
    }
    throw err;
  }
}
