'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Play, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  Plus, 
  Copy, 
  Check, 
  AlertCircle,
  Shield, 
  Radio, 
  Cpu, 
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { TestCase, TestCategory, TestSeverity } from '@/types';

interface TestMatrixProps {
  testCases: TestCase[];
  onToggleTest: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
  onRegenerate: () => Promise<void>;
  isGenerating: boolean;
  onLaunchExecution: () => void;
  onAddCustomTest: (test: TestCase) => void;
  geminiModel: string;
}

export const TestMatrix: React.FC<TestMatrixProps> = ({
  testCases,
  onToggleTest,
  onToggleAll,
  onRegenerate,
  isGenerating,
  onLaunchExecution,
  onAddCustomTest,
  geminiModel,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(testCases[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Custom Test state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TestCategory>('UI');
  const [newRoute, setNewRoute] = useState('/');
  const [newDescription, setNewDescription] = useState('');

  const selectedCount = testCases.filter((t) => t.selected).length;
  const allSelected = testCases.length > 0 && selectedCount === testCases.length;

  const categories = [
    { id: 'all', label: 'All Tests', count: testCases.length },
    { id: 'UI', label: 'UI Flows', count: testCases.filter((t) => t.category === 'UI').length },
    { id: 'API', label: 'API Pathways', count: testCases.filter((t) => t.category === 'API').length },
    { id: 'Auth', label: 'Auth Pathways', count: testCases.filter((t) => t.category === 'Auth').length },
    { id: 'Integration', label: 'Integration', count: testCases.filter((t) => t.category === 'Integration').length },
  ];

  const filteredTests = testCases.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  const handleCopyScript = (id: string, script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCustomTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const customTest: TestCase = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      severity: 'medium',
      targetRoute: newRoute,
      description: newDescription || `Custom user-defined ${newCategory} test case for ${newRoute}`,
      preconditions: ['Browser session initialized'],
      steps: [
        { order: 1, action: 'navigate', target: newRoute, expected: 'Page loaded' },
        { order: 2, action: 'assert', target: 'body', expected: 'Content is visible' },
      ],
      assertions: [
        { type: 'element_visible', target: 'body', expected: true }
      ],
      playwrightScript: `import { test, expect } from '@playwright/test';

test('${newCategory}: ${newTitle}', async ({ page }) => {
  await page.goto('${newRoute}');
  await expect(page.locator('body')).toBeVisible();
});`,
      status: 'pending',
      selected: true,
    };

    onAddCustomTest(customTest);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 border border-violet-500/30 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Phase 2 • Smart Test Suite Synthesis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Auto-Generated QA Test Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generated via <strong className="text-violet-300">{geminiModel}</strong> based on detected routes, forms, and auth guard specifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onRegenerate()}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isGenerating ? 'Regenerating...' : 'Regenerate Suite'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Plus className="h-4 w-4 text-cyan-400" />
            <span>Add Custom Test</span>
          </button>

          <button
            onClick={onLaunchExecution}
            disabled={selectedCount === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Execute {selectedCount} Tests in Cloud</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Selection Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeCategory === cat.id ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onToggleAll(!allSelected)}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-300 transition"
        >
          {allSelected ? <CheckSquare className="h-4 w-4 text-cyan-400" /> : <Square className="h-4 w-4" />}
          <span>{allSelected ? 'Deselect All' : 'Select All'} ({selectedCount} selected)</span>
        </button>
      </div>

      {/* Test Cases List */}
      <div className="space-y-3.5">
        {filteredTests.map((test) => {
          const isExpanded = expandedTestId === test.id;
          const isCopied = copiedId === test.id;

          return (
            <div
              key={test.id}
              className={`rounded-2xl border transition-all ${
                test.selected
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-slate-900 bg-slate-950/40 opacity-70'
              }`}
            >
              {/* Card Header Row */}
              <div className="flex items-start sm:items-center justify-between p-4 sm:p-5 gap-3">
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleTest(test.id)}
                    className="mt-0.5 sm:mt-0 text-slate-400 hover:text-cyan-400 transition shrink-0"
                  >
                    {test.selected ? (
                      <CheckSquare className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">{test.title}</h4>
                      
                      {/* Category Badge */}
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                        test.category === 'UI'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          : test.category === 'API'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : test.category === 'Auth'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {test.category}
                      </span>

                      {/* Severity Pill */}
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium border ${
                        test.severity === 'critical'
                          ? 'bg-red-500/10 text-red-300 border-red-500/30'
                          : test.severity === 'high'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {test.severity.toUpperCase()}
                      </span>

                      {/* Route Pill */}
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {test.targetRoute}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
                  >
                    <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Details & Code'}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Details Body */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/50 p-5 space-y-4 rounded-b-2xl">
                  {/* Step Sequence Timeline */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Execution Step Sequence</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {test.steps.map((step) => (
                        <div
                          key={step.order}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                            {step.order}
                          </span>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-mono text-[11px] font-bold text-cyan-400 uppercase">
                              [{step.action}]
                            </span>
                            <p className="font-mono text-[11px] text-slate-300 truncate">
                              target: {step.target}
                            </p>
                            <p className="text-[11px] text-slate-400">Expects: {step.expected}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Playwright Script Snippet */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5 text-violet-400" />
                        <span>Playwright Cloud Automation Script (Browserbase Compatible)</span>
                      </span>
                      <button
                        onClick={() => handleCopyScript(test.id, test.playwrightScript)}
                        className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Playwright Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="max-h-64 overflow-auto rounded-xl border border-slate-800 bg-[#060a12] p-4 font-mono text-[11px] text-slate-300 leading-relaxed">
                      {test.playwrightScript}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Test Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1322] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Custom Test Scenario</h3>
            <form onSubmit={handleCreateCustomTest} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Test Title</label>
                <input
                  type="text"
                  placeholder="e.g. Verify Newsletter Subscription Modal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TestCategory)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="UI">UI</option>
                    <option value="API">API</option>
                    <option value="Auth">Auth</option>
                    <option value="Integration">Integration</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Target Route</label>
                  <input
                    type="text"
                    placeholder="/newsletter"
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Description</label>
                <textarea
                  placeholder="Describe target behavior and expected assertions..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-4 py-1.5 font-semibold text-black hover:bg-cyan-400"
                >
                  Add Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
