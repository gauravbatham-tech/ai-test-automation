'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Github,
  Search,
  Lock,
  Globe,
  Star,
  GitFork,
  Check,
  ExternalLink,
  X,
  Key,
  User,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  LogOut,
  ChevronRight,
  Filter
} from 'lucide-react';
import { GitHubRepository, GitHubUser } from '@/types';

interface ConnectRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedUser: GitHubUser | null;
  onConnectUser: (user: GitHubUser, token?: string, repos?: GitHubRepository[]) => void;
  onDisconnect: () => void;
  onSelectRepo: (repo: GitHubRepository) => void;
  selectedRepoFullName?: string;
  initialToken?: string;
}

export const ConnectRepoModal: React.FC<ConnectRepoModalProps> = ({
  isOpen,
  onClose,
  connectedUser,
  onConnectUser,
  onDisconnect,
  onSelectRepo,
  selectedRepoFullName,
  initialToken = '',
}) => {
  // Connection Form State
  const [connectMethod, setConnectMethod] = useState<'token' | 'username'>('token');
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [usernameInput, setUsernameInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Repositories List State
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');

  // Load repositories when user is connected
  useEffect(() => {
    if (connectedUser && isOpen) {
      fetchRepositories();
    }
  }, [connectedUser, isOpen]);

  // Keep tokenInput synced with initialToken
  useEffect(() => {
    if (initialToken && !tokenInput) {
      setTokenInput(initialToken);
    }
  }, [initialToken]);

  const fetchRepositories = async () => {
    setIsLoadingRepos(true);
    setConnectionError(null);
    try {
      const res = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput || undefined,
          username: connectedUser?.login || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch repositories.');
      }

      setRepositories(data.repositories || []);
    } catch (err: any) {
      console.error('Error fetching repositories:', err);
      setConnectionError(err.message);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Handle Connecting Account
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionError(null);

    try {
      const token = connectMethod === 'token' ? tokenInput.trim() : '';
      const username = connectMethod === 'username' ? usernameInput.trim() : '';

      if (connectMethod === 'token' && !token) {
        throw new Error('Please enter a GitHub Personal Access Token.');
      }
      if (connectMethod === 'username' && !username) {
        throw new Error('Please enter a GitHub username or organization.');
      }

      // 1. Fetch User Profile
      const userRes = await fetch('/api/github/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username }),
      });

      const userData = await userRes.json();
      if (!userRes.ok) {
        throw new Error(userData.error || 'Failed to authenticate with GitHub.');
      }

      const user: GitHubUser = userData.user;

      // 2. Fetch Repositories
      const reposRes = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username: user.login }),
      });

      const reposData = await reposRes.json();
      const repos: GitHubRepository[] = reposData.repositories || [];
      setRepositories(repos);

      // Save connected user
      onConnectUser(user, token || undefined, repos);
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to connect GitHub account.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Unique Languages for filter
  const languages = useMemo(() => {
    const langs = new Set<string>();
    repositories.forEach((r) => {
      if (r.language && r.language !== 'Unknown') langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repositories]);

  // Filtered & Sorted Repositories
  const filteredRepos = useMemo(() => {
    return repositories
      .filter((repo) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = repo.full_name.toLowerCase().includes(q) || repo.name.toLowerCase().includes(q);
          const matchDesc = repo.description?.toLowerCase().includes(q);
          const matchLang = repo.language?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchLang) return false;
        }

        // Privacy filter
        if (filterType === 'public' && repo.private) return false;
        if (filterType === 'private' && !repo.private) return false;

        // Language filter
        if (selectedLanguage !== 'all' && repo.language !== selectedLanguage) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Default: updated
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [repositories, searchQuery, filterType, selectedLanguage, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 bg-[#0c111d] shadow-2xl shadow-cyan-950/50 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">GitHub Repository Explorer</h2>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                  {connectedUser ? 'Connected' : 'Integration'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {connectedUser
                  ? `Browse and select repositories from @${connectedUser.login}`
                  : 'Connect your GitHub account or explore public repositories to run automated tests'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STATE 1: Account NOT Connected */}
          {!connectedUser ? (
            <div className="space-y-6">
              {/* Connect Method Tabs */}
              <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => { setConnectMethod('token'); setConnectionError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                    connectMethod === 'token'
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Personal Access Token (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setConnectMethod('username'); setConnectionError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                    connectMethod === 'username'
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Public Username</span>
                </button>
              </div>

              {/* Form container */}
              <div className="max-w-xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
                {connectMethod === 'token' ? (
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-cyan-400" />
                          <span>GitHub Personal Access Token (PAT)</span>
                        </label>
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Graphify+AutoQA+Agent"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                        >
                          Generate Token on GitHub <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                      <input
                        type="password"
                        placeholder="ghp_... or github_pat_..."
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      />
                    </div>

                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-[11px] text-slate-300 space-y-1">
                      <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-cyan-400" />
                        Why use a Personal Access Token?
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Enables immediate access to both <strong>public and private repositories</strong>, bypasses anonymous IP rate limits (5,000 requests/hr), and allows repository code tree inspection without restrictions.
                      </p>
                    </div>

                    {connectionError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        <span>{connectionError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isConnecting || !tokenInput.trim()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying & Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Github className="h-4 w-4" />
                          <span>Connect GitHub Account</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                        GitHub Username or Organization
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. gauravbatham-tech, vercel, shadcn-ui"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      />
                    </div>

                    {/* Quick Suggestions */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                      <div className="flex flex-wrap gap-2">
                        {['gauravbatham-tech', 'shadcn-ui', 'vercel', 'clerk'].map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setUsernameInput(name)}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-cyan-300 hover:border-cyan-500/40 hover:bg-slate-900 transition font-mono"
                          >
                            @{name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {connectionError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        <span>{connectionError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isConnecting || !usernameInput.trim()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500 transition disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Fetching Public Repositories...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span>Explore Public Repositories</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* STATE 2: Account CONNECTED -> Show Repositories List */
            <div className="space-y-5">
              
              {/* Connected User Profile Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3.5">
                  <img
                    src={connectedUser.avatar_url}
                    alt={connectedUser.login}
                    className="h-12 w-12 rounded-2xl border border-cyan-400/40 object-cover shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{connectedUser.name || connectedUser.login}</span>
                      <a
                        href={connectedUser.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        @{connectedUser.login}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{repositories.length} repositories loaded</span>
                      {connectedUser.total_private_repos !== undefined && (
                        <span>• {connectedUser.total_private_repos} private</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchRepositories}
                    disabled={isLoadingRepos}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                    title="Reload repositories from GitHub"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={onDisconnect}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 transition"
                    title="Disconnect this GitHub account"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search repositories by name, language, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Visibility Filters */}
                  <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
                    {(['all', 'public', 'private'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`rounded-lg px-2.5 py-1 capitalize font-medium transition ${
                          filterType === type
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Language Selector */}
                  {languages.length > 0 && (
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="all">All Languages</option>
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  )}

                  {/* Sort Selector */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="updated">Recently Updated</option>
                    <option value="stars">Most Stars</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Repositories List */}
              {isLoadingRepos ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Loading repositories from GitHub...</span>
                </div>
              ) : filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {filteredRepos.map((repo) => {
                    const isSelected = selectedRepoFullName === repo.full_name;
                    return (
                      <div
                        key={repo.id}
                        onClick={() => onSelectRepo(repo)}
                        className={`group relative flex flex-col justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                            : 'border-slate-800/80 bg-slate-950/60 hover:border-cyan-500/40 hover:bg-slate-900/40 hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold text-white group-hover:text-cyan-300 transition text-xs sm:text-sm truncate">
                                {repo.name}
                              </span>
                              {repo.private ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/20 shrink-0">
                                  <Lock className="h-2.5 w-2.5" />
                                  Private
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/20 shrink-0">
                                  <Globe className="h-2.5 w-2.5" />
                                  Public
                                </span>
                              )}
                            </div>

                            {isSelected ? (
                              <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40 shrink-0">
                                <Check className="h-3 w-3 text-cyan-400" />
                                Active
                              </span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[11px] font-semibold text-cyan-400 shrink-0">
                                <span>Select</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {repo.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Meta footer */}
                        <div className="mt-3.5 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-3">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                                <span>{repo.language}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400" />
                              <span>{repo.stargazers_count}</span>
                            </span>
                            {repo.forks_count > 0 && (
                              <span className="flex items-center gap-1">
                                <GitFork className="h-3 w-3 text-slate-400" />
                                <span>{repo.forks_count}</span>
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono">
                            {repo.default_branch}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-300">No repositories found</p>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search query or visibility filters.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/60 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>GitHub REST API v3 Integration</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
