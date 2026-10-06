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
  ChevronLeft,
  Activity,
  FileText,
  Tv
} from 'lucide-react';
import { TestCase, TestCategory, AppConfig } from '@/types';
import { BrowserbaseSessionModal } from './BrowserbaseSessionModal';

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
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBrowserbaseModalOpen, setIsBrowserbaseModalOpen] = useState(false);

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

  // Replay playback ticker synchronized with steps
  React.useEffect(() => {
    let interval: any;
    const testSteps = selectedTest?.steps || [];
    if (isPlayingReplay && testSteps.length > 0) {
      const stepDuration = Math.max(500, 1500 / playbackSpeed);
      interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev >= testSteps.length - 1) {
            setIsPlayingReplay(false);
            return prev;
          }
          return prev + 1;
        });
      }, stepDuration);
    }
    return () => clearInterval(interval);
  }, [isPlayingReplay, selectedTest, playbackSpeed]);

  // Reset step index when selected test changes
  React.useEffect(() => {
    setActiveStepIndex(0);
    setIsPlayingReplay(false);
  }, [selectedTestId]);

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
                    setActiveStepIndex(0);
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
                  <button
                    onClick={() => setIsBrowserbaseModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-[11px] font-mono text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition shadow-sm"
                    title="Open Browserbase Cloud Session Details"
                  >
                    <Terminal className="h-3 w-3 text-cyan-400" />
                    <span>Browserbase Session</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>
                )}
              </div>

              {/* Tab 1: Video Replay Player */}
              {activeTab === 'video' && (
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                  {/* Video Viewport Screen */}
                  <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-b from-[#0b101e] to-[#04060d] border border-slate-800/80 flex flex-col justify-between p-5 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

                    {/* Browser Chrome Header inside player */}
                    <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-rose-500/80" />
                          <div className="h-2 w-2 rounded-full bg-amber-500/80" />
                          <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-2.5 py-1 text-[10px] font-mono text-slate-300 border border-slate-800">
                          <Globe className="h-3 w-3 text-cyan-400" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{config.baseUrl}{selectedTest.targetRoute}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          STEP {activeStepIndex + 1}/{selectedTest.steps.length || 1}
                        </span>
                        <button
                          onClick={() => setIsBrowserbaseModalOpen(true)}
                          className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                          title="Expand Browserbase cloud session inspector"
                        >
                          <Tv className="h-3 w-3" />
                          <span>Inspect Session</span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Rendered Step State */}
                    <div className="relative z-10 my-auto flex flex-col items-center justify-center p-4">
                      {selectedTest.steps[activeStepIndex] && (
                        <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-md space-y-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="rounded-md bg-cyan-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40 uppercase">
                              [{selectedTest.steps[activeStepIndex].action.toUpperCase()}]
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[220px]">
                              Expected: {selectedTest.steps[activeStepIndex].expected}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Element:</span>
                            <p className="font-mono text-xs font-bold text-cyan-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-1 truncate">
                              {selectedTest.steps[activeStepIndex].target}
                            </p>
                          </div>

                          {selectedTest.steps[activeStepIndex].value && (
                            <div>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Simulated Input Value:</span>
                              <p className="font-mono text-xs text-emerald-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-1">
                                &ldquo;{selectedTest.steps[activeStepIndex].value}&rdquo;
                              </p>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Assertion State:</span>
                            {activeStepIndex === selectedTest.steps.length - 1 && selectedTest.status === 'failed' ? (
                              <span className="font-bold text-rose-400 flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5" />
                                FAILED
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                PASSED
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Viewport Bar */}
                    <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Browserbase Cloud Replay Telemetry</span>
                      </span>
                      <span>Session ID: {selectedTest.executionResult?.browserbaseSessionId || 'bb_sess_cloud'}</span>
                    </div>
                  </div>

                  {/* Replay Controls & Scrubber */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                          disabled={activeStepIndex === 0}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                          title="Previous Step"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                          className="flex items-center justify-center h-8 px-3.5 gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
                        >
                          {isPlayingReplay ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                          <span>{isPlayingReplay ? 'Pause' : 'Play Replay'}</span>
                        </button>
                        <button
                          onClick={() => setActiveStepIndex((prev) => Math.min(selectedTest.steps.length - 1, prev + 1))}
                          disabled={activeStepIndex >= selectedTest.steps.length - 1}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                          title="Next Step"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setActiveStepIndex(0); setIsPlayingReplay(false); }}
                          className="p-1.5 text-slate-400 hover:text-white transition"
                          title="Reset Replay"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Step scrubber */}
                      <div className="flex-1 max-w-sm flex items-center gap-2.5">
                        <span className="font-mono text-xs text-slate-300 shrink-0">
                          Step {activeStepIndex + 1}/{selectedTest.steps.length}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, selectedTest.steps.length - 1)}
                          value={activeStepIndex}
                          onChange={(e) => {
                            setActiveStepIndex(Number(e.target.value));
                            setIsPlayingReplay(false);
                          }}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Speed & Inspector trigger */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-slate-500">Speed:</span>
                          {[0.5, 1, 2].map((spd) => (
                            <button
                              key={spd}
                              onClick={() => setPlaybackSpeed(spd)}
                              className={`px-1.5 py-0.5 rounded font-mono transition ${
                                playbackSpeed === spd
                                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setIsBrowserbaseModalOpen(true)}
                          className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-900/40 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Session</span>
                        </button>
                      </div>
                    </div>

                    {/* Step Sequence Quick Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {selectedTest.steps.map((st, i) => {
                        const isCurrent = i === activeStepIndex;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setActiveStepIndex(i);
                              setIsPlayingReplay(false);
                            }}
                            className={`text-left rounded-xl border p-2 text-xs transition ${
                              isCurrent
                                ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-sm ring-1 ring-cyan-500/40'
                                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[10px] mb-0.5">
                              <span className="text-cyan-400 font-bold">STEP {st.order}</span>
                              <span className="uppercase text-[9px]">{st.action}</span>
                            </div>
                            <p className="truncate text-slate-300 font-mono text-[10px]">{st.target}</p>
                          </button>
                        );
                      })}
                    </div>
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

      {/* Browserbase Session Full Modal Inspector */}
      <BrowserbaseSessionModal
        isOpen={isBrowserbaseModalOpen}
        onClose={() => setIsBrowserbaseModalOpen(false)}
        testCase={selectedTest}
        config={config}
      />
    </div>
  );
};
