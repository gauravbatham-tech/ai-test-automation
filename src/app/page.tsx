'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ConfigModal } from '@/components/ConfigModal';
import { RepoInspector } from '@/components/RepoInspector';
import { TestMatrix } from '@/components/TestMatrix';
import { CloudRunner } from '@/components/CloudRunner';
import { QAReportView } from '@/components/QAReportView';
import { AppConfig, InspectionResult, TestCase } from '@/types';
import { REPO_PRESETS, RepoPreset } from '@/lib/presets';
import { generateHeuristicTestCases } from '@/lib/gemini';

const DEFAULT_CONFIG: AppConfig = {
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  browserbaseApiKey: '',
  browserbaseProjectId: '',
  githubToken: '',
  baseUrl: 'http://localhost:3000',
  concurrency: 2,
  headless: true,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'inspect' | 'matrix' | 'runner' | 'report'>('inspect');
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Core Agent Lifecycle State
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Load initial preset and stored config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('autoqa_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error(e);
      }
    }

    // Initialize with first preset for instant out-of-the-box readiness
    const initialPreset = REPO_PRESETS[0];
    setInspection(initialPreset.inspectionData);
    const initialTests = generateHeuristicTestCases(initialPreset.inspectionData, 'http://localhost:3000');
    setTestCases(initialTests);
  }, []);

  // Save config
  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('autoqa_config', JSON.stringify(newConfig));
  };

  // 1. Inspect Repo
  const handleInspect = async (repoUrl: string) => {
    setIsInspecting(true);
    try {
      const res = await fetch('/api/github/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          githubToken: config.githubToken,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to inspect repository.');
      }

      const data: InspectionResult = await res.json();
      setInspection(data);

      // Auto-synthesize initial tests for newly inspected repo
      const synthesizedTests = generateHeuristicTestCases(data, config.baseUrl);
      setTestCases(synthesizedTests);
    } catch (err: any) {
      alert(`Repository Inspection Error: ${err.message}`);
    } finally {
      setIsInspecting(false);
    }
  };

  // Quick preset selector
  const handleSelectPreset = (preset: RepoPreset) => {
    setInspection(preset.inspectionData);
    const tests = generateHeuristicTestCases(preset.inspectionData, config.baseUrl);
    setTestCases(tests);
  };

  // 2. Synthesize Tests with Gemini
  const handleGenerateTests = async () => {
    if (!inspection) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/gemini/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection,
          baseUrl: config.baseUrl,
          apiKey: config.geminiApiKey,
          modelName: config.geminiModel,
        }),
      });

      if (!res.ok) {
        throw new Error('Gemini API test generation failed');
      }

      const data = await res.json();
      if (data.testCases && data.testCases.length > 0) {
        setTestCases(data.testCases);
      }
    } catch (err: any) {
      console.warn('Falling back to heuristic generation:', err);
      const fallbackTests = generateHeuristicTestCases(inspection, config.baseUrl);
      setTestCases(fallbackTests);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Cloud Execution Runner
  const handleExecuteSuite = async (forceFailTestId?: string) => {
    const selected = testCases.filter((t) => t.selected);
    if (selected.length === 0) return;

    setIsRunning(true);
    setHasFinished(false);

    // Reset status of selected tests to pending
    setTestCases((prev) =>
      prev.map((t) => (t.selected ? { ...t, status: 'pending', executionResult: undefined } : t))
    );

    for (let i = 0; i < selected.length; i++) {
      const test = selected[i];
      setActiveTestIndex(i);

      // Mark current test as running
      setTestCases((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, status: 'running' } : t))
      );

      try {
        const isTargetedFail = forceFailTestId === test.id;
        const res = await fetch('/api/browserbase/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testCase: test,
            config: {
              browserbaseApiKey: config.browserbaseApiKey,
              browserbaseProjectId: config.browserbaseProjectId,
              baseUrl: config.baseUrl,
              forceFail: isTargetedFail,
            },
          }),
        });

        const data = await res.json();
        const execResult = data.result;

        setTestCases((prev) =>
          prev.map((t) =>
            t.id === test.id
              ? {
                  ...t,
                  status: execResult.passed ? 'passed' : 'failed',
                  executionResult: execResult,
                }
              : t
          )
        );
      } catch (err: any) {
        setTestCases((prev) =>
          prev.map((t) =>
            t.id === test.id
              ? {
                  ...t,
                  status: 'failed',
                  executionResult: {
                    durationMs: 400,
                    passed: false,
                    error: err.message,
                    logs: [{ timestamp: new Date().toLocaleTimeString(), stepNumber: 1, message: err.message, type: 'error' }],
                    screenshots: [],
                    networkRequests: [],
                  },
                }
              : t
          )
        );
      }

      // Small pause between tests
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setIsRunning(false);
    setHasFinished(true);
  };

  // 4. AI Failure Diagnosis
  const handleDiagnoseTest = async (testCase: TestCase) => {
    if (!testCase.executionResult?.error) return;
    setIsDiagnosing(true);

    try {
      const res = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCase,
          errorMessage: testCase.executionResult.error,
          logs: testCase.executionResult.logs.map((l) => l.message),
          apiKey: config.geminiApiKey,
        }),
      });

      const data = await res.json();
      if (data.diagnosis) {
        setTestCases((prev) =>
          prev.map((t) =>
            t.id === testCase.id && t.executionResult
              ? {
                  ...t,
                  executionResult: {
                    ...t.executionResult,
                    aiRemediation: data.diagnosis,
                  },
                }
              : t
          )
        );
      }
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Test toggling helpers
  const handleToggleTest = (id: string) => {
    setTestCases((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleToggleAll = (selected: boolean) => {
    setTestCases((prev) => prev.map((t) => ({ ...t, selected })));
  };

  const handleAddCustomTest = (newTest: TestCase) => {
    setTestCases((prev) => [newTest, ...prev]);
  };

  const completedCount = testCases.filter((t) => t.status === 'passed' || t.status === 'failed').length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsConfigModalOpen(true)}
        config={config}
        testCount={testCases.length}
        completedCount={completedCount}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inspect' && (
          <RepoInspector
            inspection={inspection}
            onInspect={handleInspect}
            isLoading={isInspecting}
            onProceedToMatrix={() => setActiveTab('matrix')}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {activeTab === 'matrix' && (
          <TestMatrix
            testCases={testCases}
            onToggleTest={handleToggleTest}
            onToggleAll={handleToggleAll}
            onRegenerate={handleGenerateTests}
            isGenerating={isGenerating}
            onLaunchExecution={() => setActiveTab('runner')}
            onAddCustomTest={handleAddCustomTest}
            geminiModel={config.geminiModel}
          />
        )}

        {activeTab === 'runner' && (
          <CloudRunner
            testCases={testCases}
            onExecuteSuite={handleExecuteSuite}
            isRunning={isRunning}
            activeTestIndex={activeTestIndex}
            config={config}
            onViewReport={() => setActiveTab('report')}
            hasFinished={hasFinished}
          />
        )}

        {activeTab === 'report' && (
          <QAReportView
            testCases={testCases}
            config={config}
            onDiagnoseTest={handleDiagnoseTest}
            isDiagnosing={isDiagnosing}
          />
        )}
      </main>

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
