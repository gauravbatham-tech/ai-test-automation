'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3, 
  Sparkles, 
  Video, 
  ExternalLink, 
  Terminal, 
  Globe, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  Code2, 
  Check, 
  ChevronRight, 
  Activity,
  FileText
} from 'lucide-react';
import { TestCase, TestCategory, AppConfig } from '@/types';

interface QAReportViewProps {
  testCases: TestCase[];
  config: AppConfig;
  onDiagnoseTest: (test: TestCase) => Promise<void>;
  isDiagnosing: boolean;
}

export const QAReportView: React.FC<QAReportViewProps> = ({
  testCases,
  config,
  onDiagnoseTest,
  isDiagnosing,
}) => {
  const executedTests = testCases.filter((t) => t.status === 'passed' || t.status === 'failed');
  const [selectedTestId, setSelectedTestId] = useState<string>(
    executedTests.find((t) => t.status === 'failed')?.id || executedTests[0]?.id || testCases[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'video' | 'steps' | 'network' | 'logs'>('video');
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);

  const selectedTest = testCases.find((t) => t.id === selectedTestId) || testCases[0];

  const total = executedTests.length;
  const passed = executedTests.filter((t) => t.status === 'passed').length;
  const failed = executedTests.filter((t) => t.status === 'failed').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const totalDurationMs = executedTests.reduce((acc, t) => acc + (t.executionResult?.durationMs || 0), 0);
  const avgDurationMs = total > 0 ? Math.round(totalDurationMs / total) : 0;

  // Category breakdown
  const categoryStats: Record<TestCategory, { total: number; passed: number; failed: number }> = {
    UI: { total: 0, passed: 0, failed: 0 },
    API: { total: 0, passed: 0, failed: 0 },
    Auth: { total: 0, passed: 0, failed: 0 },
    Integration: { total: 0, passed: 0, failed: 0 },
  };

  executedTests.forEach((t) => {
    if (categoryStats[t.category]) {
      categoryStats[t.category].total += 1;
      if (t.status === 'passed') categoryStats[t.category].passed += 1;
      if (t.status === 'failed') categoryStats[t.category].failed += 1;
    }
  });

  // Replay playback ticker
  React.useEffect(() => {
    let interval: any;
    if (isPlayingReplay) {
      interval = setInterval(() => {
        setReplayProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingReplay(false);
            return 0;
          }
          return prev + 5;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlayingReplay]);

  // Export JSON Report
  const handleExportJSON = () => {
    const reportData = {
      title: 'AutoQA Comprehensive Test Run Report',
      date: new Date().toISOString(),
      analytics: {
        totalTests: total,
        passed,
        failed,
        passRate: `${passRate}%`,
        totalDurationMs,
        avgDurationMs,
      },
      categoryStats,
      results: executedTests.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        severity: t.severity,
        targetRoute: t.targetRoute,
        status: t.status,
        durationMs: t.executionResult?.durationMs,
        error: t.executionResult?.error,
        browserbaseSessionId: t.executionResult?.browserbaseSessionId,
        replayUrl: t.executionResult?.replayUrl,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoqa-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Phase 4 • Comprehensive Reporting & Visual Replays</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            QA Execution Intelligence & Session Replay
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual inspection logs, step timeline telemetry, and Gemini AI root-cause diagnosis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export Report (JSON)</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate Gauge */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Suite Pass Rate</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${passRate >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passRate}%
            </span>
            <span className="text-xs text-slate-400">({passed}/{total} passed)</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${passRate >= 80 ? 'bg-emerald-400' : 'bg-rose-500'}`}
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>

        {/* Failed Tests */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Failed Scenarios</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">{failed}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {failed > 0 ? 'Requires Gemini AI root-cause analysis' : 'Zero regression defects detected'}
          </p>
        </div>

        {/* Avg Duration */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Average Test Duration</span>
            <Clock className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {avgDurationMs}
            <span className="text-xs font-normal text-slate-400 ml-1">ms</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Cloud Chromium execution speed</p>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Category Breakdown</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="space-y-1.5 text-[11px]">
            {(['UI', 'API', 'Auth', 'Integration'] as const).map((cat) => {
              const stat = categoryStats[cat];
              return (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-slate-400">{cat}</span>
                  <span className="font-semibold text-slate-200">
                    {stat.passed}/{stat.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Studio: Sidebar + Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Executed Test Cases List */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white">Executed Tests ({executedTests.length})</h3>
            <span className="text-[10px] text-slate-400">Select to inspect replay</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-auto pr-1">
            {executedTests.map((t) => {
              const isSelected = t.id === selectedTestId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTestId(t.id);
                    setReplayProgress(0);
                    setIsPlayingReplay(false);
                  }}
                  className={`w-full text-left rounded-xl border p-3 text-xs transition ${
                    isSelected
                      ? 'border-cyan-500/50 bg-cyan-950/20 shadow-sm shadow-cyan-500/10'
                      : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white truncate">{t.title}</span>
                    <span>
                      {t.status === 'passed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-cyan-400/80">{t.targetRoute}</span>
                    <span>{t.executionResult?.durationMs}ms</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Replay Video, Step Logs, Network, and AI Fix */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTest && (
            <>
              {/* AI Remediation Card (Triggered if Failed) */}
              {selectedTest.status === 'failed' && (
                <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                      <ShieldAlert className="h-5 w-5" />
                      <span>Defect Detected: Test Failed</span>
                    </div>

                    <button
                      onClick={() => onDiagnoseTest(selectedTest)}
                      disabled={isDiagnosing}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                      <span>{isDiagnosing ? 'Analyzing Failure...' : 'Diagnose with Gemini AI'}</span>
                    </button>
                  </div>

                  <p className="font-mono text-xs text-rose-200 bg-rose-950/60 p-3 rounded-xl border border-rose-900/50">
                    {selectedTest.executionResult?.error || 'Assertion timed out or selector not visible'}
                  </p>

                  {/* AI Remediation Output */}
                  {selectedTest.executionResult?.aiRemediation && (
                    <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 text-violet-300 font-bold">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        <span>Gemini AI Root Cause Diagnosis:</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {selectedTest.executionResult.aiRemediation.rootCause}
                      </p>

                      <div className="pt-2 border-t border-violet-900/40">
                        <span className="font-semibold text-cyan-300">Recommended Fix:</span>
                        <p className="text-slate-300 mt-1 leading-relaxed">
                          {selectedTest.executionResult.aiRemediation.fixSuggestion}
                        </p>
                      </div>

                      {selectedTest.executionResult.aiRemediation.suggestedCode && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[11px] font-mono text-slate-400">Suggested Code Patch:</span>
                          <pre className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-emerald-300 overflow-auto">
                            {selectedTest.executionResult.aiRemediation.suggestedCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Bar for Replay Studio */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                      activeTab === 'video'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Visual Replay Player</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('steps')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                      activeTab === 'steps'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Step Telemetry ({selectedTest.executionResult?.logs.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('network')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                      activeTab === 'network'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Network ({selectedTest.executionResult?.networkRequests.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                      activeTab === 'logs'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>Playwright Script</span>
                  </button>
                </div>

                {selectedTest.executionResult?.browserbaseSessionId && (
                  <a
                    href={selectedTest.executionResult.replayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
                  >
                    <span>Browserbase Session</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Tab 1: Video Replay Player */}
              {activeTab === 'video' && (
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                  {/* Video Viewport Screen */}
                  <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-tr from-slate-950 via-[#0a101d] to-slate-900 border border-slate-800/80 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

                    {/* Dynamic Simulated Screen Content based on replayProgress */}
                    <div className="relative z-10 space-y-3 max-w-md">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-mono text-cyan-300 border border-slate-800">
                        <span>ROUTE: {config.baseUrl}{selectedTest.targetRoute}</span>
                      </div>

                      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 text-left font-mono text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span>BROWSERBASE SESSION</span>
                          <span className="text-emerald-400">1280x800 @ 60fps</span>
                        </div>
                        <p className="text-white font-semibold">{selectedTest.title}</p>
                        <p className="text-slate-400 text-[11px]">
                          Current Step: {Math.min(selectedTest.steps.length, Math.floor((replayProgress / 100) * selectedTest.steps.length) + 1)} / {selectedTest.steps.length}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {isPlayingReplay ? 'Replaying cloud browser session recording...' : 'Click Play to stream video replay'}
                      </div>
                    </div>
                  </div>

                  {/* Video Player Scrubber & Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition"
                        >
                          {isPlayingReplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                        </button>
                        <button
                          onClick={() => setReplayProgress(0)}
                          className="p-1.5 text-slate-400 hover:text-white"
                          title="Reset Replay"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <span className="font-mono text-xs text-slate-300">
                          {((replayProgress / 100) * (selectedTest.executionResult?.durationMs || 1500) / 1000).toFixed(1)}s / {((selectedTest.executionResult?.durationMs || 1500) / 1000).toFixed(1)}s
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        Session: {selectedTest.executionResult?.browserbaseSessionId || 'Cloud Recording'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={replayProgress}
                      onChange={(e) => setReplayProgress(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Step Telemetry */}
              {activeTab === 'steps' && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-2 max-h-96 overflow-auto">
                  {selectedTest.executionResult?.logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs"
                    >
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span className={`shrink-0 ${log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-slate-200">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Network Requests */}
              {activeTab === 'network' && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-2 max-h-96 overflow-auto font-mono text-xs">
                  {selectedTest.executionResult?.networkRequests.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                          {req.method}
                        </span>
                        <span className="text-slate-300 truncate">{req.url}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <span className="text-emerald-400 font-semibold">{req.status}</span>
                        <span className="text-slate-500">{req.durationMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Playwright Script */}
              {activeTab === 'logs' && (
                <div className="rounded-3xl border border-slate-800 bg-[#060a12] p-4 font-mono text-xs space-y-2">
                  <pre className="max-h-96 overflow-auto text-slate-300 leading-relaxed">
                    {selectedTest.playwrightScript}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
