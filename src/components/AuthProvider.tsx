'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton, useUser, useClerk } from '@clerk/nextjs';
import { User, LogIn, LogOut, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

interface MockAuthContextType {
  isSignedIn: boolean;
  user: {
    fullName: string;
    primaryEmailAddress: { emailAddress: string };
    imageUrl: string;
  } | null;
  signIn: () => void;
  signOut: () => void;
  isClerkConfigured: boolean;
}

const MockAuthContext = createContext<MockAuthContextType>({
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signOut: () => {},
  isClerkConfigured: false,
});

export const useAuthContext = () => useContext(MockAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(publishableKey && publishableKey.startsWith('pk_'));

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<{
    fullName: string;
    primaryEmailAddress: { emailAddress: string };
    imageUrl: string;
  } | null>(null);

  // If live Clerk keys are provided, use official ClerkProvider
  if (isClerkConfigured) {
    return (
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={{
          variables: {
            colorPrimary: '#06b6d4',
            colorBackground: '#0d1322',
            colorText: '#f8fafc',
            colorInputBackground: '#1e293b',
            colorInputText: '#f8fafc',
          },
        }}
      >
        {children}
      </ClerkProvider>
    );
  }

  // Graceful fallback for local development before keys are added
  const handleSignIn = () => {
    setIsSignedIn(true);
    setUser({
      fullName: 'QA Lead Engineer',
      primaryEmailAddress: { emailAddress: 'tester@enterprise.dev' },
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    });
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setUser(null);
  };

  return (
    <MockAuthContext.Provider
      value={{
        isSignedIn,
        user,
        signIn: handleSignIn,
        signOut: handleSignOut,
        isClerkConfigured: false,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

// Unified Auth Controls for Navbar (switches between Clerk & Mock mode seamlessly)
export const ClerkAuthControl: React.FC<{ onOpenClerkGuide?: () => void }> = ({ onOpenClerkGuide }) => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(publishableKey && publishableKey.startsWith('pk_'));

  if (isClerkConfigured) {
    return (
      <div className="flex items-center gap-3">
        <SignedIn>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-300 font-medium">Clerk Auth</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex items-center gap-2">
            <a
              href="/sign-in"
              className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              Sign Up
            </a>
          </div>
        </SignedOut>
      </div>
    );
  }

  // Fallback Mock Auth buttons when Clerk keys are pending
  return <MockAuthButtons onOpenClerkGuide={onOpenClerkGuide} />;
};

const MockAuthButtons: React.FC<{ onOpenClerkGuide?: () => void }> = ({ onOpenClerkGuide }) => {
  const { isSignedIn, user, signIn, signOut } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      {isSignedIn && user ? (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40 transition"
          >
            <img
              src={user.imageUrl}
              alt={user.fullName}
              className="h-5 w-5 rounded-full object-cover border border-cyan-400/50"
            />
            <span className="hidden sm:inline font-medium text-slate-200">{user.fullName}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-[#0d1322] p-3 shadow-2xl z-50 text-xs space-y-2">
              <div className="border-b border-slate-800 pb-2">
                <p className="font-semibold text-white">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.primaryEmailAddress.emailAddress}</p>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-rose-400 hover:bg-rose-950/30 transition text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={signIn}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <LogIn className="h-3.5 w-3.5 text-cyan-400" />
            <span>Sign In (Clerk)</span>
          </button>
          {onOpenClerkGuide && (
            <button
              onClick={onOpenClerkGuide}
              className="rounded-lg bg-violet-500/10 border border-violet-500/30 px-2 py-1.5 text-[11px] font-medium text-violet-300 hover:bg-violet-500/20 transition hidden sm:inline-flex items-center gap-1"
              title="Configure Clerk API Keys"
            >
              <ShieldCheck className="h-3 w-3 text-violet-400" />
              <span>Keys</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
