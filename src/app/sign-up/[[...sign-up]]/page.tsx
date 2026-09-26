'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(publishableKey && publishableKey.startsWith('pk_'));

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Link href="/" className="flex items-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-600 shadow-lg shadow-cyan-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            AutoQA<span className="text-cyan-400">.ai</span>
          </span>
        </Link>
        <h1 className="text-lg font-bold text-white">Create your AutoQA Account</h1>
        <p className="text-xs text-slate-400">Protected by Clerk Identity Management</p>
      </div>

      {/* Clerk SignUp or Setup Notice */}
      {isClerkConfigured ? (
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
        />
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d1322] p-6 shadow-2xl space-y-4 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <span>Clerk Registration Ready</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Configure your Clerk publishable key in <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">.env.local</code> to activate real OAuth and email signups.
          </p>
          <pre className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-cyan-300 border border-slate-800">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...&#10;CLERK_SECRET_KEY=sk_test_...
          </pre>
          <div className="pt-2 flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline text-xs"
            >
              Get Free Clerk Keys &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
