'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Terminal,
  Activity,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Clock,
  Layers,
  Cpu,
  ShieldCheck,
  Tv,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Sliders,
  Code
} from 'lucide-react';
import { TestCase, ExecutionResult, AppConfig } from '@/types';

interface BrowserbaseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  config: AppConfig;
}

export const BrowserbaseSessionModal: React.FC<BrowserbaseSessionModalProps> = ({
  isOpen,
  onClose,
  testCase,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'replay' | 'connection' | 'logs' | 'network' | 'json'>('replay');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [useLiveIframe, setUseLiveIframe] = useState(false);

  const execution = testCase?.executionResult;
  const sessionId = execution?.browserbaseSessionId || 'bb_sess_live_cloud';
  const steps = testCase?.steps || [];
  const logs = execution?.logs || [];
  const networkRequests = execution?.networkRequests || [];

  // Fetch session telemetry from API route when opened
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetails();
    }
  }, [isOpen, sessionId]);

  const fetchSessionDetails = async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch(`/api/browserbase/session?id=${encodeURIComponent(sessionId)}&apiKey=${encodeURIComponent(config.browserbaseApiKey || '')}&projectId=${encodeURIComponent(config.browserbaseProjectId || '')}`);
      if (res.ok) {
        const data = await res.json();
        setSessionDetails(data.session);
      }
    } catch (e) {
      console.warn('Failed to load session details:', e);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Playback timer loop
  useEffect(() => {
    let timer: any;
    if (isPlaying && steps.length > 0) {
      const intervalMs = Math.max(600, 1600 / playbackSpeed);
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, playbackSpeed]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen || !testCase) return null;

  const currentStep = steps[currentStepIndex] || steps[0];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isPassed = execution?.passed ?? true;

  const connectUrl = sessionDetails?.connectUrl || `wss://connect.browserbase.com?apiKey=${config.browserbaseApiKey || 'sandbox'}&sessionId=${sessionId}`;
  const debuggerUrl = sessionDetails?.debuggerFullscreenUrl || `https://browserbase.com/sessions/${sessionId}/debug`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-3xl border border-slate-800 bg-[#0a0f1d] shadow-2xl shadow-cyan-950/60 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">Browserbase Cloud Browser Session</h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {sessionDetails?.status || 'COMPLETED'}
                </span>
                {sessionDetails?.isLive && (
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    Live Cloud Sandbox
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                Session ID: <span className="text-cyan-300 font-bold">{sessionId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(sessionId, 'header_session')}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Copy Session ID"
            >
              {copiedField === 'header_session' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-400" />}
              <span>{copiedField === 'header_session' ? 'Copied' : 'Copy ID'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-2">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('replay')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === 'replay'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Session Player & Visual Sandbox</span>
            </button>
            <button
              onClick={() => setActiveTab('connection')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === 'connection'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Live URLs & Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === 'logs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Stdout Logs ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === 'network'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Network Telemetry ({networkRequests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === 'json'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>Region: {sessionDetails?.region || 'us-west-2'}</span>
            <span>• 1280x800 @ 60fps</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* TAB 1: Session Player & Visual Sandbox */}
          {activeTab === 'replay' && (
            <div className="space-y-4">
              
              {/* Virtual Browser Window Frame */}
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#060a14] shadow-2xl">
                {/* Browser Address Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 ml-2">Chromium Sandbox</span>
                  </div>

                  {/* URL Bar */}
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1 text-slate-300 font-mono text-xs border border-slate-800 max-w-md w-full">
                    <Globe className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{config.baseUrl}{testCase.targetRoute}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                      STEP {currentStepIndex + 1}/{steps.length || 1}
                    </span>
                  </div>
                </div>

                {/* Simulated Rendered Web Page Viewport */}
                <div className="relative aspect-[16/9] w-full bg-gradient-to-b from-[#0b101d] to-[#040711] p-6 flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

                  {/* Top Web Page Mock Header */}
                  <div className="relative z-10 flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-black">
                        QA
                      </div>
                      <span className="font-bold text-white text-xs">Application Sandbox View</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Target: {testCase.category} Scenario</span>
                      <span className="text-cyan-400">Severity: {testCase.severity.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Simulated Dynamic Content for Current Step */}
                  <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
                    {currentStep && (
                      <div className="w-full rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-md space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/40 uppercase">
                            ACTION: {currentStep.action}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Expected: {currentStep.expected}
                          </span>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 font-mono">Target DOM Selector:</div>
                          <div className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 p-2 rounded-lg border border-slate-800 mt-1 truncate">
                            {currentStep.target}
                          </div>
                        </div>

                        {currentStep.value && (
                          <div>
                            <div className="text-[11px] text-slate-400 font-mono">Input Value Typed:</div>
                            <div className="text-xs font-mono text-emerald-300 bg-slate-950 p-2 rounded-lg border border-slate-800 mt-1">
                              &ldquo;{currentStep.value}&rdquo;
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Execution State:</span>
                          {isLastStep && !isPassed ? (
                            <span className="font-bold text-rose-400">FAILED: Assertion Timeout</span>
                          ) : (
                            <span className="font-bold text-emerald-400">SUCCESS: Condition Met</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Viewport Status Strip */}
                  <div className="relative z-10 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>Browserbase Cloud Headless Chromium</span>
                    </span>
                    <span>Test: {testCase.title}</span>
                  </div>
                </div>

                {/* Player Controls Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/90 p-4">
                  {/* Play / Pause & Step Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentStepIndex === 0}
                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                      title="Previous Step"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex items-center justify-center h-8 px-4 gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                      <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
                    </button>
                    <button
                      onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                      disabled={currentStepIndex >= steps.length - 1}
                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                      title="Next Step"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setCurrentStepIndex(0); setIsPlaying(false); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
                      title="Reset to beginning"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Timeline Scrubber */}
                  <div className="flex-1 max-w-md w-full flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      Step {currentStepIndex + 1}/{steps.length}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, steps.length - 1)}
                      value={currentStepIndex}
                      onChange={(e) => {
                        setCurrentStepIndex(Number(e.target.value));
                        setIsPlaying(false);
                      }}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Speed Controls */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500 mr-1">Speed:</span>
                    {[0.5, 1, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded font-mono transition ${
                          playbackSpeed === spd
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step Timeline Pills */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Execution Step Sequence</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {steps.map((st, i) => {
                    const isCurrent = i === currentStepIndex;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentStepIndex(i);
                          setIsPlaying(false);
                        }}
                        className={`text-left rounded-xl border p-2.5 text-xs transition ${
                          isCurrent
                            ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-sm ring-1 ring-cyan-500/40'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                          <span className="text-cyan-400 font-bold">STEP {st.order}</span>
                          <span className="uppercase">{st.action}</span>
                        </div>
                        <p className="truncate text-slate-200 font-mono text-[11px]">{st.target}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live URLs & Telemetry */}
          {activeTab === 'connection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* WebSocket Connect URL */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-cyan-400" />
                      <span>WebSocket Playwright Connect URL</span>
                    </span>
                    <button
                      onClick={() => handleCopy(connectUrl, 'ws_url')}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      {copiedField === 'ws_url' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedField === 'ws_url' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-cyan-300 break-all whitespace-pre-wrap border border-slate-800/80">
                    {connectUrl}
                  </pre>
                  <p className="text-[11px] text-slate-500">
                    Pass this URL to <code className="text-cyan-400">chromium.connectOverCDP(connectUrl)</code> to stream automation through Browserbase.
                  </p>
                </div>

                {/* Fullscreen Debugger URL */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Globe className="h-4 w-4 text-violet-400" />
                      <span>Live Debugger URL</span>
                    </span>
                    <a
                      href={debuggerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      <span>Open in Browserbase</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-violet-300 break-all whitespace-pre-wrap border border-slate-800/80">
                    {debuggerUrl}
                  </pre>
                  <p className="text-[11px] text-slate-500">
                    Browserbase cloud debugger console with live DOM tree and interactive remote control.
                  </p>
                </div>
              </div>

              {/* Key Session KPI Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Status</span>
                  <p className="text-sm font-bold text-emerald-400">{sessionDetails?.status || 'COMPLETED'}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Execution Duration</span>
                  <p className="text-sm font-bold text-white">{execution?.durationMs || 1240} ms</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Cloud Sandbox Region</span>
                  <p className="text-sm font-bold text-cyan-300 truncate">{sessionDetails?.region || 'us-west-2'}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Total Steps Run</span>
                  <p className="text-sm font-bold text-violet-300">{steps.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Stdout Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Playwright Execution Output Traces</span>
                <button
                  onClick={() => handleCopy(logs.map((l) => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`).join('\n'), 'all_logs')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  {copiedField === 'all_logs' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === 'all_logs' ? 'Logs Copied' : 'Copy All Logs'}</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[460px] overflow-auto space-y-2">
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-slate-900 bg-slate-900/40 p-2.5 text-[11px]"
                    >
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span className={`shrink-0 font-bold ${
                        log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-slate-200">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No logs recorded for this session.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Network Telemetry */}
          {activeTab === 'network' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Captured HTTP Network Requests</span>
                <span className="text-slate-500 text-[11px]">{networkRequests.length} requests recorded</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 max-h-[460px] overflow-auto space-y-2">
                {networkRequests.length > 0 ? (
                  networkRequests.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          {req.method}
                        </span>
                        <span className="text-slate-200 truncate">{req.url}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <span className="text-emerald-400 font-semibold">{req.status} OK</span>
                        <span className="text-slate-500">{req.durationMs}ms</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic p-3">No network calls captured.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Raw JSON */}
          {activeTab === 'json' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Browserbase Session Payload</span>
                <button
                  onClick={() => handleCopy(JSON.stringify(sessionDetails || execution, null, 2), 'raw_json')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  {copiedField === 'raw_json' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === 'raw_json' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-[460px] overflow-auto text-[11px] text-slate-300 leading-relaxed">
                {JSON.stringify(
                  {
                    session: sessionDetails,
                    executionResult: execution,
                    testCaseId: testCase.id,
                    targetRoute: testCase.targetRoute,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Browserbase Cloud Platform • Active Headless Sandbox</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Close Session Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
