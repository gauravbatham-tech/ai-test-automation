'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Search,
  Sparkles,
  Zap,
  FileCode,
  ShieldCheck,
  Server,
  Layout,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Layers,
  Code2,
  Lock,
  ExternalLink,
  ChevronRight,
  Github,
  Mail,
  BookOpen,
  Workflow,
  BarChart3,
  CircleCheck,
  ArrowUpRight
} from 'lucide-react';
import { InspectionResult, RouteItem } from '@/types';
import { REPO_PRESETS, RepoPreset } from '@/lib/presets';

interface RepoInspectorProps {
  inspection: InspectionResult | null;
  onInspect: (repoUrl: string) => Promise<void>;
  isLoading: boolean;
  onProceedToMatrix: () => void;
  onSelectPreset: (preset: RepoPreset) => void;
}

export const RepoInspector: React.FC<RepoInspectorProps> = ({
  inspection,
  onInspect,
  isLoading,
  onProceedToMatrix,
  onSelectPreset,
}) => {
  const [repoInput, setRepoInput] = useState('https://github.com/shadcn-ui/taxonomy');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<'all' | 'page' | 'api' | 'auth-route' | 'protected'>('all');
  const [selectedSnippetFile, setSelectedSnippetFile] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoInput.trim()) {
      onInspect(repoInput.trim());
    }
  };

  const filteredRoutes = inspection?.detectedRoutes.filter((r) => {
    if (selectedRouteFilter === 'all') return true;
    return r.type === selectedRouteFilter;
  }) || [];

  return (
    <div className="space-y-10">

      {/* Hero Banner / Input Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-[#090d16] p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">

          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30 mb-4">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Phase 1 • Repository Inspection & Token Optimization</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Inspect Repository & Auto-Discover{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Testable Surfaces
            </span>
          </h1>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Eliminates high AI context costs by intelligently pruning non-functional assets,
            reading application routes, auth middleware, and API endpoints with over{' '}
            <strong>98% token savings</strong>.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

              <input
                type="text"
                placeholder="Enter GitHub URL (e.g. vercel/next.js or https://github.com/owner/repo)"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !repoInput.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Inspecting Tree...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Inspect Repo</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Presets */}
          <div className="mt-5 flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-medium text-slate-400">
              Quick Test Presets:
            </span>

            {REPO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setRepoInput(preset.repoUrl);
                  onSelectPreset(preset);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition"
              >
                <span>{preset.name}</span>
                <span className="text-[10px] text-slate-500">
                  ({preset.framework})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inspection Results */}
      {inspection && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Token Optimization Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Raw Repo Context</span>
                <Layers className="h-4 w-4 text-slate-500" />
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-200">
                ~{inspection.tokenBudget.rawRepoTokensEstimated.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  tokens
                </span>
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                {inspection.tokenBudget.filesScanned} total repository files scanned
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-cyan-300">
                <span className="text-xs font-medium">Targeted Context</span>
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>

              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {inspection.tokenBudget.targetedTokensUsed.toLocaleString()}
                <span className="text-xs font-normal text-cyan-400/80 ml-1">
                  tokens
                </span>
              </p>

              <p className="mt-1 text-[11px] text-cyan-400/70">
                {inspection.tokenBudget.targetedFilesCount} functional route &
                auth files isolated
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-emerald-300">
                <span className="text-xs font-medium">
                  Context Token Reduction
                </span>
                <TrendingDown className="h-4 w-4 text-emerald-400" />
              </div>

              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {inspection.tokenBudget.tokensSavedPercentage}%
                <span className="text-xs font-normal text-emerald-400/80 ml-1">
                  saved
                </span>
              </p>

              <p className="mt-1 text-[11px] text-emerald-400/70">
                Prevents context overflow & cuts LLM inference costs
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-violet-300">
                <span className="text-xs font-medium">
                  Framework & Architecture
                </span>
                <Server className="h-4 w-4 text-violet-400" />
              </div>

              <p className="mt-2 text-lg font-bold text-violet-200 truncate">
                {inspection.metadata.framework}
              </p>

              <p className="mt-1 text-[11px] text-violet-300/70">
                Auth:{' '}
                <span className="font-semibold capitalize">
                  {inspection.metadata.authType}
                </span>{' '}
                • Router: {inspection.metadata.routerType}
              </p>
            </div>
          </div>

          {/* Detected Routes */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layout className="h-4 w-4 text-cyan-400" />
                  <span>
                    Auto-Discovered Application Routes (
                    {inspection.detectedRoutes.length})
                  </span>
                </h3>

                <p className="text-xs text-slate-400">
                  Routes parsed from file structure ready for automated test
                  scenario synthesis
                </p>
              </div>

              {/* Route Type Filters */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                {(['all', 'page', 'api', 'auth-route', 'protected'] as const).map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedRouteFilter(filter)}
                      className={`rounded-lg px-2.5 py-1 capitalize transition ${selectedRouteFilter === filter
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {filter === 'auth-route' ? 'Auth' : filter}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Routes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRoutes.map((route, i) => (
                <div
                  key={i}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 hover:border-cyan-500/40 transition"
                >
                  <div className="space-y-1.5">

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-white group-hover:text-cyan-300 transition">
                        {route.path}
                      </span>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${route.type === 'auth-route'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : route.type === 'protected'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : route.type === 'api'
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                      >
                        {route.type.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {route.description || 'Application view'}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
                    <span className="truncate">{route.fileSource}</span>

                    {inspection.sampleCodeSnippets[route.fileSource] && (
                      <button
                        onClick={() =>
                          setSelectedSnippetFile(route.fileSource)
                        }
                        className="text-cyan-400 hover:underline flex items-center gap-0.5 ml-2 shrink-0"
                      >
                        <Code2 className="h-3 w-3" />
                        View Code
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>
                  Ready to synthesize UI, API, Auth, and Integration test cases
                  with Gemini AI
                </span>
              </div>

              <button
                onClick={onProceedToMatrix}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition"
              >
                <span>Generate Test Cases (Gemini AI)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Code Snippet Modal */}
          {selectedSnippetFile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0d1322] p-5 shadow-2xl space-y-3">

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs text-cyan-300">
                    {selectedSnippetFile}
                  </span>

                  <button
                    onClick={() => setSelectedSnippetFile(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200">
                  {inspection.sampleCodeSnippets[selectedSnippetFile]}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Workflow / Product Explanation */}
      <section
        id="workflow"
        className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm"
      >
        <div className="border-b border-slate-800 p-6 sm:p-8">

          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
              A practical QA workflow
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              What Graphify does
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Graphify turns a GitHub repository into a focused, reviewable
              test workflow. It finds application routes and authentication
              entry points, uses that context to shape test cases, then helps
              you run selected checks in a cloud browser and review what
              happened.
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">

            <div className="border-l-2 border-cyan-400 pl-4 py-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <GitBranch className="h-4 w-4 text-cyan-400" />
                Focused discovery
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Inspects useful route and auth files instead of treating every
                repository asset as test context.
              </p>
            </div>

            <div className="border-l-2 border-violet-400 pl-4 py-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Structured test ideas
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Builds a test matrix for UI, API, authentication, and
                integration flows for you to review.
              </p>
            </div>

            <div className="border-l-2 border-emerald-400 pl-4 py-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Observable runs
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Collects execution results and diagnostics so failures are
                easier to investigate.
              </p>
            </div>

          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              How to use it
            </p>

            <h3 className="mt-2 text-xl font-bold text-white">
              Four steps, one test run
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              The navigation at the top follows the same sequence. You can
              start with the example data already loaded or inspect a
              repository of your own.
            </p>
          </div>

          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">

            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-300">
                01
              </span>

              <div>
                <h4 className="text-sm font-semibold text-white">
                  Inspect a repository
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Enter a GitHub URL or choose a quick preset. Add a GitHub
                  token in Settings if you need private repository access or
                  higher API limits.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-xs font-bold text-violet-300">
                02
              </span>

              <div>
                <h4 className="text-sm font-semibold text-white">
                  Review the test matrix
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Continue to the generated cases, review their steps, and
                  select the checks you want to run. Configure a Gemini API key
                  to use AI generation.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300">
                03
              </span>

              <div>
                <h4 className="text-sm font-semibold text-white">
                  Run selected tests
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Set the target application URL and Browserbase credentials
                  in Settings, then launch the selected cases in the cloud
                  runner.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300">
                04
              </span>

              <div>
                <h4 className="text-sm font-semibold text-white">
                  Explore the report
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Check pass rates, run details, and available replay data. Ask
                  Gemini to diagnose a failure or export the QA report as JSON.
                </p>
              </div>
            </li>

          </ol>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

            <p className="text-xs leading-5 text-slate-400">
              <span className="font-semibold text-slate-200">
                Before a live run:
              </span>{' '}
              make sure the target app is reachable from the cloud browser and
              the relevant service credentials are set in Settings.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-cyan-300">
            <span>Start with the repository field above</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </section>

      {/* Product Capabilities */}
      <section
        id="features"
        className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm"
      >
        <div className="max-w-3xl">

          <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
            Built for modern engineering teams
          </p>

          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            Everything you need to turn a codebase into test coverage
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Graphify connects repository intelligence, AI-assisted test
            planning, browser execution, and failure analysis into one
            workflow. Instead of starting from a blank test file, you start
            with an understanding of how the application is actually
            structured.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {[
            {
              icon: GitBranch,
              title: 'Repository intelligence',
              text: 'Map routes, APIs, authentication boundaries, protected pages, and relevant source files before generating tests.'
            },
            {
              icon: Sparkles,
              title: 'AI test synthesis',
              text: 'Turn discovered application surfaces into structured UI, API, auth, and integration scenarios that can be reviewed before execution.'
            },
            {
              icon: Workflow,
              title: 'End-to-end workflow',
              text: 'Move from repository inspection to test selection, browser execution, results, and diagnostics without switching between disconnected tools.'
            },
            {
              icon: ShieldCheck,
              title: 'Authentication-aware testing',
              text: 'Keep authentication and protected routes visible in the test-planning process so important application boundaries are not overlooked.'
            },
            {
              icon: BarChart3,
              title: 'Actionable reporting',
              text: 'Review pass rates, execution details, replay information, and failure diagnostics after a test run.'
            },
            {
              icon: Code2,
              title: 'Developer-friendly context',
              text: 'Inspect source snippets alongside discovered routes so generated scenarios remain understandable and traceable to the codebase.'
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:-translate-y-0.5 hover:border-cyan-500/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                <item.icon className="h-5 w-5 text-cyan-300" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-white">
                {item.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Graphify */}
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-950/30 via-slate-900/50 to-violet-950/20 p-6 sm:p-8">

          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Why Graphify
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Less noise. More application context.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Large repositories contain documentation, generated assets,
            dependencies, configuration, and unrelated files. Feeding
            everything into an AI workflow wastes context. Graphify focuses
            the workflow on the parts of the application that matter for
            testing.
          </p>

          <div className="mt-7 space-y-4">

            {[
              'Identify the application surface before generating tests',
              'Keep generated test cases tied to real routes and source files',
              'Review scenarios before spending browser execution time',
              'Inspect failures with the surrounding application context'
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                <span className="text-sm text-slate-300">
                  {point}
                </span>
              </div>
            ))}

          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">

          <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
            Designed for iteration
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            From first inspection to repeatable QA
          </h2>

          <div className="mt-6 space-y-5">

            {[
              ['01', 'Discover', 'Understand the repository structure and isolate testable surfaces.'],
              ['02', 'Generate', 'Create a structured test matrix from the discovered application context.'],
              ['03', 'Execute', 'Run selected scenarios against the target application in a cloud browser.'],
              ['04', 'Learn', 'Use results and diagnostics to identify failures and improve coverage.']
            ].map(([number, title, text]) => (
              <div key={number} className="flex gap-4">

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-300 border border-violet-500/20">
                  {number}
                </span>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {text}
                  </p>
                </div>

              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Trust / Architecture Strip */}
      <section
        id="security"
        className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6 sm:p-8"
      >
        <div className="grid gap-6 md:grid-cols-3">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              01
            </p>

            <h3 className="mt-2 text-base font-bold text-white">
              Context-first
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Start from the application structure rather than guessing test
              scenarios from a repository name.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              02
            </p>

            <h3 className="mt-2 text-base font-bold text-white">
              Reviewable
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Generated cases remain visible and selectable so you control what
              reaches the execution stage.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              03
            </p>

            <h3 className="mt-2 text-base font-bold text-white">
              Observable
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Execution results and diagnostics provide a feedback loop instead
              of a black-box pass or fail.
            </p>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/50 via-indigo-950/40 to-violet-950/50 p-7 sm:p-10 text-center">

        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.12),transparent_45%)]" />

        <div className="relative mx-auto max-w-2xl">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Ready when your repository is
          </p>

          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
            Build a smarter QA workflow with Graphify.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Start with a GitHub repository, inspect its testable surfaces, and
            move into a focused test workflow.
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg hover:bg-slate-100 transition"
          >
            Start with a repository
            <ArrowUpRight className="h-4 w-4" />
          </button>

        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-slate-800 pt-8 pb-4">

        <div className="grid gap-8 md:grid-cols-[1.4fr_0.7fr_0.7fr]">

          <div>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500 shadow-lg shadow-cyan-500/10">
                <GitBranch className="h-4 w-4 text-white" />
              </div>

              <span className="text-lg font-bold text-white">
                Graphify
              </span>

            </div>

            <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
              AI-assisted repository intelligence and end-to-end QA workflow
              for modern web applications.
            </p>

          </div>

          <div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Product
            </h3>

            <div className="mt-3 space-y-2 text-xs text-slate-500">

              <a
                href="#workflow"
                className="block hover:text-cyan-300 transition"
              >
                Workflow
              </a>

              <a
                href="#features"
                className="block hover:text-cyan-300 transition"
              >
                Capabilities
              </a>

              <a
                href="#security"
                className="block hover:text-cyan-300 transition"
              >
                Security
              </a>

            </div>
          </div>

          <div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Resources
            </h3>

            <div className="mt-3 space-y-2 text-xs text-slate-500">

              <a
                href="#"
                className="flex items-center gap-2 hover:text-cyan-300 transition"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Documentation
              </a>

              <a
                href="#"
                className="flex items-center gap-2 hover:text-cyan-300 transition"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>

              <a
                href="#"
                className="flex items-center gap-2 hover:text-cyan-300 transition"
              >
                <Mail className="h-3.5 w-3.5" />
                Contact
              </a>

            </div>
          </div>

        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-900 pt-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-[11px] text-slate-600">
            © {new Date().getFullYear()} Graphify. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-[11px] text-slate-600">

            <a
              href="#"
              className="hover:text-slate-300 transition"
            >
              Privacy
            </a>

            <a
              href="#"
              className="hover:text-slate-300 transition"
            >
              Terms
            </a>

            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Secure by design
            </span>

          </div>

        </div>
      </footer>

    </div>
  );
};