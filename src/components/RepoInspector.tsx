'use client';

import React, { useState, useRef } from 'react';
import {
  GitBranch,
  Search,
  Sparkles,
  Zap,
  ShieldCheck,
  Server,
  Layout,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Layers,
  Code2,
  Lock,
  ChevronRight,
  Github,
  Mail,
  BookOpen,
  Workflow,
  BarChart3,
  CircleCheck,
  ArrowUpRight,
  Globe,
  FileArchive,
  FolderCode,
  Upload,
  Link as LinkIcon,
  HardDrive,
  Check,
  AlertCircle
} from 'lucide-react';
import { InspectionResult, RouteItem, GitHubUser, ProjectSourceType } from '@/types';
import { REPO_PRESETS, RepoPreset } from '@/lib/presets';
import { inspectBrowserFileList } from '@/lib/client-folder-inspector';

interface RepoInspectorProps {
  inspection: InspectionResult | null;
  onInspect: (repoUrl: string) => Promise<void>;
  onInspectZip?: (file: File, baseUrl?: string) => Promise<void>;
  onInspectDeployedUrl?: (url: string) => Promise<void>;
  onInspectLocalFolderResult?: (result: InspectionResult, baseUrl?: string) => void;
  isLoading: boolean;
  onProceedToMatrix: () => void;
  onSelectPreset: (preset: RepoPreset) => void;
  onOpenConnectRepo?: () => void;
  connectedUser?: GitHubUser | null;
  selectedRepoFullName?: string;
  configuredBaseUrl?: string;
}

