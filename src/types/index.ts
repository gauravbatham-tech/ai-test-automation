export type TestCategory = 'UI' | 'API' | 'Auth' | 'Integration';
export type TestSeverity = 'critical' | 'high' | 'medium' | 'low';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestStep {
  order: number;
  action: 'navigate' | 'click' | 'fill' | 'assert' | 'wait' | 'api_call';
  target: string;
  value?: string;
  expected: string;
}

export interface TestAssertion {
  type: 'element_visible' | 'url_match' | 'status_code' | 'text_contains' | 'json_property';
  target: string;
  expected: string | number | boolean;
}

export interface StepLog {
  timestamp: string;
  stepNumber: number;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  screenshotUrl?: string;
  durationMs?: number;
}

export interface NetworkRequestLog {
  url: string;
  method: string;
  status: number;
  durationMs: number;
  type: 'xhr' | 'fetch' | 'document' | 'script';
}

export interface ExecutionResult {
  durationMs: number;
  passed: boolean;
  error?: string;
  logs: StepLog[];
  screenshots: string[];
  networkRequests: NetworkRequestLog[];
  browserbaseSessionId?: string;
  videoUrl?: string;
  replayUrl?: string;
  debuggerUrl?: string;
  aiRemediation?: {
    rootCause: string;
    fixSuggestion: string;
    suggestedCode?: string;
    suggestedSelectorFix?: string;
  };
}

export interface TestCase {
  id: string;
  title: string;
  category: TestCategory;
  severity: TestSeverity;
  targetRoute: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  assertions: TestAssertion[];
  playwrightScript: string;
  status: TestStatus;
  executionResult?: ExecutionResult;
  selected?: boolean;
}

export type ProjectSourceType = 'github' | 'zip' | 'local-folder' | 'deployed-url' | 'manual';

export interface RepositoryMetadata {
  owner: string;
  repo: string;
  branch: string;
  stars?: number;
  language?: string;
  framework: string;
  routerType: 'app-router' | 'pages-router' | 'api-routes' | 'express' | 'react-spa' | 'unknown';
  authType?: 'next-auth' | 'clerk' | 'supabase' | 'jwt' | 'custom' | 'none';
  totalRawFiles: number;
  totalFilteredFiles: number;
  sourceType?: ProjectSourceType;
  liveUrl?: string;
  zipFileName?: string;
  projectName?: string;
  projectType?: 'fullstack' | 'frontend' | 'api-service' | 'live-site';
}

export interface FileItem {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size?: number;
  isRelevant: boolean;
  category?: 'route' | 'api' | 'auth' | 'component' | 'config' | 'other';
  tokenEstimate: number;
}

export interface RouteItem {
  path: string;
  type: 'page' | 'api' | 'auth-route' | 'protected';
  method?: string;
  fileSource: string;
  description?: string;
}

export interface TokenBudget {
  rawRepoTokensEstimated: number;
  targetedTokensUsed: number;
  tokensSavedPercentage: number;
  filesScanned: number;
  targetedFilesCount: number;
}

export interface CrawledPageInfo {
  url: string;
  path: string;
  title?: string;
  status?: number;
  formsCount?: number;
  linksCount?: number;
}

export interface DetectedFormInfo {
  id?: string;
  action?: string;
  method?: string;
  inputs: string[];
  submitText?: string;
}

export interface InspectionResult {
  metadata: RepositoryMetadata;
  files: FileItem[];
  detectedRoutes: RouteItem[];
  tokenBudget: TokenBudget;
  sampleCodeSnippets: Record<string, string>;
  sourceType?: ProjectSourceType;
  liveUrl?: string;
  crawledPages?: CrawledPageInfo[];
  detectedForms?: DetectedFormInfo[];
}

export interface AppConfig {
  geminiApiKey: string;
  geminiModel: string;
  browserbaseApiKey: string;
  browserbaseProjectId: string;
  githubToken?: string;
  clerkPublishableKey?: string;
  clerkSecretKey?: string;
  baseUrl: string;
  concurrency: number;
  headless: boolean;
}

export interface TestRunReport {
  runId: string;
  repository: string;
  startedAt: string;
  completedAt?: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  durationMs: number;
  testCases: TestCase[];
  categoryStats: Record<TestCategory, { total: number; passed: number; failed: number }>;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface BrowserbaseSessionInfo {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR' | 'TIMED_OUT';
  connectUrl: string;
  debuggerFullscreenUrl: string;
  debuggerUrl?: string;
  wsUrl?: string;
  createdAt: string;
  endedAt?: string;
  durationMs?: number;
  region?: string;
  projectId?: string;
  recordingUrl?: string;
}
