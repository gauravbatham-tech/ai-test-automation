'use client';

import React, { useState } from 'react';
import {
  X,
  Key,
  Cpu,
  Globe,
  Terminal,
  Check,
  Sliders,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { AppConfig } from '@/types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0d1322] p-6 shadow-2xl shadow-cyan-950/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Agent Configuration & Credentials</h2>
              <p className="text-xs text-slate-400">Configure Gemini AI, Browserbase cloud runner, & GitHub API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Gemini AI Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-medium text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
              >
                Get Gemini Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy... (leave blank to use smart AST heuristic fallback)"
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Model Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-200">Gemini Model</label>
              <select
                value={formData.geminiModel}
                onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-fast)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-200">Execution Concurrency</label>
              <select
                value={formData.concurrency}
                onChange={(e) => setFormData({ ...formData, concurrency: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value={1}>1 Worker (Sequential)</option>
                <option value={2}>2 Workers (Parallel)</option>
                <option value={4}>4 Workers (High throughput)</option>
              </select>
            </div>
          </div>

          {/* Browserbase Configuration */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Browserbase Cloud Browser Keys</span>
              </span>
              <a
                href="https://browserbase.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
              >
                Browserbase Console <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">API Key</label>
                <input
                  type="password"
                  placeholder="bb_api_... (optional for mock emulator)"
                  value={formData.browserbaseApiKey}
                  onChange={(e) => setFormData({ ...formData, browserbaseApiKey: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Project ID (Optional)</label>
                <input
                  type="text"
                  placeholder="bb_proj_..."
                  value={formData.browserbaseProjectId}
                  onChange={(e) => setFormData({ ...formData, browserbaseProjectId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              If left blank, the agent runs in high-fidelity Cloud Browser Emulation mode with live logs, network telemetry, and synthetic replay video!
            </p>
          </div>

          {/* GitHub Token & Base URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-medium text-slate-200">
                <Key className="h-3.5 w-3.5 text-emerald-400" />
                <span>GitHub Token (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="ghp_... (for private repos)"
                value={formData.githubToken || ''}
                onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-medium text-slate-200">
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                <span>Target Base URL</span>
              </label>
              <input
                type="text"
                placeholder="http://localhost:3000"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 font-medium text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