export const RepoInspector: React.FC<RepoInspectorProps> = ({
  inspection,
  onInspect,
  onInspectZip,
  onInspectDeployedUrl,
  onInspectLocalFolderResult,
  isLoading,
  onProceedToMatrix,
  onSelectPreset,
  onOpenConnectRepo,
  connectedUser,
  selectedRepoFullName,
  configuredBaseUrl = 'http://localhost:3000',
}) => {
  // Source tabs: 'deployed' | 'zip' | 'folder' | 'github' | 'presets'
  const [activeSourceTab, setActiveSourceTab] = useState<'deployed' | 'zip' | 'folder' | 'github' | 'presets'>('deployed');

  // Input states
  const [liveUrlInput, setLiveUrlInput] = useState('https://demo.vercel.store');
  const [githubInput, setGithubInput] = useState('https://github.com/shadcn-ui/taxonomy');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipBaseUrl, setZipBaseUrl] = useState(configuredBaseUrl);
  const [folderBaseUrl, setFolderBaseUrl] = useState(configuredBaseUrl);
  const [selectedFolderFilesCount, setSelectedFolderFilesCount] = useState<number | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [localFolderStatus, setLocalFolderStatus] = useState<string>('');

  // Route filters & snippet modal
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<'all' | 'page' | 'api' | 'auth-route' | 'protected'>('all');
  const [selectedSnippetFile, setSelectedSnippetFile] = useState<string | null>(null);

  // Hidden file inputs
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Sync githubInput when a repository is selected from ConnectRepoModal
  React.useEffect(() => {
    if (selectedRepoFullName) {
      setGithubInput(`https://github.com/${selectedRepoFullName}`);
      setActiveSourceTab('github');
    }
  }, [selectedRepoFullName]);

  // Handle Deployed URL Submit
  const handleDeployedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveUrlInput.trim()) return;
    if (onInspectDeployedUrl) {
      onInspectDeployedUrl(liveUrlInput.trim());
    } else {
      onInspect(liveUrlInput.trim());
    }
  };

  // Handle GitHub Submit
  const handleGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (githubInput.trim()) {
      onInspect(githubInput.trim());
    }
  };

  // Handle ZIP File Upload
  const handleZipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setZipFile(file);
    }
  };

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) return;

    if (onInspectZip) {
      await onInspectZip(zipFile, zipBaseUrl);
    } else {
      // Fallback via FormData
      const formData = new FormData();
      formData.append('file', zipFile);
      formData.append('sourceType', 'zip');

      const res = await fetch('/api/inspect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`ZIP Inspection Error: ${err.error || 'Failed to inspect zip file'}`);
        return;
      }

      const data: InspectionResult = await res.json();
      if (onInspectLocalFolderResult) {
        onInspectLocalFolderResult(data, zipBaseUrl);
      }
    }
  };

  // Handle Local Folder Selection
  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const folderName = firstPath.split('/')[0] || 'Local Project';
    setSelectedFolderName(folderName);
    setSelectedFolderFilesCount(files.length);
    setLocalFolderStatus(`Selected ${files.length} files from "${folderName}". Click "Inspect Local Folder" to process.`);
  };

  const handleProcessLocalFolder = async () => {
    if (!folderInputRef.current?.files || folderInputRef.current.files.length === 0) return;
    try {
      setLocalFolderStatus('Analyzing local codebase, isolating routes & pruning assets...');
      const result = await inspectBrowserFileList(folderInputRef.current.files, selectedFolderName || 'Local Project');
      if (onInspectLocalFolderResult) {
        onInspectLocalFolderResult(result, folderBaseUrl);
      }
      setLocalFolderStatus('');
    } catch (err: any) {
      alert(`Local folder analysis error: ${err.message}`);
      setLocalFolderStatus('');
    }
  };

  const filteredRoutes = inspection?.detectedRoutes.filter((r) => {
    if (selectedRouteFilter === 'all') return true;
    return r.type === selectedRouteFilter;
  }) || [];

  const currentSourceType = inspection?.sourceType || inspection?.metadata.sourceType || 'github';

  return (
    <div className="space-y-10">

      {/* Hero Banner / Universal Multi-Source Hub */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-[#090d16] p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl">

          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30 mb-4">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Phase 1 • Multi-Source Project Inspection & Token Optimization</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Inspect Any Web Project & Discover{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Automated Test Surfaces
            </span>
          </h1>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-3xl">
            Not limited to GitHub! Test <strong>live deployed websites</strong>, upload <strong>ZIP archives</strong>,
            inspect <strong>local project folders</strong>, or connect <strong>GitHub repositories</strong>.
            Smart AST & DOM tree pruning saves over <strong>98% in AI context tokens</strong>.
          </p>

          {/* Source Selection Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-950/90 p-1.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSourceTab('deployed')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeSourceTab === 'deployed'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>Live Deployed URL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSourceTab('zip')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeSourceTab === 'zip'
                  ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <FileArchive className="h-4 w-4 text-amber-400" />
              <span>ZIP Project Archive</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSourceTab('folder')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeSourceTab === 'folder'
                  ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <FolderCode className="h-4 w-4 text-emerald-400" />
              <span>Local Project Folder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSourceTab('github')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeSourceTab === 'github'
                  ? 'bg-gradient-to-r from-violet-500/30 to-indigo-500/30 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Github className="h-4 w-4 text-violet-400" />
              <span>GitHub Repository</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSourceTab('presets')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeSourceTab === 'presets'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Curated Presets</span>
            </button>
          </div>

          {/* TAB 1: LIVE DEPLOYED APPLICATION */}
          {activeSourceTab === 'deployed' && (
            <div className="mt-5 space-y-4">
              <form onSubmit={handleDeployedSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Enter deployed URL (e.g. https://my-app.vercel.app or http://localhost:3000)"
                    value={liveUrlInput}
                    onChange={(e) => setLiveUrlInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !liveUrlInput.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Crawling Live App...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Inspect Live App</span>
                    </>
                  )}
                </button>
              </form>

              {/* Live quick sample pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500">Quick Live Probes:</span>
                {[
                  { label: 'Vercel Commerce (Live)', url: 'https://demo.vercel.store' },
                  { label: 'Next.js Official', url: 'https://nextjs.org' },
                  { label: 'Localhost (Port 3000)', url: 'http://localhost:3000' },
                ].map((probe) => (
                  <button
                    key={probe.url}
                    type="button"
                    onClick={() => {
                      setLiveUrlInput(probe.url);
                      if (onInspectDeployedUrl) onInspectDeployedUrl(probe.url);
                      else onInspect(probe.url);
                    }}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition"
                  >
                    {probe.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ZIP PROJECT ARCHIVE */}
          {activeSourceTab === 'zip' && (
            <div className="mt-5 space-y-4">
              <form onSubmit={handleZipSubmit} className="space-y-4">
                <input
                  type="file"
                  ref={zipInputRef}
                  onChange={handleZipFileChange}
                  accept=".zip"
                  className="hidden"
                />

                <div
                  onClick={() => zipInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl bg-amber-950/10 hover:bg-amber-950/20 p-6 text-center transition group"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition">
                    <FileArchive className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-white">
                    {zipFile ? zipFile.name : 'Select or Drop Project ZIP File (.zip)'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {zipFile
                      ? `${(zipFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to decompress and extract routes`
                      : 'Upload exported project archive, microservice, or local repository'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      Target Test URL:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. http://localhost:3000 or https://staging.example.com"
                      value={zipBaseUrl}
                      onChange={(e) => setZipBaseUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-32 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !zipFile}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-500 transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Decompressing & Parsing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Inspect ZIP Project</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: LOCAL PROJECT FOLDER */}
          {activeSourceTab === 'folder' && (
            <div className="mt-5 space-y-4">
              <input
                type="file"
                ref={folderInputRef}
                onChange={handleFolderChange}
                // @ts-ignore: non-standard webkitdirectory attribute
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
              />

              <div
                onClick={() => folderInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl bg-emerald-950/10 hover:bg-emerald-950/20 p-6 text-center transition group"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
                  <FolderCode className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">
                  {selectedFolderName ? `Folder: ${selectedFolderName}` : 'Select Local Project Directory'}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedFolderFilesCount
                    ? `${selectedFolderFilesCount} total files loaded • 100% private client-side scan`
                    : 'Click to select your local code folder from disk. No files are uploaded to external servers.'}
                </p>
              </div>

              {localFolderStatus && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{localFolderStatus}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Target Test URL:
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. http://localhost:3000"
                    value={folderBaseUrl}
                    onChange={(e) => setFolderBaseUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-32 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleProcessLocalFolder}
                  disabled={isLoading || !selectedFolderFilesCount}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Extracting Routes...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="h-4 w-4" />
                      <span>Inspect Local Folder</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB REPOSITORY */}
          {activeSourceTab === 'github' && (
            <div className="mt-5 space-y-4">
              <form onSubmit={handleGithubSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                  <input
                    type="text"
                    placeholder="Enter GitHub URL (e.g. owner/repo or https://github.com/owner/repo)"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !githubInput.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-cyan-500 transition disabled:opacity-50"
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

              {/* Connected GitHub Repo Action Banner / Pill */}
              {onOpenConnectRepo && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <Github className="h-4 w-4" />
                    </div>
                    {connectedUser ? (
                      <div>
                        <span className="font-semibold text-white">Connected: @{connectedUser.login}</span>
                        <span className="text-slate-400 ml-1.5 hidden sm:inline">
                          {selectedRepoFullName ? `• Active: ${selectedRepoFullName}` : '• Select any repository from your account'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-white">Connect GitHub Account</span>
                        <span className="text-slate-400 ml-1.5 hidden sm:inline">
                          • One-click access to private repositories and higher rate limits
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onOpenConnectRepo}
                    className="flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-slate-800 hover:border-violet-300 transition"
                  >
                    <span>{connectedUser ? 'Switch Repo' : 'Connect Account'}</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CURATED PRESETS */}
          {activeSourceTab === 'presets' && (
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {REPO_PRESETS.map((preset) => {
                  const isCurrent =
                    inspection?.metadata.repo.toLowerCase() === preset.inspectionData.metadata.repo.toLowerCase() ||
                    inspection?.metadata.owner.toLowerCase() === preset.inspectionData.metadata.owner.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectPreset(preset)}
                      className={`text-left rounded-2xl border p-4 transition ${
                        isCurrent
                          ? 'border-cyan-500 bg-cyan-950/20'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-slate-800">
                          {preset.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {preset.stars}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-white line-clamp-1">{preset.name}</h4>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* INSPECTION RESULTS VIEW */}
      {inspection && (
        <div className="space-y-6">

          {/* Source Identification Header Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {currentSourceType === 'deployed-url' ? (
                  <Globe className="h-6 w-6 text-cyan-400" />
                ) : currentSourceType === 'zip' ? (
                  <FileArchive className="h-6 w-6 text-amber-400" />
                ) : currentSourceType === 'local-folder' ? (
                  <FolderCode className="h-6 w-6 text-emerald-400" />
                ) : (
                  <GitBranch className="h-6 w-6 text-violet-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">
                    {inspection.metadata.projectName || `${inspection.metadata.owner}/${inspection.metadata.repo}`}
                  </h2>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300 border border-cyan-500/30">
                    {currentSourceType === 'deployed-url'
                      ? 'Live Deployed App'
                      : currentSourceType === 'zip'
                      ? 'ZIP Project'
                      : currentSourceType === 'local-folder'
                      ? 'Local Filesystem'
                      : 'GitHub Repository'}
                  </span>
                  {inspection.liveUrl && (
                    <a
                      href={inspection.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                    >
                      <span>{inspection.liveUrl}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Framework: <span className="text-slate-200 font-semibold">{inspection.metadata.framework}</span> •
                  Auth: <span className="text-slate-200 font-semibold capitalize">{inspection.metadata.authType}</span> •
                  Router: <span className="text-slate-200 font-semibold">{inspection.metadata.routerType}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onProceedToMatrix}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition shrink-0"
            >
              <span>Generate Test Cases</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Token Optimization Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Raw Source Context</span>
                <Layers className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-200">
                ~{inspection.tokenBudget.rawRepoTokensEstimated.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1">tokens</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {inspection.tokenBudget.filesScanned} total assets/files inspected
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-cyan-300">
                <span className="text-xs font-medium">Targeted Context</span>
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {inspection.tokenBudget.targetedTokensUsed.toLocaleString()}
                <span className="text-xs font-normal text-cyan-400/80 ml-1">tokens</span>
              </p>
              <p className="mt-1 text-[11px] text-cyan-400/70">
                {inspection.tokenBudget.targetedFilesCount} functional route & auth targets isolated
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-emerald-300">
                <span className="text-xs font-medium">Context Token Reduction</span>
                <TrendingDown className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {inspection.tokenBudget.tokensSavedPercentage}%
                <span className="text-xs font-normal text-emerald-400/80 ml-1">saved</span>
              </p>
              <p className="mt-1 text-[11px] text-emerald-400/70">
                Eliminates context token overflow & cuts LLM cost
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-violet-300">
                <span className="text-xs font-medium">Detected Architecture</span>
                <Server className="h-4 w-4 text-violet-400" />
              </div>
              <p className="mt-2 text-lg font-bold text-violet-200 truncate">
                {inspection.metadata.framework}
              </p>
              <p className="mt-1 text-[11px] text-violet-300/70">
                Lang: {inspection.metadata.language || 'TypeScript/JS'} • Auth: {inspection.metadata.authType}
              </p>
            </div>
          </div>

          {/* Detected Routes */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layout className="h-4 w-4 text-cyan-400" />
                  <span>Auto-Discovered Testable Routes ({inspection.detectedRoutes.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Routes extracted from project structure and DOM ready for automated test scenario synthesis
                </p>
              </div>

              {/* Route Type Filters */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                {(['all', 'page', 'api', 'auth-route', 'protected'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedRouteFilter(filter)}
                    className={`rounded-lg px-2.5 py-1 capitalize transition ${
                      selectedRouteFilter === filter
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'auth-route' ? 'Auth' : filter}
                  </button>
                ))}
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
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                          route.type === 'auth-route'
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
                        onClick={() => setSelectedSnippetFile(route.fileSource)}
                        className="text-cyan-400 hover:underline flex items-center gap-0.5 ml-2 shrink-0"
                      >
                        <Code2 className="h-3 w-3" />
                        <span>View Context</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Proceed CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>
                  Ready to synthesize UI, API, Auth, and Integration test cases with Gemini AI
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

          {/* Snippet / Context Modal */}
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

      {/* Product Capabilities & Workflow Section */}
      <section
        id="workflow"
        className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm"
      >
        <div className="border-b border-slate-800 p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
              Universal Test Ingestion Engine
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Any Project. Any Host. Instant QA Automation.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              AutoQA.ai works across all developer setups: live deployed applications, offline ZIP project archives, local code directories, or public/private GitHub repositories. Discover routes, generate production-ready Playwright tests, and run them in cloud browsers with zero friction.
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <div className="border-l-2 border-cyan-400 pl-4 py-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Globe className="h-4 w-4 text-cyan-400" />
                Live Deployed Apps
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Crawl live staging or production URLs, analyze live DOM landmarks, and test actual interactive forms.
              </p>
            </div>

            <div className="border-l-2 border-amber-400 pl-4 py-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FileArchive className="h-4 w-4 text-amber-400" />
                ZIP Project Upload
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Drop any exported project .zip file. Extracts framework routes and auth without cloud repo dependencies.
              </p>
            </div>

            <div className="border-l-2 border-emerald-400 pl-4 py-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FolderCode className="h-4 w-4 text-emerald-400" />
                Local Folder Scan
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Select a local folder on your disk. Scanned locally in 50ms with 100% privacy and zero upload delay.
              </p>
            </div>

            <div className="border-l-2 border-violet-400 pl-4 py-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Github className="h-4 w-4 text-violet-400" />
                GitHub Repositories
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Inspect public GitHub repos or link your account for private repositories with high rate limits.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              End-to-End Execution
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">
              Four steps, zero manual setup
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Move effortlessly from project intake to matrix review, cloud browser execution, and AI failure diagnostics.
            </p>
          </div>

          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-300">
                01
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">1. Inspect Project</h4>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Select a live URL, drop a ZIP, pick a local folder, or enter a GitHub repo. Non-functional assets are automatically pruned.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-xs font-bold text-violet-300">
                02
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">2. Synthesize Matrix</h4>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Google Gemini AI generates full Playwright TypeScript test cases across UI, API, Auth, and Integration categories.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300">
                03
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">3. Run in Cloud Browser</h4>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Launch headless cloud browsers on Browserbase. Monitor live execution steps, network waterfalls, and console telemetry.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300">
                04
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">4. Replays & AI Remediation</h4>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Review session video replays, timeline scrubber, and 1-click Gemini failure root-cause analysis with auto-generated code patches.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-slate-800 pt-8 pb-4">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500 shadow-lg shadow-cyan-500/10">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AutoQA.ai</span>
            </div>
            <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
              Universal AI test automation agent for live deployed sites, ZIP project archives, local folders, and GitHub repositories.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Intake Modes</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-500">
              <span className="block hover:text-cyan-300 cursor-pointer" onClick={() => setActiveSourceTab('deployed')}>Live Deployed Application</span>
              <span className="block hover:text-cyan-300 cursor-pointer" onClick={() => setActiveSourceTab('zip')}>ZIP Archive Ingestion</span>
              <span className="block hover:text-cyan-300 cursor-pointer" onClick={() => setActiveSourceTab('folder')}>Local Codebase Folder</span>
              <span className="block hover:text-cyan-300 cursor-pointer" onClick={() => setActiveSourceTab('github')}>GitHub Repositories</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Intelligence</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-500">
              <span className="block">Google Gemini 1.5 / 2.0</span>
              <span className="block">Browserbase Cloud Sandbox</span>
              <span className="block">Playwright TypeScript Engine</span>
              <span className="block">&gt;98% Context Token Savings</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-900 pt-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-600">
          <p>© {new Date().getFullYear()} AutoQA.ai • Universal Test Automation Agent</p>
          <div className="flex items-center gap-4">
            <span>Secure Cloud Sandbox</span>
            <span>Zero Local Dependencies</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
