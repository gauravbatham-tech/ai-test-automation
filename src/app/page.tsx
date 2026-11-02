'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ConfigModal } from '@/components/ConfigModal';
import { ConnectRepoModal } from '@/components/ConnectRepoModal';
import { RepoInspector } from '@/components/RepoInspector';
import { TestMatrix } from '@/components/TestMatrix';
import { CloudRunner } from '@/components/CloudRunner';
import { QAReportView } from '@/components/QAReportView';
import { AppConfig, InspectionResult, TestCase, GitHubUser, GitHubRepository } from '@/types';
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
  const [isConnectRepoModalOpen, setIsConnectRepoModalOpen] = useState(false);
  const [connectedUser, setConnectedUser] = useState<GitHubUser | null>(null);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('');

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

    const savedUser = localStorage.getItem('autoqa_github_user');
    if (savedUser) {
      try {
        setConnectedUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const savedRepo = localStorage.getItem('autoqa_selected_repo');
    if (savedRepo) {
      setSelectedRepoFullName(savedRepo);
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

  // 1a. Inspect GitHub Repo or Deployed URL fallback
  const handleInspect = async (inputStr: string) => {
    const trimmed = inputStr.trim();
    if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('github.com')) {
      return handleInspectDeployedUrl(trimmed);
    }

    setIsInspecting(true);
    try {
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'github',
          repoUrl: trimmed,
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

  // 1b. Inspect Deployed Application URL
  const handleInspectDeployedUrl = async (liveUrl: string) => {
    setIsInspecting(true);
    try {
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'deployed-url',
          liveUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to crawl live application.');
      }

      const data: InspectionResult = await res.json();
      setInspection(data);

      // Automatically point baseUrl to the live application URL
      const targetBase = data.liveUrl || liveUrl;
      const updatedConfig = { ...config, baseUrl: targetBase };
      handleSaveConfig(updatedConfig);

      const synthesizedTests = generateHeuristicTestCases(data, targetBase);
      setTestCases(synthesizedTests);
    } catch (err: any) {
      alert(`Live Application Inspection Error: ${err.message}`);
    } finally {
      setIsInspecting(false);
    }
  };

  // 1c. Inspect Uploaded ZIP Project Archive
  const handleInspectZip = async (file: File, targetBaseUrl?: string) => {
    setIsInspecting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceType', 'zip');

      const res = await fetch('/api/inspect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to decompress and inspect ZIP file.');
      }

      const data: InspectionResult = await res.json();
      setInspection(data);

      const effectiveBase = targetBaseUrl || config.baseUrl;
      if (targetBaseUrl && targetBaseUrl !== config.baseUrl) {
        handleSaveConfig({ ...config, baseUrl: targetBaseUrl });
      }

      const synthesizedTests = generateHeuristicTestCases(data, effectiveBase);
      setTestCases(synthesizedTests);
    } catch (err: any) {
      alert(`ZIP Inspection Error: ${err.message}`);
    } finally {
      setIsInspecting(false);
    }
  };

  // 1d. Handle Processed Local Folder Result
  const handleInspectLocalFolderResult = (data: InspectionResult, targetBaseUrl?: string) => {
    setInspection(data);
    const effectiveBase = targetBaseUrl || config.baseUrl;
    if (targetBaseUrl && targetBaseUrl !== config.baseUrl) {
      handleSaveConfig({ ...config, baseUrl: targetBaseUrl });
    }
    const synthesizedTests = generateHeuristicTestCases(data, effectiveBase);
    setTestCases(synthesizedTests);
  };

  // Quick preset selector
  const handleSelectPreset = (preset: RepoPreset) => {
    setInspection(preset.inspectionData);
    let targetBase = config.baseUrl;
    if (preset.liveUrl) {
      targetBase = preset.liveUrl;
      handleSaveConfig({ ...config, baseUrl: preset.liveUrl });
    }
    const tests = generateHeuristicTestCases(preset.inspectionData, targetBase);
    setTestCases(tests);
  };

  // 2. Synthesize Tests with Gemini
  const handleGenerateTests = async () => {
    if (!inspection) return;
    setIsGenerating(true);

    const effectiveBaseUrl = inspection.liveUrl || inspection.metadata.liveUrl || config.baseUrl;

    try {
      const res = await fetch('/api/gemini/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection,
          baseUrl: effectiveBaseUrl,
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
      const fallbackTests = generateHeuristicTestCases(inspection, effectiveBaseUrl);
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

    const executionBaseUrl = inspection?.liveUrl || inspection?.metadata.liveUrl || config.baseUrl;

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
              baseUrl: executionBaseUrl,
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

  // GitHub Account & Repository Selection Handlers
  const handleConnectUser = (user: GitHubUser, token?: string, repos?: GitHubRepository[]) => {
    setConnectedUser(user);
    localStorage.setItem('autoqa_github_user', JSON.stringify(user));
    if (token) {
      const updatedConfig = { ...config, githubToken: token };
      handleSaveConfig(updatedConfig);
    }
  };

  const handleDisconnectGitHub = () => {
    setConnectedUser(null);
    setSelectedRepoFullName('');
    localStorage.removeItem('autoqa_github_user');
    localStorage.removeItem('autoqa_selected_repo');
  };

  const handleSelectRepo = (repo: GitHubRepository) => {
    setSelectedRepoFullName(repo.full_name);
    localStorage.setItem('autoqa_selected_repo', repo.full_name);
    setIsConnectRepoModalOpen(false);
    setActiveTab('inspect');
    handleInspect(repo.html_url);
  };

  const completedCount = testCases.filter((t) => t.status === 'passed' || t.status === 'failed').length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsConfigModalOpen(true)}
        onOpenConnectRepo={() => setIsConnectRepoModalOpen(true)}
        connectedUser={connectedUser}
        selectedRepoFullName={selectedRepoFullName}
        config={config}
        testCount={testCases.length}
        completedCount={completedCount}
        projectSource={inspection?.sourceType || inspection?.metadata.sourceType}
        projectLabel={inspection?.metadata.projectName || inspection?.metadata.repo}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inspect' && (
          <RepoInspector
            inspection={inspection}
            onInspect={handleInspect}
            onInspectZip={handleInspectZip}
            onInspectDeployedUrl={handleInspectDeployedUrl}
            onInspectLocalFolderResult={handleInspectLocalFolderResult}
            isLoading={isInspecting}
            onProceedToMatrix={() => setActiveTab('matrix')}
            onSelectPreset={handleSelectPreset}
            onOpenConnectRepo={() => setIsConnectRepoModalOpen(true)}
            connectedUser={connectedUser}
            selectedRepoFullName={selectedRepoFullName}
            configuredBaseUrl={config.baseUrl}
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

      <ConnectRepoModal
        isOpen={isConnectRepoModalOpen}
        onClose={() => setIsConnectRepoModalOpen(false)}
        connectedUser={connectedUser}
        onConnectUser={handleConnectUser}
        onDisconnect={handleDisconnectGitHub}
        onSelectRepo={handleSelectRepo}
        selectedRepoFullName={selectedRepoFullName}
        initialToken={config.githubToken}
      />
    </div>
  );
}
