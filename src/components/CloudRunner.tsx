'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe, 
  Activity, 
  ShieldAlert, 
  ArrowRight,
  Tv,
  Check,
  Maximize2
} from 'lucide-react';
import { TestCase, ExecutionResult, AppConfig } from '@/types';

interface CloudRunnerProps {
  testCases: TestCase[];
  onExecuteSuite: (forceFailTestId?: string) => Promise<void>;
  isRunning: boolean;
  activeTestIndex: number;
  config: AppConfig;
  onViewReport: () => void;
  hasFinished: boolean;
}

export const CloudRunner: React.FC<CloudRunnerProps> = ({
  testCases,
  onExecuteSuite,
  isRunning,
  activeTestIndex,
  config,
  onViewReport,
  hasFinished,
}) => {
  const [forceFailSelected, setForceFailSelected] = useState<boolean>(false);
  const selectedTests = testCases.filter((t) => t.selected);
  const currentRunningTest = selectedTests[activeTestIndex] || null;

  const passedCount = selectedTests.filter((t) => t.status === 'passed').length;
  const failedCount = selectedTests.filter((t) => t.status === 'failed').length;
  const completedCount = passedCount + failedCount;
  const progressPercent = selectedTests.length > 0 ? Math.round((completedCount / selectedTests.length) * 100) : 0;

  // Active logs & network requests
  const activeLogs = currentRunningTest?.executionResult?.logs || [];
  const activeNetwork = currentRunningTest?.executionResult?.networkRequests || [];

  return (
    <div className="space-y-6">
      {/* Runner Control Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30 mb-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Phase 3 • Browserbase Cloud Execution Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Cloud Browser Playwright Runner
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Executing headless automation in Browserbase cloud sandbox with live DOM synchronization & session capture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Force failure toggle for demonstration purposes */}
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceFailSelected}
                onChange={(e) => setForceFailSelected(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
              />
              <span className="text-[11px]">Inject Simulated Failure (Test AI Fix)</span>
            </label>

            {!isRunning ? (
              <button
                onClick={() => onExecuteSuite(forceFailSelected ? selectedTests[0]?.id : undefined)}
                disabled={selectedTests.length === 0}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{completedCount > 0 ? 'Re-run Selected Tests' : 'Start Cloud Suite'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2.5 text-xs font-semibold text-cyan-300 animate-pulse">
                <div className="h-3.5 w-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Running in Cloud Browser...</span>
              </div>
            )}

            {hasFinished && (
              <button
                onClick={onViewReport}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
              >
                <span>View Full QA Report & Replays</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Progress: {progressPercent}%</span>
              </span>
              <span className="text-slate-500">({completedCount} of {selectedTests.length} tests complete)</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> {passedCount} Passed
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <XCircle className="h-3.5 w-3.5" /> {failedCount} Failed
              </span>
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cloud Execution Live Viewport & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Test Queue Column */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Queue ({selectedTests.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">{config.concurrency}x Worker</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {selectedTests.map((t, idx) => {
              const isActive = idx === activeTestIndex && isRunning;
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border p-3 text-xs transition ${
                    isActive
                      ? 'border-cyan-500/50 bg-cyan-950/20 shadow-sm shadow-cyan-500/10'
                      : t.status === 'passed'
                      ? 'border-emerald-500/20 bg-emerald-950/10'
                      : t.status === 'failed'
                      ? 'border-rose-500/30 bg-rose-950/10'
                      : 'border-slate-800/80 bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white truncate">{t.title}</span>
                    <span className="shrink-0">
                      {isActive ? (
                        <div className="h-3.5 w-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : t.status === 'passed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : t.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      ) : (
                        <span className="text-[10px] text-slate-500 uppercase font-mono">WAITING</span>
                      )}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-cyan-400/80">{t.targetRoute}</span>
                    <span>{t.executionResult?.durationMs ? `${t.executionResult.durationMs}ms` : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Cloud Browser Viewport & Terminal Output */}
        <div className="lg:col-span-8 space-y-4">
          {/* Virtual Browser Chrome Frame */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            {/* Browser URL Bar header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 ml-2">Chromium Cloud Sandbox (Browserbase)</span>
              </div>

              {currentRunningTest?.executionResult?.browserbaseSessionId && (
                <a
                  href={currentRunningTest.executionResult.replayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
                >
                  <span>{currentRunningTest.executionResult.browserbaseSessionId.slice(0, 16)}...</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>

            {/* URL address box */}
            <div className="flex items-center gap-2 border-b border-slate-800/80 bg-slate-900/40 px-4 py-1.5 text-xs text-slate-400 font-mono">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-200">
                {config.baseUrl}{currentRunningTest?.targetRoute || '/'}
              </span>
            </div>

            {/* Simulated Live Viewport Screen */}
            <div className="relative flex min-h-[280px] sm:min-h-[320px] flex-col items-center justify-center bg-gradient-to-b from-[#090d16] to-[#04060a] p-6 text-center">
              {isRunning ? (
                <div className="space-y-4">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40 animate-ping pointer-events-none" />
                    <Tv className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Browserbase Cloud Session Active</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Executing Playwright test: <span className="text-cyan-300 font-mono">{currentRunningTest?.title}</span>
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-mono text-slate-300 border border-slate-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Streaming DOM events & network traces</span>
                  </div>
                </div>
              ) : hasFinished ? (
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white">Test Execution Finished</h4>
                  <p className="text-xs text-slate-400">
                    {passedCount} passed, {failedCount} failed. Recordings and analytics ready.
                  </p>
                  <button
                    onClick={onViewReport}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:from-cyan-400 hover:to-indigo-500"
                  >
                    <span>View Replays & Analytics</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-slate-500">
                  <Tv className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="text-xs">Browserbase cloud sandbox waiting to launch.</p>
                  <p className="text-[11px] text-slate-600">Click &ldquo;Start Cloud Suite&rdquo; above to begin.</p>
                </div>
              )}
            </div>
          </div>

          {/* Terminal / Real-time Execution Logs */}
          <div className="rounded-3xl border border-slate-800 bg-[#060a12] p-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Playwright Live Execution Stream</span>
              </span>
              <span className="text-[10px] text-slate-500">stdout / stderr</span>
            </div>

            <div className="max-h-56 overflow-auto space-y-1.5 pr-2">
              {activeLogs.length > 0 ? (
                activeLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-[11px] leading-relaxed ${
                      log.type === 'error'
                        ? 'text-rose-400 font-semibold'
                        : log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic text-[11px]">No active output in buffer.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
