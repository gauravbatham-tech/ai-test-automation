'use client';

import React from 'react';
import { 
  Bot, 
  Settings, 
  Play, 
  GitBranch, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  ExternalLink 
} from 'lucide-react';
import { AppConfig } from '@/types';
import { ClerkAuthControl } from './AuthProvider';

interface NavbarProps {
  activeTab: 'inspect' | 'matrix' | 'runner' | 'report';
  setActiveTab: (tab: 'inspect' | 'matrix' | 'runner' | 'report') => void;
  onOpenSettings: () => void;
  config: AppConfig;
  testCount: number;
  completedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  config,
  testCount,
  completedCount,
}) => {
  const steps = [
    { id: 'inspect', label: '1. Repo Inspection', icon: GitBranch },
    { id: 'matrix', label: `2. Test Matrix ${testCount > 0 ? `(${testCount})` : ''}`, icon: Layers },
    { id: 'runner', label: '3. Cloud Runner', icon: Play },
    { id: 'report', label: `4. Replays & Analytics ${completedCount > 0 ? `(${completedCount})` : ''}`, icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-600 shadow-lg shadow-cyan-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">AutoQA<span className="text-cyan-400">.ai</span></span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                Agent v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Gemini AI • Browserbase • Clerk</p>
          </div>
        </div>

        {/* Stepper Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeTab === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{step.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Settings & Clerk Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Badges */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Browserbase</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300 border border-violet-500/20">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span>{config.geminiModel}</span>
            </div>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
            title="Configure API Keys & Environment"
          >
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Clerk Auth Control */}
          <div className="pl-1 border-l border-slate-800">
            <ClerkAuthControl onOpenClerkGuide={onOpenSettings} />
          </div>
        </div>
      </div>
    </header>
  );
};
